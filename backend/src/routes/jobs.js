const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, query } = require('express-validator');
const { getDatabase } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const {
  startTranscode,
  cancelTranscode,
  pauseTranscode,
  resumeTranscode
} = require('../services/handbrakeService');

const router = express.Router();

router.get(
  '/',
  authenticateToken,
  query('status').optional(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  (req, res, next) => {
    try {
      const { status } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const db = getDatabase();
      let whereClause = 'WHERE user_id = ?';
      const params = [req.user.userId];

      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      const total = db
        .prepare(`SELECT COUNT(*) as count FROM jobs ${whereClause}`)
        .get(...params).count;

      const jobs = db
        .prepare(
          `
        SELECT j.*, p.name as preset_name
        FROM jobs j
        LEFT JOIN presets p ON j.preset_id = p.id
        ${whereClause}
        ORDER BY j.created_at DESC
        LIMIT ? OFFSET ?
      `
        )
        .all(...params, limit, offset);

      res.json({
        success: true,
        data: {
          jobs,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id', authenticateToken, (req, res, next) => {
  try {
    const db = getDatabase();

    const job = db
      .prepare(
        `
        SELECT j.*, p.name as preset_name, p.settings as preset_settings
        FROM jobs j
        LEFT JOIN presets p ON j.preset_id = p.id
        WHERE j.id = ? AND j.user_id = ?
      `
      )
      .get(req.params.id, req.user.userId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.preset_settings) {
      job.preset_settings = JSON.parse(job.preset_settings);
    }

    if (job.settings) {
      job.settings = JSON.parse(job.settings);
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authenticateToken,
  body('sourceFile').notEmpty(),
  body('outputFile').notEmpty(),
  body('presetId').optional(),
  validate,
  async (req, res, next) => {
    try {
      const { sourceFile, outputFile, presetId, customSettings } = req.body;
      const db = getDatabase();
      const fs = require('fs');

      // 获取源文件大小
      let sourceFileSize = null;
      try {
        if (fs.existsSync(sourceFile)) {
          const stats = fs.statSync(sourceFile);
          sourceFileSize = stats.size;
        }
      } catch (e) {
        console.error('Failed to get source file size:', e);
      }

      let settings = null;
      if (presetId) {
        const preset = db.prepare('SELECT settings FROM presets WHERE id = ?').get(presetId);
        if (preset) {
          settings = preset.settings;
        }
      } else if (customSettings) {
        settings = JSON.stringify(customSettings);
      }

      const jobId = uuidv4();

      db.prepare(
        `
        INSERT INTO jobs (id, user_id, source_file, output_file, preset_id, settings, status, source_file_size)
        VALUES (?, ?, ?, ?, ?, ?, 'queued', ?)
        `
      ).run(jobId, req.user.userId, sourceFile, outputFile, presetId || null, settings, sourceFileSize);

      const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);

      await startTranscode(job);

      res.status(201).json({
        success: true,
        data: job
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();

    const job = db
      .prepare('SELECT * FROM jobs WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.userId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status === 'processing') {
      await cancelTranscode(job.id);
    }

    db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();

    const job = db
      .prepare('SELECT * FROM jobs WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.userId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status !== 'processing' && job.status !== 'queued') {
      return res.status(400).json({
        success: false,
        error: 'Job cannot be cancelled'
      });
    }

    await cancelTranscode(job.id);

    db.prepare(
      `
        UPDATE jobs SET status = 'cancelled', completed_at = datetime('now')
        WHERE id = ?
      `
    ).run(req.params.id);

    res.json({
      success: true,
      message: 'Job cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/pause', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();

    const job = db
      .prepare('SELECT * FROM jobs WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.userId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status !== 'processing') {
      return res.status(400).json({
        success: false,
        error: 'Job cannot be paused'
      });
    }

    await pauseTranscode(job.id);

    db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run('paused', req.params.id);

    res.json({
      success: true,
      message: 'Job paused successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/resume', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();

    const job = db
      .prepare('SELECT * FROM jobs WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.userId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status !== 'paused') {
      return res.status(400).json({
        success: false,
        error: 'Job cannot be resumed'
      });
    }

    await resumeTranscode(job.id);

    db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run('processing', req.params.id);

    res.json({
      success: true,
      message: 'Job resumed successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats/summary', authenticateToken, (req, res, next) => {
  try {
    const db = getDatabase();

    const stats = db
      .prepare(
        `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM jobs
        WHERE user_id = ?
      `
      )
      .get(req.user.userId);

    const recentJobs = db
      .prepare(
        `
        SELECT id, source_file, output_file, status, progress, created_at
        FROM jobs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 5
      `
      )
      .all(req.user.userId);

    res.json({
      success: true,
      data: {
        ...stats,
        recentJobs
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
