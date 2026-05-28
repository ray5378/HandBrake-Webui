/**
 * 日志工具
 * @module utils/logger
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel = process.env.LOG_LEVEL
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO
  : LOG_LEVELS.INFO;

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';

  return `[${timestamp}] [${level}] ${message} ${metaStr}`.trim();
}

function error(message, meta = {}) {
  if (currentLevel >= LOG_LEVELS.ERROR) {
    console.error(formatMessage('ERROR', message, meta));
  }
}

function warn(message, meta = {}) {
  if (currentLevel >= LOG_LEVELS.WARN) {
    console.warn(formatMessage('WARN', message, meta));
  }
}

function info(message, meta = {}) {
  if (currentLevel >= LOG_LEVELS.INFO) {
    console.info(formatMessage('INFO', message, meta));
  }
}

function debug(message, meta = {}) {
  if (currentLevel >= LOG_LEVELS.DEBUG) {
    console.debug(formatMessage('DEBUG', message, meta));
  }
}

module.exports = {
  error,
  warn,
  info,
  debug,
  LOG_LEVELS
};
