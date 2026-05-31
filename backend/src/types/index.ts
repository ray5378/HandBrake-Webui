import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

export interface User {
  id: string;
  username: string;
  password?: string;
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

export interface Preset {
  id: string;
  name: string;
  description: string | null;
  settings: string;
  is_built_in: number;
  created_at: string;
  isBuiltIn?: boolean;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  username?: string;
  role?: string;
}

export interface AppConfig {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  maxConcurrentJobs: number;
  configDir: string;
  cacheDir: string | null;
  databasePath: string | null;
  initialized: boolean;
  initialize(): void;
  saveConfig(): void;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
