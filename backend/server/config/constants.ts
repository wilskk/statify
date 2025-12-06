/*
 * Konfigurasi statis server (tanpa environment variables)
 */
import path from 'path';
import os from 'os';

// Port HTTP untuk server Express
export const PORT: number = 5000;

export const MAX_UPLOAD_SIZE_MB: number = 10;

// Lokasi direktori sementara: gunakan direktori temp OS untuk memastikan izin tulis
// Contoh: C:\\Users\\<user>\\AppData\\Local\\Temp\\statify
export const getTempDir = (): string => path.join(os.tmpdir(), 'statify');

// Feature flags
export const RATE_LIMIT_ENABLED: boolean = false; // Nonaktif secara default (ramah untuk uji beban lokal/dev)
export const DEBUG_SAV: boolean = false; // Log detail untuk proses pembuatan SAV

export const ALLOWED_ORIGINS: string[] = [
  'https://statify-dev.student.stis.ac.id',
  'http://statify-dev.student.stis.ac.id',
  'http://localhost:3001',
  'http://localhost:3000',
];

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 menit
export const RATE_LIMIT_MAX = 100; // kuota maksimum per kunci per jendela waktu
