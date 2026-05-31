import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function safeJsonParse<T = unknown>(str: string, defaultValue: T | null = null): T | null {
  try {
    return JSON.parse(str) as T;
  } catch (error) {
    return defaultValue;
  }
}

export function isValidExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));

  return allowedExtensions.includes(ext);
}

export function trimString(str: string): string {
  return typeof str === 'string' ? str.trim() : '';
}

export function buildPaginationResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): { items: T[]; pagination: Record<string, unknown> } {
  return {
    items,
    pagination: {
      total,
      page: parseInt(String(page)),
      limit: parseInt(String(limit)),
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  };
}

export function buildSuccessResponse<T>(
  data: T,
  message: string | null = null
): Record<string, unknown> {
  const response: Record<string, unknown> = {
    success: true,
    data
  };

  if (message) {
    response.message = message;
  }

  return response;
}

export function buildErrorResponse(
  error: string,
  details: unknown = null
): Record<string, unknown> {
  const response: Record<string, unknown> = {
    success: false,
    error
  };

  if (details) {
    response.details = details;
  }

  return response;
}
