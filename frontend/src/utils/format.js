/**
 * 格式化工具函数
 */

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 格式化时长（秒转为时分秒）
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时长
 */
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期字符串或 Date 对象
 * @returns {string} 格式化后的日期时间
 */
export function formatDateTime(date) {
  const d = new Date(date);

  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * 格式化相对时间
 * @param {string|Date} date - 日期字符串或 Date 对象
 * @returns {string} 相对时间描述
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} 天前`;
  if (hours > 0) return `${hours} 小时前`;
  if (minutes > 0) return `${minutes} 分钟前`;
  return '刚刚';
}

/**
 * 格式化进度百分比
 * @param {number} progress - 进度值 (0-100)
 * @returns {string} 格式化后的进度
 */
export function formatProgress(progress) {
  return progress.toFixed(1) + '%';
}

/**
 * 截断文本
 * @param {string} text - 文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的文本
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;

  return text.substring(0, maxLength) + '...';
}

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 扩展名
 */
export function getFileExtension(filename) {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

/**
 * 获取文件名（不含扩展名）
 * @param {string} filename - 文件名
 * @returns {string} 不含扩展名的文件名
 */
export function getFileNameWithoutExtension(filename) {
  return filename.slice(0, filename.lastIndexOf('.')) || filename;
}
