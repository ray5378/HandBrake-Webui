const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../models/database');
const config = require('../config');

const activeJobs = new Map();
let processingCount = 0;

function buildHandBrakeArgs(job, settings) {
  const args = [
    '-i', job.source_file,
    '-o', job.output_file,
    '--json'
  ];
  
  if (settings.format === 'webm') {
    if (settings.video?.codec === 'libvpx-vp9') {
      args.push('--vcodec', 'libvpx-vp9');
      if (settings.video.crf) {
        args.push('--crf', settings.video.crf.toString());
      }
      if (settings.video.width && settings.video.height) {
        args.push('--width', settings.video.width.toString(), '--height', settings.video.height.toString());
      }
    }
    
    if (settings.audio?.codec === 'libopus') {
      args.push('--acodec', 'libopus');
      if (settings.audio.bitrate) {
        args.push('--ab', `${settings.audio.bitrate}k`);
      }
    }
  } else {
    if (settings.video?.codec === 'libx265') {
      args.push('--encoder', 'x265');
      if (settings.video.crf) {
        args.push('--crf', settings.video.crf.toString());
      }
      if (settings.video.preset && settings.video.preset !== 'default') {
        args.push('--encoder-preset', settings.video.preset);
      }
    } else if (settings.video?.codec === 'libx264') {
      args.push('--encoder', 'x264');
      if (settings.video.crf) {
        args.push('--cfr', settings.video.crf.toString());
      }
      if (settings.video.preset && settings.video.preset !== 'default') {
        args.push('--encoder-preset', settings.video.preset);
      }
    }
    
    if (settings.video?.width && settings.video?.height) {
      args.push('--width', settings.video.width.toString(), '--height', settings.video.height.toString());
    }
    
    if (settings.audio?.codec) {
      args.push('--aencoder', 'faac');
      if (settings.audio.bitrate) {
        args.push('--ab', `${settings.audio.bitrate}k`);
      }
      if (settings.audio.channels) {
        args.push('--achannels', settings.audio.channels.toString());
      }
    }
  }
  
  args.push('--format', settings.format || 'mp4');
  
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
  
  const outputDir = path.dirname(job.output_file);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  db.prepare(`
    UPDATE jobs SET status = 'processing', started_at = datetime('now')
    WHERE id = ?
  `).run(job.id);
  
  const args = buildHandBrakeArgs(job, settings);
  
  const handbrake = spawn('HandBrakeCLI', args);
  activeJobs.set(job.id, handbrake);
  
  let outputData = '';
  let errorData = '';
  
  handbrake.stdout.on('data', (data) => {
    outputData += data.toString();
    parseProgress(job.id, outputData);
  });
  
  handbrake.stderr.on('data', (data) => {
    errorData += data.toString();
  });
  
  handbrake.on('close', (code) => {
    activeJobs.delete(job.id);
    processingCount--;
    
    if (code === 0) {
      db.prepare(`
        UPDATE jobs
        SET status = 'completed', progress = 100, completed_at = datetime('now')
        WHERE id = ?
      `).run(job.id);
      
      console.log(`Job ${job.id} completed successfully`);
    } else if (code === null) {
      console.log(`Job ${job.id} was cancelled`);
    } else {
      db.prepare(`
        UPDATE jobs
        SET status = 'failed', error_log = ?, completed_at = datetime('now')
        WHERE id = ?
      `).run(errorData, job.id);
      
      console.error(`Job ${job.id} failed with code ${code}:`, errorData);
    }
    
    processNextJob();
  });
  
  handbrake.on('error', (error) => {
    activeJobs.delete(job.id);
    processingCount--;
    
    db.prepare(`
      UPDATE jobs
      SET status = 'failed', error_log = ?, completed_at = datetime('now')
      WHERE id = ?
    `).run(error.message, job.id);
    
    console.error(`Job ${job.id} error:`, error);
    
    processNextJob();
  });
}

function parseProgress(jobId, data) {
  const db = getDatabase();
  
  const progressMatch = data.match(/Encoding:.*?(\d+\.?\d*)\s*%/);
  if (progressMatch) {
    const progress = parseFloat(progressMatch[1]);
    
    db.prepare(`
      UPDATE jobs SET progress = ? WHERE id = ?
    `).run(progress, jobId);
  }
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
  
  const nextJob = db.prepare(`
    SELECT * FROM jobs
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT 1
  `).get();
  
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

module.exports = {
  startTranscode,
  cancelTranscode,
  pauseTranscode,
  resumeTranscode,
  getActiveJobs,
  getProcessingCount
};
