const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, query } = require('express-validator');
const { getDatabase } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const config = require('../config');
const logger = require('../utils/logger');
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
  query('limit').optional().isInt({ min: 1, max: 9999 }),
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
      if (!config.cacheDir) {
        return res.status(400).json({
          success: false,
          error: '请先在设置中配置缓存目录'
        });
      }

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

      let sourceFileSize = null;
      try {
        const stats = fs.statSync(sourceFile);
        sourceFileSize = stats.size;
      } catch (e) {
        logger.warn('Failed to stat source file', { file: sourceFile, error: e.message });
      }

      db.prepare(
        `
        INSERT INTO jobs (id, user_id, source_file, output_file, preset_id, settings, status, source_file_size)
        VALUES (?, ?, ?, ?, ?, ?, 'queued', ?)
      `
      ).run(
        jobId,
        req.user.userId,
        sourceFile,
        outputFile,
        presetId || null,
        settings,
        sourceFileSize
      );

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
      .prepare("DELETE FROM jobs WHERE status IN ('completed', 'failed', 'cancelled', 'skipped')")
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

router.delete('/all-force', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();

    const processingJobs = db.prepare("SELECT id FROM jobs WHERE status = 'processing'").all();

    for (const job of processingJobs) {
      await cancelTranscode(job.id);
    }

    const result = db.prepare('DELETE FROM jobs').run();

    res.json({
      success: true,
      message: 'All jobs cleared successfully',
      deleted: result.changes
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/queue', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();

    const result = db
      .prepare("DELETE FROM jobs WHERE status = 'queued' AND user_id = ?")
      .run(req.user.userId);

    res.json({
      success: true,
      message: '队列任务已清空',
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
      if (!config.cacheDir) {
        return res.status(400).json({
          success: false,
          error: '请先在设置中配置缓存目录'
        });
      }

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

      if (!fs.existsSync(sourceDirectory)) {
        return res.status(400).json({
          success: false,
          error: '源目录不存在'
        });
      }

      // 递归查找所有视频文件（最多 20 层深度）
      const findVideoFiles = async (dir, depth = 0) => {
        if (depth > 20) {
          return [];
        }
        const videoFiles = [];
        let items;
        try {
          items = await fsPromises.readdir(dir, { withFileTypes: true });
        } catch (e) {
          return [];
        }

        for (const item of items) {
          const itemPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            const sub = await findVideoFiles(itemPath, depth + 1);
            videoFiles.push(...sub);
          } else {
            const ext = path.extname(item.name).toLowerCase();
            if (videoExtensions.includes(ext)) {
              videoFiles.push(itemPath);
            }
          }
        }
        return videoFiles;
      };

      const videoFiles = await findVideoFiles(sourceDirectory);

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

        let sourceFileSize = null;
        try {
          const stats = fs.statSync(sourceFile);
          sourceFileSize = stats.size;
        } catch (e) {
          // 无法获取文件大小时忽略
        }

        db.prepare(
          `
          INSERT INTO jobs (id, user_id, source_file, output_file, preset_id, settings, status, source_file_size)
          VALUES (?, ?, ?, ?, ?, ?, 'queued', ?)
        `
        ).run(
          jobId,
          req.user.userId,
          sourceFile,
          outputFile,
          presetId || null,
          settings,
          sourceFileSize
        );

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
          logger.error('Failed to start job', { jobId, error: startError.message });
        }
      }

      if (copyNonVideoFiles) {
        const copyNonVideoRecursive = async (src, dest, depth = 0) => {
          if (depth > 20) {
            return;
          }
          let entries;
          try {
            entries = await fsPromises.readdir(src, { withFileTypes: true });
          } catch (e) {
            return;
          }
          for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
              await fsPromises.mkdir(destPath, { recursive: true });
              await copyNonVideoRecursive(srcPath, destPath, depth + 1);
            } else {
              const ext = path.extname(entry.name).toLowerCase();
              if (!videoExtensions.includes(ext)) {
                await fsPromises.mkdir(path.dirname(destPath), { recursive: true });
                await fsPromises.copyFile(srcPath, destPath);
              }
            }
          }
        };
        await copyNonVideoRecursive(sourceDirectory, outputDirectory);
      }

      if (moveNonVideoFiles) {
        const moveNonVideoRecursive = async (src, dest, depth = 0) => {
          if (depth > 20) {
            return;
          }
          let entries;
          try {
            entries = await fsPromises.readdir(src, { withFileTypes: true });
          } catch (e) {
            return;
          }
          for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
              await fsPromises.mkdir(destPath, { recursive: true });
              await moveNonVideoRecursive(srcPath, destPath, depth + 1);
              try {
                await fsPromises.rmdir(srcPath);
              } catch (e) {
                /* 非空目录保留，忽略错误 */
              }
            } else {
              const ext = path.extname(entry.name).toLowerCase();
              if (!videoExtensions.includes(ext)) {
                await fsPromises.mkdir(path.dirname(destPath), { recursive: true });
                await fsPromises.rename(srcPath, destPath);
              }
            }
          }
        };
        await moveNonVideoRecursive(sourceDirectory, outputDirectory);
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
