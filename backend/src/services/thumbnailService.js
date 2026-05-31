const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const config = require('../config');
const logger = require('../utils/logger');

const THUMBNAIL_TTL_MS = 24 * 60 * 60 * 1000;

function getThumbnailDir() {
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

function getThumbnailPath(videoPath) {
  const thumbnailDir = getThumbnailDir();
  if (!thumbnailDir) {
    return null;
  }
  const hash = crypto.createHash('md5').update(videoPath).digest('hex');
  return path.join(thumbnailDir, `${hash}.jpg`);
}

function getThumbnailUrl(filename) {
  return `/api/files/thumbnail/${filename}`;
}

async function generateThumbnail(videoPath) {
  const thumbnailDir = getThumbnailDir();
  if (!thumbnailDir) {
    return { success: false, error: 'cache_dir_not_configured' };
  }

  if (!fs.existsSync(videoPath)) {
    return { success: false, error: 'file_not_found' };
  }

  const thumbnailPath = getThumbnailPath(videoPath);
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

    ffmpeg.stderr.on('data', data => {
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

    ffmpeg.on('error', err => {
      clearTimeout(timeout);
      logger.error(`FFmpeg not found: ${err.message}`);
      resolve({ success: false, error: 'ffmpeg_not_found' });
    });
  });
}

async function generateThumbnails(videoPaths) {
  const results = [];
  for (const videoPath of videoPaths) {
    const result = await generateThumbnail(videoPath);
    results.push({ path: videoPath, ...result });
  }
  return results;
}

async function cleanupExpiredThumbnails() {
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
    } catch (err) {
      logger.error(`Failed to cleanup thumbnail ${file}: ${err.message}`);
    }
  }

  if (cleaned > 0) {
    logger.info(`Cleaned up ${cleaned} expired thumbnails`);
  }
}

function startThumbnailCleanup() {
  cleanupExpiredThumbnails();
  setInterval(cleanupExpiredThumbnails, 60 * 60 * 1000);
}

function getThumbnailFilePath(filename) {
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

module.exports = {
  generateThumbnail,
  generateThumbnails,
  cleanupExpiredThumbnails,
  startThumbnailCleanup,
  getThumbnailFilePath
};
