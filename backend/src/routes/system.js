const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const config = require('../config');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/info', authenticateToken, (req, res, next) => {
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
    } catch (error) {
      logger.error('Error getting disk usage', { error: error.message });
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

router.get('/cache-dir', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      cacheDir: config.cacheDir,
      maxConcurrentJobs: config.maxConcurrentJobs
    }
  });
});

router.post('/cache-dir', authenticateToken, (req, res, next) => {
  try {
    const { path: cachePath, maxConcurrentJobs } = req.body;

    if (cachePath !== undefined) {
      if (!cachePath || typeof cachePath !== 'string') {
        return res.status(400).json({
          success: false,
          error: '请提供有效的目录路径'
        });
      }

      if (!fs.existsSync(cachePath)) {
        return res.status(400).json({
          success: false,
          error: '目录不存在'
        });
      }

      const stats = fs.statSync(cachePath);
      if (!stats.isDirectory()) {
        return res.status(400).json({
          success: false,
          error: '路径不是一个目录'
        });
      }

      try {
        fs.accessSync(cachePath, fs.constants.W_OK);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: '目录不可写'
        });
      }

      config.cacheDir = cachePath;
    }

    if (maxConcurrentJobs !== undefined) {
      const num = parseInt(maxConcurrentJobs);
      if (isNaN(num) || num < 1 || num > 10) {
        return res.status(400).json({
          success: false,
          error: '同时转码任务数必须在 1-10 之间'
        });
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
});

router.post('/cache-clear', authenticateToken, async (req, res, next) => {
  try {
    if (!config.cacheDir) {
      return res.status(400).json({
        success: false,
        error: '未配置缓存目录'
      });
    }

    const { type } = req.body;
    const messages = [];

    const clearDir = dirPath => {
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
      return res.status(400).json({
        success: false,
        error: '无效的缓存类型'
      });
    }

    res.json({
      success: true,
      message: messages.join('，')
    });
  } catch (error) {
    next(error);
  }
});

router.get('/handbrake/version', authenticateToken, (req, res) => {
  exec('HandBrakeCLI --version', { timeout: 10000 }, (error, stdout) => {
    if (error) {
      return res.json({
        success: true,
        data: {
          version: 'unknown',
          installed: false
        }
      });
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

module.exports = router;
