const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../models/database');
const config = require('../config');

const activeJobs = new Map();
let processingCount = 0;
const lastProgressWrite = new Map();

function buildHandBrakeArgs(job, settings) {
  const args = ['-i', job.source_file, '-o', job.output_file, '--json'];

  // 容器格式
  args.push('--format', settings.format || 'mp4');

  // 容器优化
  if (settings.optimize === 'fast-start') {
    args.push('--optimize');
  } else if (settings.optimize === 'fragmented') {
    args.push('--fragmentation', '2');
  }

  const video = settings.video || {};
  const dimensions = settings.dimensions || {};
  const filters = settings.filters || {};
  const audio = settings.audio || {};
  const audioDefault = audio.default || {};
  const subtitles = settings.subtitles || {};
  const chapters = settings.chapters || {};

  // 视频编码
  if (video.codec) {
    let encoder = video.codec;
    if (encoder === 'x264') {
      encoder = 'x264';
    } else if (encoder === 'x265') {
      encoder = 'x265';
    } else if (encoder === 'svt-av1') {
      encoder = 'svt_av1';
    } else if (encoder === 'vp9') {
      encoder = 'VP9';
    }

    args.push('--encoder', encoder);

    // 编码器预设
    if (video.preset && video.preset !== 'default') {
      args.push('--encoder-preset', video.preset);
    }

    // 编码器调优
    if (video.tune) {
      args.push('--encoder-tune', video.tune);
    }

    // 编码器配置文件和级别
    if (video.profile) {
      args.push('--encoder-profile', video.profile);
    }
    if (video.level) {
      args.push('--encoder-level', video.level);
    }

    // 码率控制
    if (video.rateControl === 'crf') {
      args.push('--quality', String(video.crf ?? 22));
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

  // 帧率设置
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

  // 尺寸设置
  if (dimensions.width) {
    args.push('--width', String(dimensions.width));
  }
  if (dimensions.height) {
    args.push('--height', String(dimensions.height));
  }

  // 模数设置
  if (dimensions.scaling?.modulus) {
    args.push('--modulus', String(dimensions.scaling.modulus));
  }

  // 裁剪设置
  if (dimensions.cropping?.enabled) {
    if (dimensions.cropping.autocrop) {
      args.push('--autocrop');
    } else {
      const crop = dimensions.cropping;
      args.push('--crop', `${crop.top}:${crop.bottom}:${crop.left}:${crop.right}`);
    }
  } else {
    args.push('--crop', '0:0:0:0');
  }

  // 视频滤镜
  const filterArgs = [];

  // 反交错
  if (filters.deinterlace?.enabled) {
    let deinterlaceArgs = 'deinterlace';
    if (filters.deinterlace.mode) {
      deinterlaceArgs += `=mode=${filters.deinterlace.mode}`;
      if (filters.deinterlace.parity) {
        deinterlaceArgs += `:parity=${filters.deinterlace.parity}`;
      }
    }
    filterArgs.push(deinterlaceArgs);
  }

  // Decomb
  if (filters.decomb?.enabled) {
    let decombArgs = 'decomb';
    if (filters.decomb.mode) {
      decombArgs += `=mode=${filters.decomb.mode}`;
    }
    filterArgs.push(decombArgs);
  }

  // 反电视电影
  if (filters.detelecine?.enabled) {
    let detelecineArgs = 'detelecine';
    if (filters.detelecine.pattern) {
      detelecineArgs += `=pattern=${filters.detelecine.pattern}`;
    }
    if (filters.detelecine.startFrame) {
      detelecineArgs += `:start=${filters.detelecine.startFrame}`;
    }
    filterArgs.push(detelecineArgs);
  }

  // 降噪
  if (filters.denoise?.enabled) {
    if (filters.denoise.method === 'hqdn3d') {
      let hqdn3dArgs = 'hqdn3d';
      const hqdn3d = filters.denoise.hqdn3d || {};
      const params = [
        hqdn3d.lightSpatial ?? 4,
        hqdn3d.lightTemporal ?? 6,
        hqdn3d.heavySpatial ?? 6,
        hqdn3d.heavyTemporal ?? 16
      ].join(':');
      hqdn3dArgs += `=${params}`;
      filterArgs.push(hqdn3dArgs);
    } else if (filters.denoise.method === 'nlmeans') {
      let nlmeansArgs = 'nlmeans';
      if (filters.denoise.preset) {
        nlmeansArgs += `=preset=${filters.denoise.preset}`;
      }
      if (filters.denoise.tune && filters.denoise.tune !== 'none') {
        nlmeansArgs += `:tune=${filters.denoise.tune}`;
      }
      filterArgs.push(nlmeansArgs);
    }
  }

  // 去块
  if (filters.deblock?.enabled) {
    filterArgs.push(
      `deblock=strength=${filters.deblock.strength ?? 4}:threshold=${filters.deblock.threshold ?? 4}`
    );
  }

  // 锐化
  if (filters.sharpen?.enabled) {
    if (filters.sharpen.method === 'unsharp') {
      const unsharp = filters.sharpen.unsharp || {};
      let unsharpArgs = 'unsharp';
      if (unsharp.lumaMatrix) {
        unsharpArgs += `=${unsharp.lumaMatrix}`;
        if (unsharp.chromaMatrix) {
          unsharpArgs += `:${unsharp.chromaMatrix}`;
        }
      }
      filterArgs.push(unsharpArgs);
    } else if (filters.sharpen.method === 'lapsharp') {
      const lapsharp = filters.sharpen.lapsharp || {};
      filterArgs.push(`lapsharp=${lapsharp.sigma ?? 0.5}`);
    }
  }

  // 色度平滑
  if (filters.chromaSmooth?.enabled) {
    filterArgs.push(
      `chroma-smooth=tu=${filters.chromaSmooth.tuSize ?? 2}:strength=${filters.chromaSmooth.strength ?? 2}`
    );
  }

  // 色彩空间
  if (filters.colorspace?.enabled) {
    let formatArgs = 'format';
    const cs = filters.colorspace;
    if (cs.matrix) {
      formatArgs += `=colormatrix=${cs.matrix}`;
    }
    if (cs.primaries) {
      formatArgs += `:colorprim=${cs.primaries}`;
    }
    if (cs.transfer) {
      formatArgs += `:transfer=${cs.transfer}`;
    }
    if (cs.range) {
      formatArgs += `:range=${cs.range}`;
    }
    if (formatArgs !== 'format') {
      filterArgs.push(formatArgs);
    }
  }

  // 旋转/翻转
  if (filters.rotate?.enabled) {
    let rotateArgs = 'rotate';
    if (filters.rotate.angle) {
      rotateArgs += `=angle=${filters.rotate.angle}`;
    }
    if (filters.rotate.hFlip) {
      rotateArgs += ':hflip';
    }
    if (filters.rotate.vFlip) {
      rotateArgs += ':vflip';
    }
    if (rotateArgs !== 'rotate') {
      filterArgs.push(rotateArgs);
    }
  }

  // 填充
  if (filters.pad?.enabled) {
    let padArgs = 'pad';
    const pad = filters.pad;
    if (pad.width) {
      padArgs += `=width=${pad.width}`;
    }
    if (pad.height) {
      padArgs += `:height=${pad.height}`;
    }
    if (pad.x !== null && pad.x !== undefined) {
      padArgs += `:x=${pad.x}`;
    }
    if (pad.y !== null && pad.y !== undefined) {
      padArgs += `:y=${pad.y}`;
    }
    if (pad.color) {
      padArgs += `:color=${pad.color}`;
    }
    if (padArgs !== 'pad') {
      filterArgs.push(padArgs);
    }
  }

  if (filterArgs.length > 0) {
    args.push('--vfilter', filterArgs.join(','));
  }

  // 音频编码
  if (audioDefault.codec) {
    let aencoder = audioDefault.codec;
    if (aencoder === 'flac24') {
      aencoder = 'flac16';
    }
    args.push('--aencoder', aencoder);
  }

  // 音频码率
  if (audioDefault.bitrate) {
    args.push('--ab', `${audioDefault.bitrate}`);
  }

  // 音频采样率
  if (audioDefault.samplerate) {
    args.push('--arate', String(audioDefault.samplerate));
  }

  // 混合声道
  if (audioDefault.mixdown && audioDefault.mixdown !== 'none') {
    args.push('--mixdown', audioDefault.mixdown);
  }

  // 动态范围压缩
  if (audioDefault.drc && audioDefault.drc !== 'none') {
    args.push('--drc', audioDefault.drc);
  }

  // 增益
  if (audioDefault.gain) {
    args.push('--gain', String(audioDefault.gain));
  }

  // 字幕设置
  if (subtitles.scanForced) {
    args.push('--subtitle-scan-forced');
  }

  // 章节设置
  if (chapters.enabled !== false) {
    if (chapters.useChapterMarkers !== false) {
      args.push('--markers');
    }
  } else {
    args.push('--no-markers');
  }

  return args;
}

async function startTranscode(job) {
  if (processingCount >= config.maxConcurrentJobs) {
    console.log('Max concurrent jobs reached, job queued');
    return;
  }

  const db = getDatabase();
  processingCount++;

  let settings = {};
  if (job.preset_id) {
    const preset = db.prepare('SELECT settings FROM presets WHERE id = ?').get(job.preset_id);
    if (preset) {
      settings = JSON.parse(preset.settings);
    }
  }

  if (job.settings) {
    try {
      const customSettings = JSON.parse(job.settings);
      settings = { ...settings, ...customSettings };
    } catch (e) {
      console.error('Error parsing job settings:', e);
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

  console.log('Starting HandBrake with args:', args);

  const handbrake = spawn('HandBrakeCLI', args);
  activeJobs.set(job.id, handbrake);

  let errorData = '';
  let progressBuffer = '';

  const onProgress = data => {
    progressBuffer += data.toString();
    if (progressBuffer.length > 100000) {
      progressBuffer = progressBuffer.slice(-50000);
    }
    parseProgress(job.id, progressBuffer);
  };

  const onStderr = data => {
    const str = data.toString();
    if (errorData.length < 1000000) {
      errorData += str;
    }
    onProgress(str);
  };

  const moveTempFile = () => {
    const finalDir = path.dirname(job.output_file);
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
    try {
      fs.renameSync(tempOutputFile, job.output_file);
    } catch (e) {
      if (e.code === 'EXDEV') {
        try {
          fs.copyFileSync(tempOutputFile, job.output_file);
          fs.unlinkSync(tempOutputFile);
        } catch (copyErr) {
          console.error(`Failed to copy temp file for job ${job.id}:`, copyErr);
        }
      } else {
        console.error(`Failed to move temp file for job ${job.id}:`, e);
      }
    }
    try {
      fs.rmSync(jobTempDir, { recursive: true, force: true });
    } catch (e) {
      // ignore cleanup error
    }
  };

  const cleanupJob = () => {
    try {
      fs.rmSync(jobTempDir, { recursive: true, force: true });
    } catch (e) {
      // ignore cleanup error
    }
  };

  const onClose = code => {
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
      db.prepare(
        `
        UPDATE jobs
        SET status = 'completed', progress = 100, completed_at = datetime('now')
        WHERE id = ?
        `
      ).run(job.id);
      console.log(`Job ${job.id} completed successfully`);
    } else if (code === null) {
      cleanupJob();
      console.log(`Job ${job.id} was cancelled`);
    } else {
      cleanupJob();
      db.prepare(
        `
        UPDATE jobs
        SET status = 'failed', error_log = ?, completed_at = datetime('now')
        WHERE id = ?
        `
      ).run(errorData, job.id);
      console.error(`Job ${job.id} failed with code ${code}:`, errorData);
    }

    processNextJob();
  };

  const onError = error => {
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

    console.error(`Job ${job.id} error:`, error);

    processNextJob();
  };

  handbrake.stdout.on('data', onProgress);
  handbrake.stderr.on('data', onStderr);
  handbrake.on('close', onClose);
  handbrake.on('error', onError);
}

function parseProgress(jobId, data) {
  const db = getDatabase();
  let progress = null;

  progress = tryParseJsonProgress(data);
  if (progress === null) {
    progress = tryParseTextProgress(data);
  }

  if (progress !== null) {
    const now = Date.now();
    const last = lastProgressWrite.get(jobId) || 0;
    if (now - last >= 1000) {
      lastProgressWrite.set(jobId, now);
      db.prepare(
        `
        UPDATE jobs SET progress = ? WHERE id = ?
        `
      ).run(progress, jobId);
    }
  }

  return progress;
}

function tryParseJsonProgress(data) {
  // HandBrakeCLI --json outputs multi-line blocks with key prefixes:
  // Progress: {
  //     "State": "WORKING",
  //     "Working": { "Progress": 0.5, ... }
  // }
  const lines = data.split(/\r?\n|\r/);
  let lastProgress = null;
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

    if (blockEnd === -1) break;

    if (key === 'Progress') {
      const jsonLines = lines.slice(i, blockEnd + 1);
      jsonLines[0] = jsonLines[0].substring(jsonLines[0].indexOf('{'));
      const jsonStr = jsonLines.join('\n');

      try {
        const json = JSON.parse(jsonStr);
        if (json.State === 'WORKING' && json.Working && typeof json.Working.Progress === 'number') {
          lastProgress = json.Working.Progress * 100;
        } else if (json.State === 'WORKDONE') {
          lastProgress = 100;
        }
      } catch (e) {
        // skip malformed blocks
      }
    }

    i = blockEnd + 1;
  }

  return lastProgress;
}

function tryParseTextProgress(data) {
  const matches = [...data.matchAll(/Encoding:.*?(\d+\.?\d*)\s*%/g)];
  if (matches.length > 0) {
    return parseFloat(matches[matches.length - 1][1]);
  }
  return null;
}

async function cancelTranscode(jobId) {
  const process = activeJobs.get(jobId);
  if (process) {
    process.kill('SIGTERM');
    activeJobs.delete(jobId);
  }

  processingCount = Math.max(0, processingCount - 1);
  processNextJob();
}

async function pauseTranscode(jobId) {
  const process = activeJobs.get(jobId);
  if (process) {
    process.kill('SIGSTOP');
  }
}

async function resumeTranscode(jobId) {
  const process = activeJobs.get(jobId);
  if (process) {
    process.kill('SIGCONT');
  }
}

function processNextJob() {
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
    .get();

  if (nextJob) {
    startTranscode(nextJob);
  }
}

function getActiveJobs() {
  return Array.from(activeJobs.keys());
}

function getProcessingCount() {
  return processingCount;
}

function killAllJobs() {
  for (const [jobId, proc] of activeJobs) {
    try {
      proc.kill('SIGTERM');
    } catch (e) {
      // ignore
    }
    activeJobs.delete(jobId);
  }
  processingCount = 0;
}

module.exports = {
  startTranscode,
  cancelTranscode,
  pauseTranscode,
  resumeTranscode,
  getActiveJobs,
  getProcessingCount,
  killAllJobs
};
