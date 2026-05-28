const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');
const { getDatabase } = require('../models/database');
const config = require('../config');
const { validate } = require('../middleware/validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 }),
  validate,
  async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const db = getDatabase();

      const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Username already exists'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const userId = uuidv4();

      db.prepare(
        `
        INSERT INTO users (id, username, password, role)
        VALUES (?, ?, ?, 'user')
      `
      ).run(userId, username, hashedPassword);

      const token = jwt.sign({ userId, username, role: 'user' }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn
      });

      const refreshToken = jwt.sign({ userId, type: 'refresh' }, config.jwtSecret, {
        expiresIn: config.refreshTokenExpiresIn
      });

      saveRefreshToken(userId, refreshToken);

      res.status(201).json({
        success: true,
        data: {
          token,
          refreshToken,
          user: {
            id: userId,
            username
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
  async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const db = getDatabase();

      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, config.jwtSecret, {
        expiresIn: config.refreshTokenExpiresIn
      });

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

router.post('/refresh', body('refreshToken').notEmpty(), validate, (req, res, next) => {
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
      .get(refreshToken);

    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }

    const newToken = jwt.sign(
      { userId: tokenRecord.user_id, username: tokenRecord.username, role: tokenRecord.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
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
});

router.post('/logout', authenticateToken, (req, res, next) => {
  try {
    const db = getDatabase();

    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.user.userId);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticateToken, (req, res) => {
  const db = getDatabase();
  const user = db
    .prepare('SELECT id, username, role, created_at FROM users WHERE id = ?')
    .get(req.user.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

function saveRefreshToken(userId, token) {
  const db = getDatabase();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

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

module.exports = router;
