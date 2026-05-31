import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../utils/logger';

function generateSecret(): string {
  return crypto.randomBytes(48).toString('base64').replace(/[+/=]/g, '');
}

const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 52389,
  jwtSecret: process.env.JWT_SECRET || generateSecret(),
  jwtExpiresIn: '24h',
  refreshTokenExpiresIn: '90d',
  maxConcurrentJobs: process.env.MAX_CONCURRENT_JOBS
    ? parseInt(process.env.MAX_CONCURRENT_JOBS)
    : 2,
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
