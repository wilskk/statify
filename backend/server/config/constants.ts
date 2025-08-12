import path from 'path';
import os from 'os';

// Centralized static config (no environment variables)
export const PORT: number = 5000;

export const MAX_UPLOAD_SIZE_MB: number = 10;

// TEMP dir resolver -> use OS temp directory to ensure write permissions
// Example: C:\\Users\\<user>\\AppData\\Local\\Temp\\statify
export const getTempDir = (): string => path.join(os.tmpdir(), 'statify');

// Feature flags
export const RATE_LIMIT_ENABLED: boolean = false; // Disabled for local/dev load testing
export const DEBUG_SAV: boolean = false; // Verbose logging toggle for SAV create

export const ALLOWED_ORIGINS: string[] = [
  'https://statify-dev.student.stis.ac.id',
  'http://statify-dev.student.stis.ac.id',
  'http://localhost:3001',
  'http://localhost:3000',
];

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 min
export const RATE_LIMIT_MAX = 100; // max per key per window
