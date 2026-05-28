const fs = require('fs');
const path = require('path');

const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 52389,
  jwtSecret: process.env.JWT_SECRET || generateSecret(),
  jwtExpiresIn: '1h',
  refreshTokenExpiresIn: '7d',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'changeme123',
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS) || 2,
  uploadDir: process.env.UPLOAD_DIR || '/source',
  outputDir: process.env.OUTPUT_DIR || '/output',
  configDir: process.env.CONFIG_DIR || '/config',
  databasePath: null,
  initialized: false
};

function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function initialize() {
  if (config.initialized) {
    return;
  }

  const configPath = path.join(config.configDir, 'config.json');

  if (fs.existsSync(configPath)) {
    const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    Object.assign(config, savedConfig);
  } else {
    if (!fs.existsSync(config.configDir)) {
      fs.mkdirSync(config.configDir, { recursive: true });
    }

    const initialConfig = {
      jwtSecret: config.jwtSecret,
      maxConcurrentJobs: config.maxConcurrentJobs
    };

    fs.writeFileSync(configPath, JSON.stringify(initialConfig, null, 2));
  }

  config.databasePath = path.join(config.configDir, 'database.sqlite');
  config.initialized = true;

  console.log('Configuration initialized');
  console.log(`Database path: ${config.databasePath}`);
  console.log(`Max concurrent jobs: ${config.maxConcurrentJobs}`);
}

function saveConfig() {
  const configPath = path.join(config.configDir, 'config.json');
  const configToSave = {
    jwtSecret: config.jwtSecret,
    maxConcurrentJobs: config.maxConcurrentJobs
  };
  fs.writeFileSync(configPath, JSON.stringify(configToSave, null, 2));
}

module.exports = {
  ...config,
  initialize,
  saveConfig
};
