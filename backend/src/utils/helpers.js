/**
 * 通用工具函数
 * @module utils/helpers
 */

const { v4: uuidv4 } = require('uuid');

/**
 * 生成 UUID
 * @returns {string} UUID 字符串
 */
function generateId() {
  return uuidv4();
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) {
    return '0 B';
  }

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
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 安全解析 JSON
 * @param {string} str - JSON 字符串
 * @param {*} defaultValue - 默认值
 * @returns {*} 解析结果或默认值
 */
function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * 验证文件扩展名
 * @param {string} filename - 文件名
 * @param {string[]} allowedExtensions - 允许的扩展名数组
 * @returns {boolean} 是否合法
 */
function isValidExtension(filename, allowedExtensions) {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));

  return allowedExtensions.includes(ext);
}

/**
 * 清理字符串（去除首尾空格）
 * @param {string} str - 输入字符串
 * @returns {string} 清理后的字符串
 */
function trimString(str) {
  return typeof str === 'string' ? str.trim() : '';
}

/**
 * 构建分页响应
 * @param {Array} items - 数据数组
 * @param {number} total - 总数
 * @param {number} page - 当前页码
 * @param {number} limit - 每页数量
 * @returns {Object} 分页响应对象
 */
function buildPaginationResponse(items, total, page, limit) {
  return {
    items,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  };
}

/**
 * 构建成功响应
 * @param {*} data - 响应数据
 * @param {string} message - 成功消息
 * @returns {Object} 成功响应对象
 */
function buildSuccessResponse(data, message = null) {
  const response = {
    success: true,
    data
  };

  if (message) {
    response.message = message;
  }

  return response;
}

/**
 * 构建错误响应
 * @param {string} error - 错误信息
 * @param {Array} details - 错误详情
 * @returns {Object} 错误响应对象
 */
function buildErrorResponse(error, details = null) {
  const response = {
    success: false,
    error
  };

  if (details) {
    response.details = details;
  }

  return response;
}

module.exports = {
  generateId,
  formatFileSize,
  formatDuration,
  sleep,
  safeJsonParse,
  isValidExtension,
  trimString,
  buildPaginationResponse,
  buildSuccessResponse,
  buildErrorResponse
};
