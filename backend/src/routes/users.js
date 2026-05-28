const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.get('/',
  authenticateToken,
  requireAdmin,
  (req, res, next) => {
    try {
      const db = getDatabase();
      
      const users = db.prepare(`
        SELECT id, username, role, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
      `).all();
      
      res.json({
        success: true,
        data: { users }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id/password',
  authenticateToken,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  validate,
  async (req, res, next) => {
    try {
      const db = getDatabase();
      const userId = req.params.id;
      
      if (req.user.role !== 'admin' && req.user.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
      
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      if (req.user.role !== 'admin' && req.user.userId === userId) {
        const isValidPassword = await bcrypt.compare(req.body.currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(400).json({
            success: false,
            error: 'Current password is incorrect'
          });
        }
      }
      
      const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);
      
      db.prepare(`
        UPDATE users
        SET password = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(hashedPassword, userId);
      
      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id',
  authenticateToken,
  requireAdmin,
  (req, res, next) => {
    try {
      const db = getDatabase();
      
      if (req.params.id === req.user.userId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete your own account'
        });
      }
      
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
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

module.exports = router;
