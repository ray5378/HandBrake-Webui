/**
 * 数据库初始化和连接管理
 * @module models/database
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');
const { PASSWORD_CONFIG } = require('../constants');
const { getFullDefaultPresets } = require('../constants/presets');

let db = null;

/**
 * 初始化数据库连接
 * @returns {Database} 数据库实例
 */
function initializeDatabase() {
  if (db) {
    return db;
  }

  const dbPath = config.databasePath;
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

/**
 * 创建数据表
 */
function createTables() {
  db.exec(`
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

function runMigrations() {
  const migrations = [
    'ALTER TABLE jobs ADD COLUMN source_file_size INTEGER',
    'ALTER TABLE jobs ADD COLUMN output_file_size INTEGER',
    'ALTER TABLE jobs ADD COLUMN eta_seconds INTEGER'
  ];
  for (const sql of migrations) {
    try {
      db.exec(sql);
      logger.info('Migration applied', { sql });
    } catch (e) {
      // 字段已存在时静默跳过
    }
  }
}

/**
 * 创建索引
 */
function createIndexes() {
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
      db.exec(sql);
    } catch (error) {
      logger.warn('Index creation failed', { error: error.message });
    }
  });

  logger.info('Database indexes created');
}

/**
 * 创建默认数据
 */
function createDefaultData() {
  // 创建默认预设
  const presetCount = db
    .prepare('SELECT COUNT(*) as count FROM presets WHERE is_built_in = 1')
    .get();

  if (presetCount.count === 0) {
    const defaultPresets = getFullDefaultPresets();

    const insertPreset = db.prepare(`
      INSERT INTO presets (id, name, description, settings, is_built_in)
      VALUES (?, ?, ?, ?, 1)
    `);

    defaultPresets.forEach(preset => {
      insertPreset.run(preset.id, preset.name, preset.description, preset.settings);
    });

    logger.info('Default presets created', { count: defaultPresets.length });
  }
}

/**
 * 获取数据库实例
 * @returns {Database} 数据库实例
 */
function getDatabase() {
  if (!db) {
    return initializeDatabase();
  }

  return db;
}

/**
 * 关闭数据库连接
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

/**
 * 执行查询（带日志）
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数数组
 * @returns {Array} 查询结果
 */
function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (error) {
    logger.error('Database query failed', { sql, error: error.message });
    throw error;
  }
}

/**
 * 执行插入/更新
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数数组
 * @returns {Object} 执行结果
 */
function execute(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  } catch (error) {
    logger.error('Database execute failed', { sql, error: error.message });
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  query,
  execute
};
