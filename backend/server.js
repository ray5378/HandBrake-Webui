const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const config = require('./src/config');
const errorHandler = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/auth');
const fileRoutes = require('./src/routes/files');
const jobRoutes = require('./src/routes/jobs');
const presetRoutes = require('./src/routes/presets');
const userRoutes = require('./src/routes/users');
const systemRoutes = require('./src/routes/system');

const app = express();

config.initialize();

const cacheDir = config.cacheDir;
if (cacheDir) {
  const cacheTempDir = `${cacheDir}/handbrake-temp`;
  try {
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheTempDir, { recursive: true, force: true });
      fs.mkdirSync(cacheTempDir, { recursive: true });
    }
  } catch (e) {
    console.warn('Failed to clean cache directory:', e.message);
  }
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false
  })
);

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    credentials: true
  })
);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('combined'));
}

const authStrictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many attempts, please try again later.' }
});

app.use('/api/auth/login', authStrictLimiter);
app.use('/api/auth/setup-admin', authStrictLimiter);
app.use('/api/auth/logout', authStrictLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/presets', presetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/system', systemRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
});

app.use(errorHandler);

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`HandBrake Web UI server running on port ${config.port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  if (config.cacheDir) {
    const { startThumbnailCleanup } = require('./src/services/thumbnailService');
    startThumbnailCleanup();
    console.log('Thumbnail cleanup service started');
  }
});

const shutdown = async signal => {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed');
  });

  try {
    const { closeDatabase } = require('./src/models/database');
    closeDatabase();
  } catch (e) {
    // ignore
  }

  try {
    const { killAllJobs } = require('./src/services/handbrakeService');
    killAllJobs();
  } catch (e) {
    // ignore
  }

  setTimeout(() => process.exit(0), 5000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
