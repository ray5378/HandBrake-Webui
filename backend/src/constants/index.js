/**
 * 应用常量定义
 * @module constants
 */

/**
 * JWT Token 配置
 */
const JWT_CONFIG = {
  EXPIRES_IN: '1h',
  REFRESH_EXPIRES_IN: '7d',
  ALGORITHM: 'HS256'
};

/**
 * 密码配置
 */
const PASSWORD_CONFIG = {
  MIN_LENGTH: 6,
  BCRYPT_ROUNDS: 12
};

/**
 * 上传配置
 */
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024 * 1024, // 10GB
  ALLOWED_EXTENSIONS: [
    '.mp4',
    '.mkv',
    '.avi',
    '.mov',
    '.wmv',
    '.flv',
    '.webm',
    '.m4v',
    '.mpg',
    '.mpeg'
  ]
};

/**
 * 任务状态枚举
 */
const JOB_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  PAUSED: 'paused'
};

/**
 * 用户角色枚举
 */
const USER_ROLE = {
  ADMIN: 'admin',
  USER: 'user'
};

/**
 * HTTP 状态码
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500
};

/**
 * API 响应消息
 */
const RESPONSE_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: '登录成功',
    LOGOUT_SUCCESS: '登出成功',
    REGISTER_SUCCESS: '注册成功',
    INVALID_CREDENTIALS: '用户名或密码错误',
    TOKEN_EXPIRED: 'Token 已过期',
    TOKEN_INVALID: 'Token 无效'
  },
  JOB: {
    CREATE_SUCCESS: '任务创建成功',
    CANCEL_SUCCESS: '任务已取消',
    DELETE_SUCCESS: '任务已删除',
    NOT_FOUND: '任务不存在'
  },
  FILE: {
    UPLOAD_SUCCESS: '文件上传成功',
    DELETE_SUCCESS: '文件删除成功',
    NOT_FOUND: '文件不存在'
  }
};

module.exports = {
  JWT_CONFIG,
  PASSWORD_CONFIG,
  UPLOAD_CONFIG,
  JOB_STATUS,
  USER_ROLE,
  HTTP_STATUS,
  RESPONSE_MESSAGES
};
