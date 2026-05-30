const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const config = require('../config');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/info', authenticateToken, (req, res, next) => {
  try {
    const handbrakeVersion = '1.7.0';

    const startTime = process.uptime();

    let diskUsage = { total: 0, used: 0, free: 0 };
    try {
      const outputDir = config.outputDir;
      if (fs.existsSync(outputDir)) {
        const stats = fs.statfsSync(outputDir);
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

router.get('/directories', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      source: config.uploadDir,
      output: config.outputDir,
      config: config.configDir,
      cache: config.cacheDir
    }
  });
});

router.get('/cache-dir', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      cacheDir: config.cacheDir
    }
  });
});

router.post('/cache-dir', authenticateToken, (req, res, next) => {
  try {
    const { path: cachePath } = req.body;

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
    config.saveConfig();

    res.json({
      success: true,
      data: {
        cacheDir: config.cacheDir
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

    const tempDir = path.join(config.cacheDir, 'handbrake-temp');

    if (!fs.existsSync(tempDir)) {
      return res.json({
        success: true,
        message: '缓存目录已为空'
      });
    }

    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: `清理缓存失败: ${e.message}`
      });
    }

    res.json({
      success: true,
      message: '缓存已清理完成'
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
