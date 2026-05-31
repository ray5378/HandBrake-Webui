import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { body } from 'express-validator';
import { getDatabase } from '../models/database';
import config from '../config';
import { validate } from '../middleware/validator';
import { authenticateToken } from '../middleware/auth';
import logger from '../utils/logger';
import { PASSWORD_CONFIG } from '../constants';
import { AuthRequest } from '../types';

const router = Router();

router.get('/check-initialization', (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    res.json({
      success: true,
      data: {
        initialized: userCount.count > 0
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/setup-admin',
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 }),
  body('confirmPassword').custom((value: string, { req }) => {
    if (value !== (req as Request).body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;
      const db = getDatabase();

      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as {
        count: number;
      };
      if (userCount.count > 0) {
        res.status(400).json({
          success: false,
          error: 'System already initialized'
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, PASSWORD_CONFIG.BCRYPT_ROUNDS);
      const userId = uuidv4();

      db.prepare(
        `
        INSERT INTO users (id, username, password, role)
        VALUES (?, ?, ?, 'admin')
      `
      ).run(userId, username, hashedPassword);

      logger.info('Admin user created', { username });

      const token = jwt.sign({ userId, username, role: 'admin' }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn
      } as any);

      const refreshToken = jwt.sign({ userId, type: 'refresh' }, config.jwtSecret, {
        expiresIn: config.refreshTokenExpiresIn
      } as any);

      saveRefreshToken(userId, refreshToken);

      res.status(201).json({
        success: true,
        data: {
          token,
          refreshToken,
          user: {
            id: userId,
            username,
            role: 'admin'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/login',
  body('username').trim().notEmpty(),
  body('password').notEmpty(),
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;
      const db = getDatabase();

      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as
        | { id: string; username: string; password: string; role: string }
        | undefined;
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as any
      );

      const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, config.jwtSecret, {
        expiresIn: config.refreshTokenExpiresIn
      } as any);

      saveRefreshToken(user.id, refreshToken);

      res.json({
        success: true,
        data: {
          token,
          refreshToken,
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/refresh',
  body('refreshToken').notEmpty(),
  validate,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const db = getDatabase();

      const tokenRecord = db
        .prepare(
          `
        SELECT rt.*, u.username, u.role
        FROM refresh_tokens rt
        JOIN users u ON rt.user_id = u.id
        WHERE rt.token = ? AND rt.expires_at > datetime('now')
      `
        )
        .get(refreshToken) as { user_id: string; username: string; role: string } | undefined;

      if (!tokenRecord) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token'
        });
        return;
      }

      const newToken = jwt.sign(
        { userId: tokenRecord.user_id, username: tokenRecord.username, role: tokenRecord.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as any
      );

      res.json({
        success: true,
        data: {
          token: newToken
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/logout', authenticateToken, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();

    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.user!.userId);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const user = db
    .prepare('SELECT id, username, role, created_at FROM users WHERE id = ?')
    .get(req.user!.userId) as
    | { id: string; username: string; role: string; created_at: string }
    | undefined;

  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  res.json({
    success: true,
    data: user
  });
});

function saveRefreshToken(userId: string, token: string): void {
  const db = getDatabase();
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    `
    INSERT INTO refresh_tokens (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `
  ).run(uuidv4(), userId, token, expiresAt);

  db.prepare(
    `
    DELETE FROM refresh_tokens
    WHERE user_id = ? AND expires_at < datetime('now')
  `
  ).run(userId);
}

export default router;
