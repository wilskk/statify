# Statify Backend Configuration

This document explains how the backend is configured, what each constant means, and how to change them. The backend does not read environment variables at runtime. All configuration is centralized and static in `server/config/constants.ts`.

## Why static configuration?

- Predictable and reproducible builds
- Simpler runtime behavior (no hidden env coupling)
- Clear single source of truth (`constants.ts`)

If you need to change behavior, edit the constants and rebuild/redeploy your app (or rebuild the Docker image).

## Source of truth

- File: `backend/server/config/constants.ts`
- Used by: `server/app.ts`, `server/index.ts`, controllers/services

## Configuration reference

```ts
// backend/server/config/constants.ts
export const PORT: number = 5000;
export const MAX_UPLOAD_SIZE_MB: number = 10;
export const getTempDir = (): string => path.join(os.tmpdir(), 'statify');

// Feature flags
export const RATE_LIMIT_ENABLED: boolean = false; // Global /api rate limit toggle (off by default)
export const DEBUG_SAV: boolean = false;         // Verbose logging for SAV generation

// CORS
export const ALLOWED_ORIGINS: string[] = [
  'https://statify-dev.student.stis.ac.id',
  'http://statify-dev.student.stis.ac.id',
  'http://localhost:3001',
  'http://localhost:3000',
];

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX = 100;                  // Max requests per key per window
```

### Details

- PORT
  - Listening port for the Express server.
  - Default: `5000`.

- MAX_UPLOAD_SIZE_MB
  - Maximum allowed size for uploaded `.sav` files.
  - Default: `10` MB.

- getTempDir()
  - Returns the OS temporary directory joined with `statify`.
  - Example (Windows): `C:\\Users\\<user>\\AppData\\Local\\Temp\\statify`
  - Temporary files are created per operation and cleaned up after use.

- RATE_LIMIT_ENABLED, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX
  - When enabled, a global rate limiter is applied to all routes under the `/api` prefix.
  - Keying strategy (see `server/app.ts`): uses `X-User-Id` header if present; otherwise uses the client IP.
  - Default: disabled (`false`), window 15 minutes, max 100 requests per window.

- DEBUG_SAV
  - Enables verbose logging for SAV creation flows in `savController.ts`.
  - Default: `false`.

- ALLOWED_ORIGINS
  - Whitelist of origins allowed by CORS.
  - Update this list when deploying to new domains.

## How to change configuration

1) Edit `backend/server/config/constants.ts` with your desired values.
2) Rebuild and restart the backend:

```bash
# from repo root or backend directory
npm run build
npm start
```

## Docker notes

- The backend does not read runtime environment variables for configuration.
- After changing `constants.ts`, you must rebuild the Docker image.

```bash
# from backend/
docker build -f Dockerfile.backend -t statify-backend:latest .
docker run -p 5000:5000 --name statify-backend statify-backend:latest
```

## FAQ

- How do I run on a different port?
  - Edit `PORT` in `constants.ts`, rebuild, and restart (or rebuild the Docker image).

- Can I quickly override via environment variables?
  - No. Runtime env parsing is intentionally not supported. Use the static constants for clarity and reproducibility.

- Where are temporary files written?
  - `getTempDir()` returns the OS temp dir joined with `statify`. Files are cleaned up after each operation.
