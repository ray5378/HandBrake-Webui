export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string | null;
}

export interface Job {
  id: string;
  user_id: string;
  source_file: string;
  output_file: string;
  preset_id: string | null;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused' | 'skipped';
  progress: number;
  error_log: string | null;
  settings: string | null;
  source_file_size: number | null;
  output_file_size: number | null;
  eta_seconds: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  preset_name?: string;
}

export interface PresetSettings {
  format: string;
  optimize: string;
  summary: Record<string, unknown>;
  video: Record<string, unknown>;
  dimensions: Record<string, unknown>;
  filters: Record<string, unknown>;
  audio: Record<string, unknown>;
  subtitles: Record<string, unknown>;
  chapters: Record<string, unknown>;
  tags: Record<string, unknown>;
}

export interface Preset {
  id: string;
  name: string;
  description: string | null;
  settings: PresetSettings;
  isBuiltIn: boolean;
  created_at: string;
}

export interface SystemInfo {
  handbrakeVersion: string;
  nodeVersion: string;
  uptime: number;
  platform: string;
  arch: string;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  diskUsage: {
    total: number;
    used: number;
    free: number;
  };
}

export interface FileItem {
  name: string;
  path: string;
  size: number;
  extension: string;
  modified: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchResult {
  type: 'file' | 'directory';
  name: string;
  path: string;
  size?: number;
}
