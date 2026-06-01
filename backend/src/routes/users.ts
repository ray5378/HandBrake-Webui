import { Router, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../models/database';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { AuthRequest } from '../types';

const router = Router();

router.get(
  '/',
  authenticateToken,
  requireAdmin,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const db = getDatabase();

      const users = db
        .prepare(
          `
        SELECT id, username, role, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
      `
        )
        .all();

      res.json({
        success: true,
        data: { users }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id/password',
  authenticateToken,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const db = getDatabase();
      const userId = req.params.id;

      if (req.user!.role !== 'admin' && req.user!.userId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as
        | { id: string; password: string }
        | undefined;

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      if (req.user!.role !== 'admin' && req.user!.userId === userId) {
        const isValidPassword = await bcrypt.compare(req.body.currentPassword, user.password);
        if (!isValidPassword) {
          res.status(400).json({
            success: false,
            error: 'Current password is incorrect'
          });
          return;
        }
      }

      const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);

      db.prepare(
        `
        UPDATE users
        SET password = ?, updated_at = datetime('now')
        WHERE id = ?
      `
      ).run(hashedPassword, userId);

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const db = getDatabase();

      if (req.params.id === req.user!.userId) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete your own account'
        });
        return;
      }

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/preferences',
  authenticateToken,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const db = getDatabase();
      const rows = db
        .prepare('SELECT key, value FROM user_preferences WHERE user_id = ?')
        .all(req.user!.userId) as { key: string; value: string }[];

      const preferences: Record<string, string> = {};
      for (const row of rows) {
        preferences[row.key] = row.value;
      }

      res.json({ success: true, data: { preferences } });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/preferences',
  authenticateToken,
  body('preferences').isObject(),
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const db = getDatabase();
      const userId = req.user!.userId;
      const preferences: Record<string, string> = req.body.preferences;

      const upsert = db.prepare(`
        INSERT INTO user_preferences (user_id, key, value, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(user_id, key)
        DO UPDATE SET value = excluded.value, updated_at = datetime('now')
      `);

      const transaction = db.transaction(() => {
        for (const [key, value] of Object.entries(preferences)) {
          upsert.run(userId, key, String(value));
        }
      });

      transaction();

      res.json({ success: true, message: 'Preferences updated' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
