export const LOG_LEVELS: Record<string, number> = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel: number = process.env.LOG_LEVEL
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO
  : LOG_LEVELS.INFO;

function formatMessage(level: string, message: string, meta: Record<string, unknown> = {}): string {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';

  return `[${timestamp}] [${level}] ${message} ${metaStr}`.trim();
}

export function error(message: string, meta: Record<string, unknown> = {}): void {
  if (currentLevel >= LOG_LEVELS.ERROR) {
    console.error(formatMessage('ERROR', message, meta));
  }
}

export function warn(message: string, meta: Record<string, unknown> = {}): void {
  if (currentLevel >= LOG_LEVELS.WARN) {
    console.warn(formatMessage('WARN', message, meta));
  }
}

export function info(message: string, meta: Record<string, unknown> = {}): void {
  if (currentLevel >= LOG_LEVELS.INFO) {
    console.info(formatMessage('INFO', message, meta));
  }
}

export function debug(message: string, meta: Record<string, unknown> = {}): void {
  if (currentLevel >= LOG_LEVELS.DEBUG) {
    console.debug(formatMessage('DEBUG', message, meta));
  }
}

export default {
  error,
  warn,
  info,
  debug,
  LOG_LEVELS
};
