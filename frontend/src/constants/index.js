/**
 * 应用常量定义
 */

/**
 * 任务状态映射
 */
export const JOB_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  PAUSED: 'paused'
};

/**
 * 任务状态显示配置
 */
export const JOB_STATUS_CONFIG = {
  queued: {
    label: '排队中',
    color: 'warning',
    icon: 'clock'
  },
  processing: {
    label: '转码中',
    color: 'primary',
    icon: 'play'
  },
  completed: {
    label: '已完成',
    color: 'success',
    icon: 'check'
  },
  failed: {
    label: '失败',
    color: 'error',
    icon: 'x'
  },
  cancelled: {
    label: '已取消',
    color: 'gray',
    icon: 'x'
  },
  paused: {
    label: '已暂停',
    color: 'warning',
    icon: 'pause'
  }
};

/**
 * 视频编码选项
 */
export const VIDEO_CODECS = [
  { value: 'libx264', label: 'H.264 (最兼容)' },
  { value: 'libx265', label: 'H.265/HEVC (更高压缩)' },
  { value: 'libvpx-vp9', label: 'VP9 (WebM)' }
];

/**
 * 音频编码选项
 */
export const AUDIO_CODECS = [
  { value: 'aac', label: 'AAC (推荐)' },
  { value: 'libopus', label: 'Opus (WebM)' },
  { value: 'mp3', label: 'MP3' }
];

/**
 * 输出格式选项
 */
export const OUTPUT_FORMATS = [
  { value: 'mp4', label: 'MP4' },
  { value: 'mkv', label: 'MKV' },
  { value: 'webm', label: 'WebM' }
];

/**
 * 编码预设
 */
export const ENCODER_PRESETS = [
  { value: 'ultrafast', label: 'ultrafast (最快)' },
  { value: 'superfast', label: 'superfast' },
  { value: 'veryfast', label: 'veryfast' },
  { value: 'faster', label: 'faster' },
  { value: 'fast', label: 'fast' },
  { value: 'medium', label: 'medium (平衡)' },
  { value: 'slow', label: 'slow' },
  { value: 'slower', label: 'slower' },
  { value: 'veryslow', label: 'veryslow (最佳)' }
];

/**
 * 分页配置
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

/**
 * 路由路径
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  FILES: '/files',
  TRANSCODE: '/transcode',
  JOBS: '/jobs',
  JOB_DETAIL: '/jobs/:id',
  PRESETS: '/presets',
  SETTINGS: '/settings'
};
