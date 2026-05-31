export const JWT_CONFIG = {
  EXPIRES_IN: '24h',
  REFRESH_EXPIRES_IN: '90d',
  ALGORITHM: 'HS256'
} as const;

export const PASSWORD_CONFIG = {
  MIN_LENGTH: 6,
  BCRYPT_ROUNDS: 12
} as const;

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024 * 1024,
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
} as const;

export const JOB_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  PAUSED: 'paused'
} as const;

export const USER_ROLE = {
  ADMIN: 'admin',
  USER: 'user'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500
} as const;

export const RESPONSE_MESSAGES = {
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
} as const;
