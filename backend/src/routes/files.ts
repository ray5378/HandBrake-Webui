import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { execFile } from 'child_process';
import { body, query } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validator';
import config from '../config';
import { generateThumbnails, getThumbnailFilePath } from '../services/thumbnailService';
import { AuthRequest } from '../types';

const router = Router();
const fsPromises = fs.promises;
const DRIVE_ROOT = '/drive';

function isPathSafe(userPath: string): boolean {
  const resolved = path.resolve(DRIVE_ROOT, userPath);
  return (
    resolved.startsWith(path.resolve(DRIVE_ROOT) + path.sep) ||
    resolved === path.resolve(DRIVE_ROOT)
  );
}

function resolveSafePath(userPath: string): string {
  const resolved = path.resolve(DRIVE_ROOT, userPath);
  if (!isPathSafe(userPath)) {
    throw new Error('Access denied: path traversal detected');
  }
  return resolved;
}

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

router.get(
  '/search',
  authenticateToken,
  query('q').notEmpty(),
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const searchQuery = (req.query.q as string).toLowerCase();
      const baseDir = '/drive';
      const results: { files: Record<string, unknown>[]; directories: Record<string, unknown>[] } =
        { files: [], directories: [] };
      const maxResults = 50;

      const searchDir = async (dirPath: string, depth = 0): Promise<void> => {
        if (depth > 5) {
          return;
        }
        if (results.files.length + results.directories.length >= maxResults) {
          return;
        }

        let items: fs.Dirent[];
        try {
          items = await fsPromises.readdir(dirPath, { withFileTypes: true });
        } catch {
          return;
        }

        for (const item of items) {
          if (results.files.length + results.directories.length >= maxResults) {
            break;
          }

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
            if (VIDEO_EXTENSIONS.includes(ext) && item.name.toLowerCase().includes(searchQuery)) {
              let stats: fs.Stats;
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
      if (global.gc) {
        global.gc();
      }
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
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const directory = resolveSafePath(req.query.directory as string);
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '20');
      const offset = (page - 1) * limit;

      if (!fs.existsSync(directory)) {
        res.json({
          success: true,
          data: {
            files: [],
            directories: [],
            pagination: { total: 0, page, limit }
          }
        });
        return;
      }

      const items = fs.readdirSync(directory, { withFileTypes: true });

      const files: {
        name: string;
        path: string;
        size: number;
        type: string;
        extension: string;
        modifiedAt: string;
        modifiedAtMs: number;
      }[] = [];
      const directories: Record<string, unknown>[] = [];

      for (const item of items) {
        const itemPath = path.join(directory, item.name);

        if (item.isDirectory()) {
          directories.push({
            name: item.name,
            path: itemPath,
            type: 'directory'
          });
        } else {
          const ext = path.extname(item.name).toLowerCase();
          if (VIDEO_EXTENSIONS.includes(ext)) {
            const stats = fs.statSync(itemPath);
            files.push({
              name: item.name,
              path: itemPath,
              size: stats.size,
              type: 'video',
              extension: ext,
              modifiedAt: stats.mtime.toISOString(),
              modifiedAtMs: stats.mtime.getTime()
            });
          }
        }
      }

      files.sort((a, b) => b.modifiedAtMs - a.modifiedAtMs);

      const total = files.length;
      const paginatedFiles = files.slice(offset, offset + limit);
      const cleanFiles = paginatedFiles.map(({ modifiedAtMs: _, ...rest }) => rest);

      res.json({
        success: true,
        data: {
          files: cleanFiles,
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
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filePath = resolveSafePath(decodeURIComponent(req.query.path as string));

      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        });
        return;
      }

      const stats = fs.statSync(filePath);

      let ffprobeProcess: ReturnType<typeof execFile> | null = null;
      // eslint-disable-next-line prefer-const
      let timeoutId: NodeJS.Timeout;
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
        { timeout: 10000, maxBuffer: 10 * 1024 * 1024 },
        (error: Error | null, stdout: string) => {
          clearTimeout(timeoutId);

          if (error) {
            fallbackResponse();
            return;
          }

          try {
            const info = JSON.parse(stdout);
            const videoStream = info.streams.find(
              (s: { codec_type: string }) => s.codec_type === 'video'
            );
            const audioStreams = info.streams.filter(
              (s: { codec_type: string }) => s.codec_type === 'audio'
            );

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
                          ? videoStream.r_frame_rate
                              .split('/')
                              .reduce((a: number, b: string) => a / parseInt(b), 0)
                          : 0,
                        bitrate: parseInt(videoStream.bit_rate) || 0
                      }
                    : null,
                  audio: audioStreams.map(
                    (a: {
                      codec_name: string;
                      channels: number;
                      tags?: { language?: string };
                      bit_rate: string;
                    }) => ({
                      codec: a.codec_name,
                      channels: a.channels,
                      language: a.tags?.language || 'unknown',
                      bitrate: parseInt(a.bit_rate) || 0
                    })
                  )
                }
              });
            }
          } catch (_parseError) {
            fallbackResponse();
          }
        }
      );

      timeoutId = setTimeout(() => {
        if (ffprobeProcess && !hasResponded) {
          ffprobeProcess.kill('SIGTERM');
          fallbackResponse();
        }
      }, 12000);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/',
  authenticateToken,
  query('path').notEmpty(),
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const fileToDelete = resolveSafePath((req.query.path as string) || '');

      if (!fs.existsSync(fileToDelete)) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        });
        return;
      }

      fs.unlinkSync(fileToDelete);

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/download',
  authenticateToken,
  query('path').notEmpty(),
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filePath = resolveSafePath((req.query.path as string) || '');

      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        });
        return;
      }

      res.download(filePath);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/tree',
  authenticateToken,
  query('path').notEmpty(),
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dir = req.query.path as string;
      if (!fs.existsSync(dir)) {
        res.json({ success: true, data: { directories: [] } });
        return;
      }

      const scanTree = async (base: string, relative = '', depth = 0): Promise<string[]> => {
        if (depth > 20) {
          return [];
        }
        const results: string[] = [];
        let items: fs.Dirent[];
        try {
          items = await fsPromises.readdir(base, { withFileTypes: true });
        } catch (_e) {
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
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/mkdir',
  authenticateToken,
  body('path').notEmpty(),
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dir = resolveSafePath(req.body.path);
      if (fs.existsSync(dir)) {
        res.status(400).json({ success: false, error: '目录已存在' });
        return;
      }
      fs.mkdirSync(dir, { recursive: true });
      res.json({ success: true, data: { path: dir } });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/stream',
  query('path').notEmpty(),
  validate,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        res.status(401).json({ success: false, error: 'Access token required' });
        return;
      }

      try {
        jwt.verify(token, config.jwtSecret);
      } catch (_err) {
        res.status(403).json({ success: false, error: 'Invalid token' });
        return;
      }

      const filePath = resolveSafePath((req.query.path as string) || '');

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, error: 'File not found' });
        return;
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        res.status(400).json({ success: false, error: 'Not a file' });
        return;
      }

      res.sendFile(filePath, { root: '/drive' });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/thumbnails',
  authenticateToken,
  body('paths').isArray(),
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { paths } = req.body;
      if (!paths || paths.length === 0) {
        res.json({ success: true, thumbnails: [] });
        return;
      }
      const results = await generateThumbnails(paths);
      res.json({ success: true, thumbnails: results });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/thumbnail/:filename', (req: Request, res: Response, next: NextFunction) => {
  try {
    const filename = req.params.filename as string;
    const filePath = getThumbnailFilePath(filename);
    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'Thumbnail not found' });
      return;
    }
    res.sendFile(filePath, { root: '/' });
  } catch (error) {
    next(error);
  }
});

export default router;
