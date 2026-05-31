import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getDatabase } from '../models/database';
import config from '../config';
import logger from '../utils/logger';
import { Job } from '../types';

const activeJobs = new Map<string, ChildProcess>();
let processingCount = 0;
const lastProgressWrite = new Map<string, number>();
const jobStaleness = new Map<string, { lastMtime: number; staleCount: number }>();
const STALE_CHECK_INTERVAL = 60 * 1000;
const MAX_STALE_COUNT = 5;

function buildHandBrakeArgs(job: Job, settings: Record<string, unknown>): string[] {
  const args: string[] = ['-i', job.source_file, '-o', job.output_file, '--json'];

  args.push('--format', (settings.format as string) || 'mp4');

  if (settings.optimize === 'fast-start') {
    args.push('--optimize');
  } else if (settings.optimize === 'fragmented') {
    args.push('--fragmentation', '2');
  }

  const video = (settings.video || {}) as Record<string, unknown>;
  const dimensions = (settings.dimensions || {}) as Record<string, unknown>;
  const filters = (settings.filters || {}) as Record<string, unknown>;
  const audio = (settings.audio || {}) as Record<string, unknown>;
  const audioDefault = (audio.default || {}) as Record<string, unknown>;
  const subtitles = (settings.subtitles || {}) as Record<string, unknown>;
  const chapters = (settings.chapters || {}) as Record<string, unknown>;

  if (video.codec) {
    let encoder = video.codec as string;
    if (encoder === 'svt-av1') {
      encoder = 'svt_av1';
    } else if (encoder === 'vp9') {
      encoder = 'VP9';
    }

    args.push('--encoder', encoder);

    if (video.preset && video.preset !== 'default') {
      args.push('--encoder-preset', video.preset as string);
    }

    if (video.tune) {
      args.push('--encoder-tune', video.tune as string);
    }

    if (video.profile) {
      args.push('--encoder-profile', video.profile as string);
    }
    if (video.level) {
      args.push('--encoder-level', video.level as string);
    }

    if (video.rateControl === 'crf') {
      args.push('--quality', String((video.crf as number) ?? 22));
    } else if (video.rateControl === 'cq') {
      args.push('--quality', String((video.cq as number) ?? 30));
    } else if (video.rateControl === 'icq') {
      args.push('--quality', String((video.icq as number) ?? 22));
    } else if (video.rateControl === 'cbr' && video.bitrate) {
      args.push('--vb', `${video.bitrate}`);
    } else if (video.rateControl === 'vbr' && video.bitrate) {
      args.push('--vb', `${video.bitrate}`);
    } else if (video.rateControl === 'cqp' && video.qp) {
      args.push('--qp', String(video.qp));
    } else if (video.crf !== undefined) {
      args.push('--quality', String(video.crf));
    }
  }

  if (video.framerate) {
    args.push('--rate', String(video.framerate));
    if (video.framerateMode === 'pfr') {
      args.push('--pfr');
    } else if (video.framerateMode === 'vfr') {
      args.push('--vfr');
    } else {
      args.push('--cfr');
    }
  }

  if (dimensions.width) {
    args.push('--width', String(dimensions.width));
  }
  if (dimensions.height) {
    args.push('--height', String(dimensions.height));
  }

  const scaling = dimensions.scaling as Record<string, unknown> | undefined;
  if (scaling?.modulus) {
    args.push('--modulus', String(scaling.modulus));
  }

  const cropping = dimensions.cropping as Record<string, unknown> | undefined;
  if (cropping?.enabled) {
    if (cropping.autocrop) {
      args.push('--autocrop');
    } else {
      args.push('--crop', `${cropping.top}:${cropping.bottom}:${cropping.left}:${cropping.right}`);
    }
  } else {
    args.push('--crop', '0:0:0:0');
  }

  const deinterlace = filters.deinterlace as Record<string, unknown> | undefined;
  if (deinterlace?.enabled) {
    let deintStr = '';
    if (deinterlace.mode) {
      deintStr = `mode=${deinterlace.mode}`;
      if (deinterlace.parity) {
        deintStr += `:parity=${deinterlace.parity}`;
      }
    }
    args.push('--deinterlace' + (deintStr ? `=${deintStr}` : ''));
  }

  const decomb = filters.decomb as Record<string, unknown> | undefined;
  if (decomb?.enabled) {
    let decombStr = '';
    if (decomb.mode) {
      decombStr = `mode=${decomb.mode}`;
    }
    args.push('--decomb' + (decombStr ? `=${decombStr}` : ''));
  }

  const detelecine = filters.detelecine as Record<string, unknown> | undefined;
  if (detelecine?.enabled) {
    let detelStr = '';
    if (detelecine.pattern) {
      detelStr = `pattern=${detelecine.pattern}`;
    }
    if (detelecine.startFrame) {
      detelStr += (detelStr ? ':' : '') + `start=${detelecine.startFrame}`;
    }
    args.push('--detelecine' + (detelStr ? `=${detelStr}` : ''));
  }

  const denoise = filters.denoise as Record<string, unknown> | undefined;
  if (denoise?.enabled) {
    if (denoise.method === 'hqdn3d') {
      const hqdn3d = (denoise.hqdn3d || {}) as Record<string, number>;
      const params = [
        hqdn3d.lightSpatial ?? 4,
        hqdn3d.lightTemporal ?? 6,
        hqdn3d.heavySpatial ?? 6,
        hqdn3d.heavyTemporal ?? 16
      ].join(':');
      args.push(`--hqdn3d=${params}`);
    } else if (denoise.method === 'nlmeans') {
      let nlmeansStr = '';
      if (denoise.preset) {
        nlmeansStr = `preset=${denoise.preset}`;
      }
      if (denoise.tune && denoise.tune !== 'none') {
        nlmeansStr += (nlmeansStr ? ':' : '') + `tune=${denoise.tune}`;
      }
      args.push('--nlmeans' + (nlmeansStr ? `=${nlmeansStr}` : ''));
    }
  }

  const deblock = filters.deblock as Record<string, unknown> | undefined;
  if (deblock?.enabled) {
    args.push(`--deblock=strength=${deblock.strength ?? 4}:threshold=${deblock.threshold ?? 4}`);
  }

  const sharpen = filters.sharpen as Record<string, unknown> | undefined;
  if (sharpen?.enabled) {
    if (sharpen.method === 'unsharp') {
      const unsharp = (sharpen.unsharp || {}) as Record<string, string | undefined>;
      let unsharpStr = '';
      if (unsharp.lumaMatrix) {
        unsharpStr = unsharp.lumaMatrix;
        if (unsharp.chromaMatrix) {
          unsharpStr += `:${unsharp.chromaMatrix}`;
        }
      }
      args.push('--unsharp' + (unsharpStr ? `=${unsharpStr}` : ''));
    } else if (sharpen.method === 'lapsharp') {
      const lapsharp = (sharpen.lapsharp || {}) as Record<string, number>;
      args.push(`--lapsharp=${lapsharp.sigma ?? 0.5}`);
    }
  }

  const chromaSmooth = filters.chromaSmooth as Record<string, unknown> | undefined;
  if (chromaSmooth?.enabled) {
    args.push(
      `--chroma-smooth=tu=${chromaSmooth.tuSize ?? 2}:strength=${chromaSmooth.strength ?? 2}`
    );
  }

  const colorspace = filters.colorspace as Record<string, unknown> | undefined;
  if (colorspace?.enabled) {
    let formatStr = '';
    if (colorspace.matrix) {
      formatStr = `colormatrix=${colorspace.matrix}`;
    }
    if (colorspace.primaries) {
      formatStr += (formatStr ? ':' : '') + `colorprim=${colorspace.primaries}`;
    }
    if (colorspace.transfer) {
      formatStr += (formatStr ? ':' : '') + `transfer=${colorspace.transfer}`;
    }
    if (colorspace.range) {
      formatStr += (formatStr ? ':' : '') + `range=${colorspace.range}`;
    }
    if (formatStr) {
      args.push(`--colorspace=${formatStr}`);
    }
  }

  const rotate = filters.rotate as Record<string, unknown> | undefined;
  if (rotate?.enabled) {
    let rotateStr = '';
    if (rotate.angle) {
      rotateStr += `angle=${rotate.angle}`;
    }
    if (rotate.hFlip) {
      rotateStr += (rotateStr ? ':' : '') + 'hflip';
    }
    if (rotate.vFlip) {
      rotateStr += (rotateStr ? ':' : '') + 'vflip';
    }
    if (rotateStr) {
      args.push(`--rotate=${rotateStr}`);
    }
  }

  const pad = filters.pad as Record<string, unknown> | undefined;
  if (pad?.enabled) {
    let padStr = '';
    if (pad.width) {
      padStr = `width=${pad.width}`;
    }
    if (pad.height) {
      padStr += (padStr ? ':' : '') + `height=${pad.height}`;
    }
    if (pad.x !== null && pad.x !== undefined) {
      padStr += (padStr ? ':' : '') + `x=${pad.x}`;
    }
    if (pad.y !== null && pad.y !== undefined) {
      padStr += (padStr ? ':' : '') + `y=${pad.y}`;
    }
    if (pad.color) {
      padStr += (padStr ? ':' : '') + `color=${pad.color}`;
    }
    if (padStr) {
      args.push(`--pad=${padStr}`);
    }
  }

  if (audioDefault.codec) {
    let aencoder = audioDefault.codec as string;
    if (aencoder === 'flac24') {
      aencoder = 'flac16';
    }
    args.push('--aencoder', aencoder);
  }

  if (audioDefault.bitrate) {
    args.push('--ab', `${audioDefault.bitrate}`);
  }

  if (audioDefault.samplerate) {
    args.push('--arate', String(audioDefault.samplerate));
  }

  if (audioDefault.mixdown && audioDefault.mixdown !== 'none') {
    args.push('--mixdown', audioDefault.mixdown as string);
  }

  if (audioDefault.drc && audioDefault.drc !== 'none') {
    args.push('--drc', audioDefault.drc as string);
  }

  if (audioDefault.gain) {
    args.push('--gain', String(audioDefault.gain));
  }

  if (subtitles.scanForced) {
    args.push('--subtitle-scan-forced');
  }

  if (chapters.enabled !== false) {
    if (chapters.useChapterMarkers !== false) {
      args.push('--markers');
    }
  } else {
    args.push('--no-markers');
  }

  return args;
}

export async function startTranscode(job: Job): Promise<void> {
  if (processingCount >= config.maxConcurrentJobs) {
    logger.info('Max concurrent jobs reached, job queued');
    return;
  }

  const db = getDatabase();
  processingCount++;

  if (fs.existsSync(job.output_file)) {
    processingCount--;
    let outputFileSize: number | null = null;
    try {
      outputFileSize = fs.statSync(job.output_file).size;
    } catch (_e) {
      // 忽略 stat 错误
    }
    db.prepare(
      // eslint-disable-next-line quotes
      "UPDATE jobs SET status = 'skipped', completed_at = datetime('now'), output_file_size = ? WHERE id = ?"
    ).run(outputFileSize, job.id);
    logger.info('Job skipped - output file already exists', {
      jobId: job.id,
      output: job.output_file
    });
    processNextJob();
    return;
  }

  let settings: Record<string, unknown> = {};
  if (job.preset_id) {
    const preset = db.prepare('SELECT settings FROM presets WHERE id = ?').get(job.preset_id) as
      | { settings: string }
      | undefined;
    if (preset) {
      settings = JSON.parse(preset.settings);
    }
  }

  if (job.settings) {
    try {
      const customSettings = JSON.parse(job.settings);
      settings = { ...settings, ...customSettings };
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Error parsing job settings', { error: error.message });
    }
  }

  const cacheDir = config.cacheDir;
  const jobTempDir = `${cacheDir}/handbrake-temp/${job.id}`;
  fs.mkdirSync(jobTempDir, { recursive: true });
  const tempOutputFile = path.join(jobTempDir, path.basename(job.output_file));

  db.prepare(
    `
    UPDATE jobs SET status = 'processing', started_at = datetime('now')
    WHERE id = ?
    `
  ).run(job.id);

  const args = buildHandBrakeArgs(job, settings);
  const oIdx = args.indexOf('-o');
  if (oIdx !== -1) {
    args[oIdx + 1] = tempOutputFile;
  }

  const handbrake = spawn('HandBrakeCLI', args);
  activeJobs.set(job.id, handbrake);

  let errorData = '';
  let progressBuffer = '';

  const onProgress = (data: Buffer) => {
    progressBuffer += data.toString();
    if (progressBuffer.length > 200000) {
      progressBuffer = progressBuffer.slice(-100000);
    }
    parseProgress(job.id, progressBuffer);
  };

  const onStderr = (data: Buffer) => {
    const str = data.toString();
    if (errorData.length < 1000000) {
      errorData += str;
    }
  };

  const moveTempFile = () => {
    const finalDir = path.dirname(job.output_file);
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
    try {
      fs.renameSync(tempOutputFile, job.output_file);
    } catch (e: unknown) {
      const error = e as NodeJS.ErrnoException;
      if (error.code === 'EXDEV') {
        try {
          fs.copyFileSync(tempOutputFile, job.output_file);
          fs.unlinkSync(tempOutputFile);
        } catch (copyErr: unknown) {
          const ce = copyErr as Error;
          logger.error('Failed to copy temp file', { jobId: job.id, error: ce.message });
        }
      } else {
        logger.error('Failed to move temp file', { jobId: job.id, error: error.message });
      }
    }
    try {
      fs.rmSync(jobTempDir, { recursive: true, force: true });
    } catch (_e) {
      // ignore cleanup error
    }
  };

  const cleanupJob = () => {
    try {
      fs.rmSync(jobTempDir, { recursive: true, force: true });
    } catch (_e2) {
      // ignore cleanup error
    }
  };

  const onClose = (code: number | null) => {
    handbrake.stdout.removeListener('data', onProgress);
    handbrake.stderr.removeListener('data', onStderr);
    handbrake.removeListener('close', onClose);
    handbrake.removeListener('error', onError);
    lastProgressWrite.delete(job.id);

    const wasActive = activeJobs.has(job.id);
    activeJobs.delete(job.id);
    if (!wasActive) {
      return;
    }
    processingCount--;

    if (code === 0) {
      moveTempFile();
      let outputFileSize: number | null = null;
      try {
        const stats = fs.statSync(job.output_file);
        outputFileSize = stats.size;
      } catch (e: unknown) {
        const error = e as Error;
        logger.warn('Failed to stat output file', { jobId: job.id, error: error.message });
      }
      db.prepare(
        `
        UPDATE jobs
        SET status = 'completed', progress = 100, completed_at = datetime('now'), output_file_size = ?
        WHERE id = ?
        `
      ).run(outputFileSize, job.id);
      logger.info('Job completed successfully', { jobId: job.id });
    } else if (code === null) {
      cleanupJob();
      logger.info('Job was cancelled', { jobId: job.id });
    } else {
      cleanupJob();
      db.prepare(
        `
        UPDATE jobs
        SET status = 'failed', error_log = ?, completed_at = datetime('now')
        WHERE id = ?
        `
      ).run(errorData, job.id);
      logger.error('Job failed', { jobId: job.id, code, error: errorData });
    }

    processNextJob();
  };

  const onError = (error: Error) => {
    handbrake.stdout.removeListener('data', onProgress);
    handbrake.stderr.removeListener('data', onStderr);
    handbrake.removeListener('close', onClose);
    handbrake.removeListener('error', onError);
    lastProgressWrite.delete(job.id);

    const wasActive = activeJobs.has(job.id);
    activeJobs.delete(job.id);
    if (!wasActive) {
      return;
    }
    processingCount--;

    cleanupJob();

    db.prepare(
      `
      UPDATE jobs
      SET status = 'failed', error_log = ?, completed_at = datetime('now')
      WHERE id = ?
      `
    ).run(error.message, job.id);

    logger.error('Job error', { jobId: job.id, error: error.message });

    processNextJob();
  };

  handbrake.stdout.on('data', onProgress);
  handbrake.stderr.on('data', onStderr);
  handbrake.on('close', onClose);
  handbrake.on('error', onError);
}

function parseProgress(jobId: string, data: string): number | null {
  const db = getDatabase();
  let progress: number | null = null;
  let etaSeconds: number | null = null;

  const jsonResult = tryParseJsonProgress(data);
  if (jsonResult !== null) {
    progress = jsonResult.progress;
    etaSeconds = jsonResult.etaSeconds;
  }

  if (progress === null) {
    progress = tryParseTextProgress(data);
  }

  if (progress !== null) {
    const now = Date.now();
    const last = lastProgressWrite.get(jobId) || 0;
    if (now - last >= 1000) {
      lastProgressWrite.set(jobId, now);
      db.prepare('UPDATE jobs SET progress = ?, eta_seconds = ? WHERE id = ?').run(
        progress,
        etaSeconds,
        jobId
      );
    }
  }

  return progress;
}

interface JsonProgress {
  progress: number;
  etaSeconds: number;
}

function tryParseJsonProgress(data: string): JsonProgress | null {
  const lines = data.split(/\r?\n|\r/);
  let lastResult: JsonProgress | null = null;
  let i = 0;

  while (i < lines.length) {
    const match = lines[i].match(/^(\w+):\s*\{/);
    if (!match) {
      i++;
      continue;
    }

    const key = match[1];
    let depth = 1;
    let blockEnd = -1;

    for (let j = i + 1; j < lines.length; j++) {
      depth += (lines[j].match(/\{/g) || []).length;
      depth -= (lines[j].match(/\}/g) || []).length;
      if (depth === 0) {
        blockEnd = j;
        break;
      }
    }

    if (blockEnd === -1) {
      break;
    }

    if (key === 'Progress') {
      const jsonLines = lines.slice(i, blockEnd + 1);
      jsonLines[0] = jsonLines[0].substring(jsonLines[0].indexOf('{'));
      const jsonStr = jsonLines.join('\n');

      try {
        const json = JSON.parse(jsonStr);
        if (json.State === 'WORKING' && json.Working && typeof json.Working.Progress === 'number') {
          const progress = json.Working.Progress * 100;
          const hours = json.Working.Hours || 0;
          const minutes = json.Working.Minutes || 0;
          const seconds = json.Working.Seconds || 0;
          const etaSeconds = hours * 3600 + minutes * 60 + seconds;
          lastResult = { progress, etaSeconds };
        } else if (json.State === 'WORKDONE') {
          lastResult = { progress: 100, etaSeconds: 0 };
        }
      } catch (_e) {
        // skip malformed blocks
      }
    }

    i = blockEnd + 1;
  }

  return lastResult;
}

function tryParseTextProgress(data: string): number | null {
  const matches = [...data.matchAll(/Encoding:.*?(\d+\.?\d*)\s*%/g)];
  if (matches.length > 0) {
    return parseFloat(matches[matches.length - 1][1]);
  }
  return null;
}

export async function cancelTranscode(jobId: string): Promise<void> {
  const process = activeJobs.get(jobId);
  if (process) {
    process.kill('SIGTERM');
    activeJobs.delete(jobId);
    processingCount = Math.max(0, processingCount - 1);
  }
  if (config.cacheDir) {
    const tempDir = path.join(config.cacheDir, 'handbrake-temp', jobId);
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_e) {
      // ignore
    }
  }
  jobStaleness.delete(jobId);
  processNextJob();
}

export async function pauseTranscode(jobId: string): Promise<void> {
  const process = activeJobs.get(jobId);
  if (process) {
    process.kill('SIGSTOP');
  }
}

export async function resumeTranscode(jobId: string): Promise<void> {
  const process = activeJobs.get(jobId);
  if (process) {
    process.kill('SIGCONT');
  }
}

function processNextJob(): void {
  if (processingCount >= config.maxConcurrentJobs) {
    return;
  }

  const db = getDatabase();

  const nextJob = db
    .prepare(
      `
    SELECT * FROM jobs
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT 1
    `
    )
    .get() as Job | undefined;

  if (nextJob) {
    startTranscode(nextJob);
  }
}

export function getActiveJobs(): string[] {
  return Array.from(activeJobs.keys());
}

export function getProcessingCount(): number {
  return processingCount;
}

export function killAllJobs(): void {
  for (const [jobId, proc] of activeJobs) {
    try {
      proc.kill('SIGTERM');
    } catch (_e) {
      // ignore
    }
    activeJobs.delete(jobId);
  }
  processingCount = 0;
}

function checkStaleJobs(): void {
  if (!config.cacheDir) {
    return;
  }

  const db = getDatabase();
  const processingJobs = db
    // eslint-disable-next-line quotes
    .prepare("SELECT id, started_at, progress FROM jobs WHERE status = 'processing'")
    .all() as { id: string; started_at: string; progress: number }[];

  for (const job of processingJobs) {
    const tempDir = path.join(config.cacheDir, 'handbrake-temp', job.id);
    const entry = jobStaleness.get(job.id) || { lastMtime: 0, staleCount: 0 };

    try {
      if (!fs.existsSync(tempDir)) {
        entry.staleCount++;
      } else {
        const items = fs.readdirSync(tempDir);
        const tempFile = items.find(f => f !== '.' && f !== '..');
        if (tempFile) {
          const stats = fs.statSync(path.join(tempDir, tempFile));
          if (stats.mtimeMs === entry.lastMtime) {
            entry.staleCount++;
          } else {
            entry.staleCount = 0;
          }
          entry.lastMtime = stats.mtimeMs;
        } else {
          entry.staleCount++;
        }
      }
    } catch (_e) {
      entry.staleCount++;
    }

    jobStaleness.set(job.id, entry);

    if (entry.staleCount >= MAX_STALE_COUNT) {
      try {
        const proc = activeJobs.get(job.id);
        if (proc) {
          proc.kill('SIGKILL');
          activeJobs.delete(job.id);
          processingCount = Math.max(0, processingCount - 1);
        }
      } catch (_e2) {
        // ignore
      }

      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (_e3) {
        // ignore
      }

      db.prepare(
        // eslint-disable-next-line quotes
        "UPDATE jobs SET status = 'failed', error_log = ?, completed_at = datetime('now') WHERE id = ?"
      ).run('转码进程已无响应 - 临时文件超过5分钟未更新', job.id);
      jobStaleness.delete(job.id);
      logger.warn('Job marked as failed due to staleness', { jobId: job.id });

      processNextJob();
    }
  }

  for (const [jobId] of jobStaleness) {
    if (!processingJobs.find(j => j.id === jobId)) {
      jobStaleness.delete(jobId);
    }
  }
}

export function startStalenessDetector(): void {
  checkStaleJobs();
  setInterval(checkStaleJobs, STALE_CHECK_INTERVAL);
  logger.info('Staleness detector started', { interval: '60s', maxStaleCount: MAX_STALE_COUNT });
}

startStalenessDetector();
