import { Router, Response, NextFunction } from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { authenticateToken } from '../middleware/auth';
import config from '../config';
import logger from '../utils/logger';
import { AuthRequest } from '../types';

const router = Router();

router.get('/info', authenticateToken, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const handbrakeVersion = '1.7.0';

    const startTime = process.uptime();

    let diskUsage = { total: 0, used: 0, free: 0 };
    try {
      if (fs.existsSync('/drive')) {
        const stats = fs.statfsSync('/drive');
        diskUsage = {
          total: stats.bsize * stats.blocks,
          free: stats.bsize * stats.bfree,
          used: stats.bsize * (stats.blocks - stats.bfree)
        };
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Error getting disk usage', { error: err.message });
    }

    res.json({
      success: true,
      data: {
        handbrakeVersion,
        nodeVersion: process.version,
        uptime: Math.floor(startTime),
        platform: process.platform,
        arch: process.arch,
        memoryUsage: {
          rss: process.memoryUsage().rss,
          heapTotal: process.memoryUsage().heapTotal,
          heapUsed: process.memoryUsage().heapUsed
        },
        diskUsage
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/cache-dir', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      cacheDir: config.cacheDir,
      maxConcurrentJobs: config.maxConcurrentJobs
    }
  });
});

router.post(
  '/cache-dir',
  authenticateToken,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { path: cachePath, maxConcurrentJobs } = req.body;

      if (cachePath !== undefined) {
        if (!cachePath || typeof cachePath !== 'string') {
          res.status(400).json({
            success: false,
            error: '请提供有效的目录路径'
          });
          return;
        }

        if (!fs.existsSync(cachePath)) {
          res.status(400).json({
            success: false,
            error: '目录不存在'
          });
          return;
        }

        const stats = fs.statSync(cachePath);
        if (!stats.isDirectory()) {
          res.status(400).json({
            success: false,
            error: '路径不是一个目录'
          });
          return;
        }

        try {
          fs.accessSync(cachePath, fs.constants.W_OK);
        } catch (_e) {
          res.status(400).json({
            success: false,
            error: '目录不可写'
          });
          return;
        }

        config.cacheDir = cachePath;
      }

      if (maxConcurrentJobs !== undefined) {
        const num = parseInt(maxConcurrentJobs);
        if (isNaN(num) || num < 1 || num > 10) {
          res.status(400).json({
            success: false,
            error: '同时转码任务数必须在 1-10 之间'
          });
          return;
        }
        config.maxConcurrentJobs = num;
      }

      config.saveConfig();

      res.json({
        success: true,
        data: {
          cacheDir: config.cacheDir,
          maxConcurrentJobs: config.maxConcurrentJobs
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/cache-clear',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!config.cacheDir) {
        res.status(400).json({
          success: false,
          error: '未配置缓存目录'
        });
        return;
      }

      const { type } = req.body;
      const messages: string[] = [];

      const clearDir = (dirPath: string) => {
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      };

      if (type === 'transcode' || type === 'all') {
        const tempDir = path.join(config.cacheDir, 'handbrake-temp');
        clearDir(tempDir);
        messages.push('转码缓存已清理');
      }

      if (type === 'preview' || type === 'all') {
        const thumbnailDir = path.join(config.cacheDir, 'thumbnails');
        clearDir(thumbnailDir);
        messages.push('预览图片缓存已清理');
      }

      if (messages.length === 0) {
        res.status(400).json({
          success: false,
          error: '无效的缓存类型'
        });
        return;
      }

      res.json({
        success: true,
        message: messages.join('，')
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/handbrake/version', authenticateToken, (req: AuthRequest, res: Response) => {
  exec('HandBrakeCLI --version', { timeout: 10000 }, (error: Error | null, stdout: string) => {
    if (error) {
      res.json({
        success: true,
        data: {
          version: 'unknown',
          installed: false
        }
      });
      return;
    }

    const versionMatch = stdout.match(/HandBrake\s+(\d+\.\d+\.\d+)/);

    res.json({
      success: true,
      data: {
        version: versionMatch ? versionMatch[1] : 'unknown',
        installed: true,
        fullOutput: stdout
      }
    });
  });
});

export default router;
