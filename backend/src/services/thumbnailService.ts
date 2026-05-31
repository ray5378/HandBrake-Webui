import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import config from '../config';
import logger from '../utils/logger';

const THUMBNAIL_TTL_MS = 24 * 60 * 60 * 1000;

interface ThumbnailResult {
  success: boolean;
  thumbnail?: string;
  cached?: boolean;
  error?: string;
}

interface ThumbnailBatchResult {
  path: string;
  success: boolean;
  thumbnail?: string;
  cached?: boolean;
  error?: string;
}

export function getThumbnailDir(): string | null {
  const cacheDir = config.cacheDir;
  if (!cacheDir) {
    return null;
  }
  const thumbnailDir = path.join(cacheDir, 'thumbnails');
  if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
  }
  return thumbnailDir;
}

export function getThumbnailPath(videoPath: string): string | null {
  const thumbnailDir = getThumbnailDir();
  if (!thumbnailDir) {
    return null;
  }
  const hash = crypto.createHash('md5').update(videoPath).digest('hex');
  return path.join(thumbnailDir, `${hash}.jpg`);
}

export function getThumbnailUrl(filename: string): string {
  return `/api/files/thumbnail/${filename}`;
}

export async function generateThumbnail(videoPath: string): Promise<ThumbnailResult> {
  const thumbnailDir = getThumbnailDir();
  if (!thumbnailDir) {
    return { success: false, error: 'cache_dir_not_configured' };
  }

  if (!fs.existsSync(videoPath)) {
    return { success: false, error: 'file_not_found' };
  }

  const thumbnailPath = getThumbnailPath(videoPath);
  if (!thumbnailPath) {
    return { success: false, error: 'cache_dir_not_configured' };
  }
  const filename = path.basename(thumbnailPath);

  if (fs.existsSync(thumbnailPath)) {
    const stats = fs.statSync(thumbnailPath);
    const age = Date.now() - stats.mtimeMs;
    if (age < THUMBNAIL_TTL_MS) {
      return { success: true, thumbnail: getThumbnailUrl(filename), cached: true };
    }
    fs.unlinkSync(thumbnailPath);
  }

  return new Promise(resolve => {
    const args = [
      '-i',
      videoPath,
      '-ss',
      '00:00:01',
      '-vframes',
      '1',
      '-vf',
      'scale=320:-2',
      '-q:v',
      '3',
      '-y',
      thumbnailPath
    ];

    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';

    ffmpeg.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      ffmpeg.kill();
      resolve({ success: false, error: 'timeout' });
    }, 10000);

    ffmpeg.on('close', code => {
      clearTimeout(timeout);
      if (code === 0 && fs.existsSync(thumbnailPath)) {
        resolve({ success: true, thumbnail: getThumbnailUrl(filename), cached: false });
      } else {
        logger.error(`Thumbnail generation failed for ${videoPath}: ${stderr}`);
        resolve({ success: false, error: 'ffmpeg_failed' });
      }
    });

    ffmpeg.on('error', (err: Error) => {
      clearTimeout(timeout);
      logger.error(`FFmpeg not found: ${err.message}`);
      resolve({ success: false, error: 'ffmpeg_not_found' });
    });
  });
}

export async function generateThumbnails(videoPaths: string[]): Promise<ThumbnailBatchResult[]> {
  const results: ThumbnailBatchResult[] = [];
  for (const videoPath of videoPaths) {
    const result = await generateThumbnail(videoPath);
    results.push({ path: videoPath, ...result });
  }
  return results;
}

export async function cleanupExpiredThumbnails(): Promise<void> {
  const thumbnailDir = getThumbnailDir();
  if (!thumbnailDir || !fs.existsSync(thumbnailDir)) {
    return;
  }

  const now = Date.now();
  const files = fs.readdirSync(thumbnailDir);
  let cleaned = 0;

  for (const file of files) {
    if (!file.endsWith('.jpg')) {
      continue;
    }
    const filePath = path.join(thumbnailDir, file);
    try {
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > THUMBNAIL_TTL_MS) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to cleanup thumbnail ${file}: ${error.message}`);
    }
  }

  if (cleaned > 0) {
    logger.info(`Cleaned up ${cleaned} expired thumbnails`);
  }
}

export function startThumbnailCleanup(): void {
  cleanupExpiredThumbnails();
  setInterval(cleanupExpiredThumbnails, 60 * 60 * 1000);
}

export function getThumbnailFilePath(filename: string): string | null {
  const thumbnailDir = getThumbnailDir();
  if (!thumbnailDir) {
    return null;
  }
  const filePath = path.join(thumbnailDir, filename);
  if (!filePath.startsWith(thumbnailDir)) {
    return null;
  }
  return filePath;
}
