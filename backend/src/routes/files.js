const express = require('express');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const { body, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.get(
  '/search',
  authenticateToken,
  query('q').notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const searchQuery = req.query.q.toLowerCase();
      const baseDir = '/drive';
      const results = { files: [], directories: [] };
      const maxResults = 50;

      const videoExtensions = [
        '.mp4', '.mkv', '.avi', '.mov', '.wmv',
        '.flv', '.webm', '.m4v', '.mpg', '.mpeg'
      ];

      const searchDir = async (dirPath, depth = 0) => {
        if (depth > 5) return;
        if (results.files.length + results.directories.length >= maxResults) return;

        let items;
        try {
          items = await fsPromises.readdir(dirPath, { withFileTypes: true });
        } catch {
          return;
        }

        for (const item of items) {
          if (results.files.length + results.directories.length >= maxResults) break;

          const itemPath = path.join(dirPath, item.name);

          if (item.isDirectory()) {
            if (item.name.toLowerCase().includes(searchQuery)) {
              results.directories.push({
                name: item.name,
                path: itemPath,
                type: 'directory'
              });
            }
            await searchDir(itemPath, depth + 1);
          } else {
            const ext = path.extname(item.name).toLowerCase();
            if (videoExtensions.includes(ext) && item.name.toLowerCase().includes(searchQuery)) {
              let stats;
              try {
                stats = fs.statSync(itemPath);
              } catch {
                continue;
              }
              results.files.push({
                name: item.name,
                path: itemPath,
                size: stats.size,
                type: 'video',
                extension: ext
              });
            }
          }
        }
      };

      await searchDir(baseDir);

      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/',
  authenticateToken,
  query('directory').optional(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  (req, res, next) => {
    try {
      const directory = req.query.directory || '/drive';
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const targetDir = path.join(directory.startsWith('/') ? directory : `/${directory}`);
      const absolutePath = path.isAbsolute(targetDir) ? targetDir : path.join('/', targetDir);

      if (!fs.existsSync(absolutePath)) {
        return res.json({
          success: true,
          data: {
            files: [],
            directories: [],
            pagination: { total: 0, page, limit }
          }
        });
      }

      const items = fs.readdirSync(absolutePath, { withFileTypes: true });
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

      const files = [];
      const directories = [];

      for (const item of items) {
        const itemPath = path.join(absolutePath, item.name);

        if (item.isDirectory()) {
          directories.push({
            name: item.name,
            path: itemPath,
            type: 'directory'
          });
        } else {
          const ext = path.extname(item.name).toLowerCase();
          if (videoExtensions.includes(ext)) {
            const stats = fs.statSync(itemPath);
            files.push({
              name: item.name,
              path: itemPath,
              size: stats.size,
              type: 'video',
              extension: ext,
              createdAt: stats.birthtime.toISOString(),
              modifiedAt: stats.mtime.toISOString()
            });
          }
        }
      }

      files.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));

      const total = files.length;
      const paginatedFiles = files.slice(offset, offset + limit);

      res.json({
        success: true,
        data: {
          files: paginatedFiles,
          directories,
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

router.get(
  '/info',
  authenticateToken,
  query('path').notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const { path: filePath } = req.query;

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      const stats = fs.statSync(filePath);
      const { execFile } = require('child_process');

      let ffprobeProcess = null;
      let timeoutId = null;
      let hasResponded = false;

      const fallbackResponse = () => {
        if (!hasResponded) {
          hasResponded = true;
          res.json({
            success: true,
            data: {
              name: path.basename(filePath),
              path: filePath,
              size: stats.size,
              extension: path.extname(filePath),
              createdAt: stats.birthtime.toISOString(),
              modifiedAt: stats.mtime.toISOString()
            }
          });
        }
      };

      ffprobeProcess = execFile(
        'ffprobe',
        ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', filePath],
        { timeout: 10000 }, // 10秒超时
        (error, stdout) => {
          clearTimeout(timeoutId);

          if (error) {
            fallbackResponse();
            return;
          }

          try {
            const info = JSON.parse(stdout);
            const videoStream = info.streams.find(s => s.codec_type === 'video');
            const audioStreams = info.streams.filter(s => s.codec_type === 'audio');

            if (!hasResponded) {
              hasResponded = true;
              res.json({
                success: true,
                data: {
                  name: path.basename(filePath),
                  path: filePath,
                  size: stats.size,
                  extension: path.extname(filePath),
                  duration: parseFloat(info.format.duration) || 0,
                  format: info.format.format_name,
                  createdAt: stats.birthtime.toISOString(),
                  modifiedAt: stats.mtime.toISOString(),
                  video: videoStream
                    ? {
                        codec: videoStream.codec_name,
                        width: videoStream.width,
                        height: videoStream.height,
                        fps: videoStream.r_frame_rate
                          ? videoStream.r_frame_rate.split('/').reduce((a, b) => a / b, 0)
                          : 0,
                        bitrate: parseInt(videoStream.bit_rate) || 0
                      }
                    : null,
                  audio: audioStreams.map(a => ({
                    codec: a.codec_name,
                    channels: a.channels,
                    language: a.tags?.language || 'unknown',
                    bitrate: parseInt(a.bit_rate) || 0
                  }))
                }
              });
            }
          } catch (parseError) {
            fallbackResponse();
          }
        }
      );

      // 备用超时机制，双重保障
      timeoutId = setTimeout(() => {
        if (ffprobeProcess && !hasResponded) {
          ffprobeProcess.kill('SIGTERM');
          fallbackResponse();
        }
      }, 12000); // 12秒备用超时
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/', authenticateToken, query('path').notEmpty(), validate, (req, res, next) => {
  try {
    const { path: filePath } = req.query;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    const fileToDelete = path.resolve(filePath);

    fs.unlinkSync(fileToDelete);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/download', authenticateToken, query('path').notEmpty(), validate, (req, res, next) => {
  try {
    const { path: filePath } = req.query;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    res.download(filePath);
  } catch (error) {
    next(error);
  }
});

router.get(
  '/tree',
  authenticateToken,
  query('path').notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const dir = req.query.path;
      if (!fs.existsSync(dir)) {
        return res.json({ success: true, data: { directories: [] } });
      }

      const scanTree = async (base, relative = '', depth = 0) => {
        if (depth > 20) {
          return [];
        }
        const results = [];
        let items;
        try {
          items = await fsPromises.readdir(base, { withFileTypes: true });
        } catch (e) {
          return [];
        }
        for (const item of items) {
          if (item.isDirectory()) {
            const relPath = relative ? `${relative}/${item.name}` : item.name;
            results.push(relPath);
            const sub = await scanTree(path.join(base, item.name), relPath, depth + 1);
            results.push(...sub);
          }
        }
        return results;
      };

      const directories = await scanTree(dir);
      res.json({ success: true, data: { directories } });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/mkdir', authenticateToken, body('path').notEmpty(), validate, (req, res, next) => {
  try {
    const dir = req.body.path;
    if (fs.existsSync(dir)) {
      return res.status(400).json({ success: false, error: '目录已存在' });
    }
    fs.mkdirSync(dir, { recursive: true });
    res.json({ success: true, data: { path: dir } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
