# Statify

Aplikasi Analisis Statistik Open Source dengan frontend Next.js dan backend Express.

## Struktur Proyek

Proyek ini menggunakan struktur monorepo dengan npm workspaces:

```
statify/
├── frontend/        # Next.js application
├── backend/         # Express API
├── package.json     # Root package.json untuk workspaces
└── docker-compose.yml
```

## Pengembangan

### Prasyarat

- Node.js 18+ 
- npm 7+

### Setup Awal

1. Clone repository:
   ```bash
   git clone https://github.com/yourusername/statify.git
   cd statify
   ```

2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Buat file `.env` berdasarkan `.env.example` (jika ada):
   ```bash
   cp .env.example .env
   ```

4. Jalankan aplikasi dalam mode development:
   ```bash
   npm run dev
   ```

Ini akan menjalankan frontend di http://localhost:3000 dan backend di http://localhost:5000.

## Menggunakan Docker

1. Build dan jalankan container:
   ```bash
   docker compose up -d
   ```

2. Akses aplikasi di:
   - Frontend: http://localhost:3001
   - Backend: http://localhost:5000

## Deployment

Aplikasi dikonfigurasi untuk deployment sebagai container Docker. Lihat `frontend/Dockerfile.frontend` dan `backend/Dockerfile.backend` untuk detail konfigurasi.

## Lisensi

[License informasi]
