import { Router, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, query } from 'express-validator';
import { getDatabase } from '../models/database';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validator';
import path from 'path';
import fs from 'fs';
import config from '../config';
import logger from '../utils/logger';
import {
  startTranscode,
  cancelTranscode,
  pauseTranscode,
  resumeTranscode,
  killAllJobs
} from '../services/handbrakeService';
import { AuthRequest, Job } from '../types';

const router = Router();
const fsPromises = fs.promises;

const VIDEO_EXTENSIONS = [
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

function validateDirectory(dirPath: string): string {
  const resolved = path.resolve(dirPath);
  if (resolved !== dirPath && !dirPath.startsWith('/')) {
    throw new Error('Access denied: path traversal detected');
  }
  return resolved;
}

router.get(
  '/',
  authenticateToken,
  query('status').optional(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 9999 }),
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const statusParam = req.query.status as string | undefined;
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '20');
      const offset = (page - 1) * limit;

      const db = getDatabase();
      let whereClause = 'WHERE user_id = ?';
      const params: unknown[] = [req.user!.userId];

      if (statusParam) {
        const statuses = statusParam
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        if (statuses.length === 1) {
          whereClause += ' AND status = ?';
          params.push(statuses[0]);
        } else if (statuses.length > 1) {
          const placeholders = statuses.map(() => '?').join(', ');
          whereClause += ` AND status IN (${placeholders})`;
          params.push(...statuses);
        }
      }

      const total = (
        db.prepare(`SELECT COUNT(*) as count FROM jobs ${whereClause}`).get(...params) as {
          count: number;
        }
      ).count;

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

router.get('/stats', authenticateToken, (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();

    const rows = db
      .prepare('SELECT status, COUNT(*) as count FROM jobs WHERE user_id = ? GROUP BY status')
      .all(_req.user!.userId) as { status: string; count: number }[];

    const counts: Record<string, number> = {
      all: 0,
      active: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      processing: 0,
      queued: 0
    };

    for (const row of rows) {
      counts.all += row.count;
      if (row.status === 'processing') {
        counts.processing = row.count;
        counts.active += row.count;
      } else if (row.status === 'queued') {
        counts.queued = row.count;
        counts.active += row.count;
      } else if (row.status === 'completed') {
        counts.completed += row.count;
      } else if (row.status === 'failed') {
        counts.failed = row.count;
      } else if (row.status === 'skipped') {
        counts.skipped = row.count;
        counts.completed += row.count;
      }
    }

    res.json({
      success: true,
      data: {
        counts,
        hasProcessing: counts.processing > 0,
        hasQueued: counts.queued > 0
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticateToken, (req: AuthRequest, res: Response, next: NextFunction) => {
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
      .get(req.params.id, req.user!.userId) as Record<string, unknown> | undefined;

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job not found'
      });
      return;
    }

    if (job.preset_settings) {
      job.preset_settings = JSON.parse(job.preset_settings as string);
    }

    if (job.settings) {
      job.settings = JSON.parse(job.settings as string);
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
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!config.cacheDir) {
        res.status(400).json({
          success: false,
          error: '请先在设置中配置缓存目录'
        });
        return;
      }

      const { sourceFile, outputFile, presetId, customSettings } = req.body;
      const db = getDatabase();

      let settings: string | null = null;
      if (presetId) {
        const preset = db.prepare('SELECT settings FROM presets WHERE id = ?').get(presetId) as
          | { settings: string }
          | undefined;
        if (preset) {
          settings = preset.settings;
        }
      } else if (customSettings) {
        settings = JSON.stringify(customSettings);
      }

      const jobId = uuidv4();

      let sourceFileSize: number | null = null;
      try {
        const stats = fs.statSync(sourceFile);
        sourceFileSize = stats.size;
      } catch (e: unknown) {
        const error = e as Error;
        logger.warn('Failed to stat source file', { file: sourceFile, error: error.message });
      }

      db.prepare(
        `
        INSERT INTO jobs (id, user_id, source_file, output_file, preset_id, settings, status, source_file_size)
        VALUES (?, ?, ?, ?, ?, ?, 'queued', ?)
      `
      ).run(
        jobId,
        req.user!.userId,
        sourceFile,
        outputFile,
        presetId || null,
        settings,
        sourceFileSize
      );

      const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as Job;

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

router.delete(
  '/all',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const db = getDatabase();

      const result = db
        // eslint-disable-next-line quotes
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
  }
);

router.delete(
  '/all-force',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const db = getDatabase();

      killAllJobs();

      const result = db.prepare('DELETE FROM jobs').run();

      res.json({
        success: true,
        message: 'All jobs cleared successfully',
        deleted: result.changes
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/queue',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const db = getDatabase();

      const result = db
        // eslint-disable-next-line quotes
        .prepare("DELETE FROM jobs WHERE status = 'queued' AND user_id = ?")
        .run(req.user!.userId);

      res.json({
        success: true,
        message: '队列任务已清空',
        deleted: result.changes
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const db = getDatabase();

      const job = db
        .prepare('SELECT * FROM jobs WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.user!.userId) as Job | undefined;

      if (!job) {
        res.status(404).json({
          success: false,
          error: 'Job not found'
        });
        return;
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
  }
);

router.post(
  '/:id/cancel',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const db = getDatabase();

      const job = db
        .prepare('SELECT * FROM jobs WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.user!.userId) as Job | undefined;

      if (!job) {
        res.status(404).json({
          success: false,
          error: 'Job not found'
        });
        return;
      }

      if (job.status !== 'processing' && job.status !== 'queued') {
        res.status(400).json({
          success: false,
          error: 'Job cannot be cancelled'
        });
        return;
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
  }
);

router.post(
  '/:id/pause',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const db = getDatabase();

      const job = db
        .prepare('SELECT * FROM jobs WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.user!.userId) as Job | undefined;

      if (!job) {
        res.status(404).json({
          success: false,
          error: 'Job not found'
        });
        return;
      }

      if (job.status !== 'processing') {
        res.status(400).json({
          success: false,
          error: 'Job cannot be paused'
        });
        return;
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
  }
);

router.post(
  '/:id/resume',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const db = getDatabase();

      const job = db
        .prepare('SELECT * FROM jobs WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.user!.userId) as Job | undefined;

      if (!job) {
        res.status(404).json({
          success: false,
          error: 'Job not found'
        });
        return;
      }

      if (job.status !== 'paused') {
        res.status(400).json({
          success: false,
          error: 'Job cannot be resumed'
        });
        return;
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
  }
);

router.post(
  '/batch',
  authenticateToken,
  body('sourceDirectory').notEmpty(),
  body('outputDirectory').notEmpty(),
  body('presetId').optional(),
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!config.cacheDir) {
        res.status(400).json({
          success: false,
          error: '请先在设置中配置缓存目录'
        });
        return;
      }

      const {
        sourceDirectory,
        outputDirectory,
        presetId,
        customSettings,
        copyNonVideoFiles,
        moveNonVideoFiles
      } = req.body;

      const safeSourceDir = validateDirectory(sourceDirectory);
      const safeOutputDir = validateDirectory(outputDirectory);

      const db = getDatabase();

      if (!fs.existsSync(safeSourceDir)) {
        res.status(400).json({
          success: false,
          error: '源目录不存在'
        });
        return;
      }

      const findVideoFiles = async (dir: string, depth = 0): Promise<string[]> => {
        if (depth > 20) {
          return [];
        }
        const videoFiles: string[] = [];
        let items: fs.Dirent[];
        try {
          items = await fsPromises.readdir(dir, { withFileTypes: true });
        } catch (_e) {
          return [];
        }

        for (const item of items) {
          const itemPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            const sub = await findVideoFiles(itemPath, depth + 1);
            videoFiles.push(...sub);
          } else {
            const ext = path.extname(item.name).toLowerCase();
            if (VIDEO_EXTENSIONS.includes(ext)) {
              videoFiles.push(itemPath);
            }
          }
        }
        return videoFiles;
      };

      const videoFiles = await findVideoFiles(safeSourceDir);

      if (videoFiles.length === 0) {
        res.status(400).json({
          success: false,
          error: '在源目录中未找到视频文件'
        });
        return;
      }

      const jobIds: string[] = [];

      let settings: string | null = null;
      let format = 'mp4';
      if (presetId) {
        const preset = db.prepare('SELECT settings FROM presets WHERE id = ?').get(presetId) as
          | { settings: string }
          | undefined;
        if (preset) {
          settings = preset.settings;
          const presetSettings = JSON.parse(settings);
          format = presetSettings.format || 'mp4';
        }
      } else if (customSettings) {
        settings = JSON.stringify(customSettings);
      }

      for (const sourceFile of videoFiles) {
        const relativePath = path.relative(safeSourceDir, path.dirname(sourceFile));
        const outputDir = path.join(safeOutputDir, relativePath);

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const fileName = path.basename(sourceFile, path.extname(sourceFile));
        const outputFile = path.join(outputDir, `${fileName}.${format}`);

        const jobId = uuidv4();

        let sourceFileSize: number | null = null;
        try {
          const stats = fs.statSync(sourceFile);
          sourceFileSize = stats.size;
        } catch (_e) {
          // 无法获取文件大小时忽略
        }

        db.prepare(
          `
          INSERT INTO jobs (id, user_id, source_file, output_file, preset_id, settings, status, source_file_size)
          VALUES (?, ?, ?, ?, ?, ?, 'queued', ?)
        `
        ).run(
          jobId,
          req.user!.userId,
          sourceFile,
          outputFile,
          presetId || null,
          settings,
          sourceFileSize
        );

        jobIds.push(jobId);
      }

      for (const jobId of jobIds) {
        try {
          const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as Job | undefined;
          if (job) {
            await startTranscode(job);
          }
        } catch (startError: unknown) {
          const error = startError as Error;
          logger.error('Failed to start job', { jobId, error: error.message });
        }
      }

      if (copyNonVideoFiles) {
        const copyNonVideoRecursive = async (
          src: string,
          dest: string,
          depth = 0
        ): Promise<void> => {
          if (depth > 20) {
            return;
          }
          let entries: fs.Dirent[];
          try {
            entries = await fsPromises.readdir(src, { withFileTypes: true });
          } catch (_e) {
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
              if (!VIDEO_EXTENSIONS.includes(ext)) {
                await fsPromises.mkdir(path.dirname(destPath), { recursive: true });
                await fsPromises.copyFile(srcPath, destPath);
              }
            }
          }
        };
        await copyNonVideoRecursive(safeSourceDir, safeOutputDir);
      }

      if (moveNonVideoFiles) {
        const moveNonVideoRecursive = async (
          src: string,
          dest: string,
          depth = 0
        ): Promise<void> => {
          if (depth > 20) {
            return;
          }
          let entries: fs.Dirent[];
          try {
            entries = await fsPromises.readdir(src, { withFileTypes: true });
          } catch (_e) {
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
              } catch (_e2) {
                /* 非空目录保留，忽略错误 */
              }
            } else {
              const ext = path.extname(entry.name).toLowerCase();
              if (!VIDEO_EXTENSIONS.includes(ext)) {
                await fsPromises.mkdir(path.dirname(destPath), { recursive: true });
                await fsPromises.rename(srcPath, destPath);
              }
            }
          }
        };
        await moveNonVideoRecursive(safeSourceDir, safeOutputDir);
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

export default router;
