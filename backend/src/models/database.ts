import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import logger from '../utils/logger';
import { PASSWORD_CONFIG } from '../constants';
import { getFullDefaultPresets } from '../constants/presets';

let db: Database.Database | null = null;

export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = config.databasePath!;
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  runMigrations();
  createIndexes();
  createDefaultData();

  logger.info('Database initialized', { path: dbPath });

  return db;
}

function createTables(): void {
  db!.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_file TEXT NOT NULL,
      output_file TEXT NOT NULL,
      preset_id TEXT,
      status TEXT DEFAULT 'queued',
      progress REAL DEFAULT 0,
      error_log TEXT,
      settings TEXT,
      source_file_size INTEGER,
      output_file_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      settings TEXT NOT NULL,
      is_built_in INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  logger.info('Database tables created');
}

function runMigrations(): void {
  const migrations = [
    'ALTER TABLE jobs ADD COLUMN source_file_size INTEGER',
    'ALTER TABLE jobs ADD COLUMN output_file_size INTEGER',
    'ALTER TABLE jobs ADD COLUMN eta_seconds INTEGER'
  ];
  for (const sql of migrations) {
    try {
      db!.exec(sql);
      logger.info('Migration applied', { sql });
    } catch (e) {
      // 字段已存在时静默跳过
    }
  }
}

function createIndexes(): void {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)',
    'CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at)',
    'CREATE INDEX IF NOT EXISTS idx_presets_builtin ON presets(is_built_in)'
  ];

  indexes.forEach(sql => {
    try {
      db!.exec(sql);
    } catch (error: unknown) {
      const err = error as Error;
      logger.warn('Index creation failed', { error: err.message });
    }
  });

  logger.info('Database indexes created');
}

async function createDefaultData(): Promise<void> {
  const presetCount = db!
    .prepare('SELECT COUNT(*) as count FROM presets WHERE is_built_in = 1')
    .get() as { count: number };

  if (presetCount.count === 0) {
    const defaultPresets = await getFullDefaultPresets();

    const insertPreset = db!.prepare(`
      INSERT INTO presets (id, name, description, settings, is_built_in)
      VALUES (?, ?, ?, ?, 1)
    `);

    defaultPresets.forEach(preset => {
      insertPreset.run(preset.id, preset.name, preset.description, preset.settings);
    });

    logger.info('Default presets created', { count: defaultPresets.length });
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    return initializeDatabase();
  }

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

export function query(sql: string, params: unknown[] = []): unknown[] {
  try {
    const stmt = db!.prepare(sql);
    return stmt.all(...params);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Database query failed', { sql, error: err.message });
    throw error;
  }
}

export function execute(sql: string, params: unknown[] = []): Database.RunResult {
  try {
    const stmt = db!.prepare(sql);
    return stmt.run(...params);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Database execute failed', { sql, error: err.message });
    throw error;
  }
}
