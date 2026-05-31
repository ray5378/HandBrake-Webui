import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 52389,
  jwtSecret: process.env.JWT_SECRET || generateSecret(),
  jwtExpiresIn: '24h',
  refreshTokenExpiresIn: '90d',
  maxConcurrentJobs: 2,
  configDir: process.env.CONFIG_DIR || '/config',
  cacheDir: process.env.CACHE_DIR || null,
  databasePath: null as string | null,
  initialized: false,

  initialize(): void {
    if (config.initialized) {
      return;
    }

    const configPath = path.join(config.configDir, 'config.json');

    if (fs.existsSync(configPath)) {
      const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      Object.assign(config, savedConfig);
    }

    if (process.env.JWT_SECRET) {
      config.jwtSecret = process.env.JWT_SECRET;
    }
    if (process.env.CACHE_DIR) {
      config.cacheDir = process.env.CACHE_DIR;
    }

    if (!fs.existsSync(configPath)) {
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

    logger.info('Configuration initialized');
    logger.info('Database path: ' + config.databasePath);
    logger.info('Max concurrent jobs: ' + config.maxConcurrentJobs);
  },

  saveConfig(): void {
    const configPath = path.join(config.configDir, 'config.json');
    const configToSave = {
      jwtSecret: config.jwtSecret,
      maxConcurrentJobs: config.maxConcurrentJobs,
      cacheDir: config.cacheDir
    };
    fs.writeFileSync(configPath, JSON.stringify(configToSave, null, 2));
  }
};

export default config;
