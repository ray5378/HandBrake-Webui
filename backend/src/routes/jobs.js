const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, query } = require('express-validator');
const { getDatabase } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const path = require('path');
const fs = require('fs');
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
        INSERT INTO jobs (id, user_id, source_file, output_file, preset_id, settings, status)
        VALUES (?, ?, ?, ?, ?, ?, 'queued')
      `
      ).run(jobId, req.user.userId, sourceFile, outputFile, presetId || null, settings);

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

router.delete('/all', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();

    const result = db
      .prepare("DELETE FROM jobs WHERE status IN ('completed', 'failed', 'cancelled')")
      .run();

    res.json({
      success: true,
      message: 'Historical jobs cleared successfully',
      deleted: result.changes
    });
  } catch (error) {
    next(error);
  }
});

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

// 批量转码 - 递归处理文件夹
router.post(
  '/batch',
  authenticateToken,
  body('sourceDirectory').notEmpty(),
  body('outputDirectory').notEmpty(),
  body('presetId').optional(),
  validate,
  async (req, res, next) => {
    try {
      const {
        sourceDirectory,
        outputDirectory,
        presetId,
        customSettings,
        copyNonVideoFiles,
        moveNonVideoFiles
      } = req.body;
      const db = getDatabase();

      const videoExtensions = [
        '.mp4',
        '.mkv',
        '.avi',
        '.mov',
        '.wmv',
        '.flv',
        '.webm',
        '.m4v',
        '.mpg',
        '.mpeg'
      ];

      // 递归查找所有视频文件
      const findVideoFiles = dir => {
        const videoFiles = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
          const itemPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            videoFiles.push(...findVideoFiles(itemPath));
          } else {
            const ext = path.extname(item.name).toLowerCase();
            if (videoExtensions.includes(ext)) {
              videoFiles.push(itemPath);
            }
          }
        }
        return videoFiles;
      };

      if (!fs.existsSync(sourceDirectory)) {
        return res.status(400).json({
          success: false,
          error: '源目录不存在'
        });
      }

      const videoFiles = findVideoFiles(sourceDirectory);

      if (videoFiles.length === 0) {
        return res.status(400).json({
          success: false,
          error: '在源目录中未找到视频文件'
        });
      }

      const jobIds = [];

      // 获取预设信息
      let settings = null;
      let format = 'mp4';
      if (presetId) {
        const preset = db.prepare('SELECT settings FROM presets WHERE id = ?').get(presetId);
        if (preset) {
          settings = preset.settings;
          const presetSettings = JSON.parse(settings);
          format = presetSettings.format || 'mp4';
        }
      } else if (customSettings) {
        settings = JSON.stringify(customSettings);
      }

      for (const sourceFile of videoFiles) {
        // 计算相对路径
        const relativePath = path.relative(sourceDirectory, path.dirname(sourceFile));
        // 构建输出路径
        const outputDir = path.join(outputDirectory, relativePath);

        // 确保输出目录存在
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const fileName = path.basename(sourceFile, path.extname(sourceFile));
        const outputFile = path.join(outputDir, `${fileName}.${format}`);

        const jobId = uuidv4();

        db.prepare(
          `
          INSERT INTO jobs (id, user_id, source_file, output_file, preset_id, settings, status)
          VALUES (?, ?, ?, ?, ?, ?, 'queued')
        `
        ).run(jobId, req.user.userId, sourceFile, outputFile, presetId || null, settings);

        jobIds.push(jobId);
      }

      // 逐个启动转码任务
      for (const jobId of jobIds) {
        try {
          const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
          if (job) {
            await startTranscode(job);
          }
        } catch (startError) {
          console.error(`Failed to start job ${jobId}:`, startError);
        }
      }

      if (copyNonVideoFiles) {
        const copyNonVideoRecursive = (src, dest) => {
          const entries = fs.readdirSync(src, { withFileTypes: true });
          for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
              fs.mkdirSync(destPath, { recursive: true });
              copyNonVideoRecursive(srcPath, destPath);
            } else {
              const ext = path.extname(entry.name).toLowerCase();
              if (!videoExtensions.includes(ext)) {
                fs.mkdirSync(path.dirname(destPath), { recursive: true });
                fs.copyFileSync(srcPath, destPath);
              }
            }
          }
        };
        copyNonVideoRecursive(sourceDirectory, outputDirectory);
      }

      if (moveNonVideoFiles) {
        const moveNonVideoRecursive = (src, dest) => {
          const entries = fs.readdirSync(src, { withFileTypes: true });
          for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
              fs.mkdirSync(destPath, { recursive: true });
              moveNonVideoRecursive(srcPath, destPath);
              try {
                fs.rmdirSync(srcPath);
              } catch (e) {
                /* 非空目录保留，忽略错误 */
              }
            } else {
              const ext = path.extname(entry.name).toLowerCase();
              if (!videoExtensions.includes(ext)) {
                fs.mkdirSync(path.dirname(destPath), { recursive: true });
                fs.renameSync(srcPath, destPath);
              }
            }
          }
        };
        moveNonVideoRecursive(sourceDirectory, outputDirectory);
      }

      res.status(201).json({
        success: true,
        data: {
          total: jobIds.length,
          jobIds
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
