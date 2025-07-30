# Playwright E2E Testing untuk Statify

Direktori ini berisi end-to-end tests menggunakan Playwright untuk aplikasi Statify.

## Setup

Playwright sudah dikonfigurasi dan siap digunakan. Browser yang diperlukan sudah diinstall secara otomatis.

## Menjalankan Tests

### Menjalankan semua tests
```bash
npm run test:e2e
```

### Menjalankan tests dengan UI mode (interaktif)
```bash
npm run test:e2e:ui
```

### Menjalankan tests dengan browser terlihat (headed mode)
```bash
npm run test:e2e:headed
```

### Debug mode untuk troubleshooting
```bash
npm run test:e2e:debug
```

### Menjalankan test spesifik
```bash
npx playwright test example.spec.ts
```

### Menjalankan test pada browser spesifik
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Struktur Test

- `example.spec.ts` - Contoh test dasar untuk halaman utama dan fitur-fitur utama
- Tambahkan file test baru dengan pattern `*.spec.ts` atau `*.test.ts`

## Konfigurasi

Konfigurasi Playwright ada di `playwright.config.ts` di root project. Konfigurasi ini mencakup:

- **Base URL**: `http://localhost:3001` (frontend development server)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Screenshots**: Diambil saat test gagal
- **Videos**: Direkam saat test gagal
- **Traces**: Dikumpulkan saat retry test yang gagal

## Tips Menulis Test

### 1. Gunakan data-testid untuk selector yang stabil
```typescript
// Baik
const button = page.locator('[data-testid="submit-button"]');

// Hindari (bisa berubah)
const button = page.locator('.btn-primary');
```

### 2. Tunggu elemen sebelum interaksi
```typescript
// Tunggu elemen muncul
await expect(page.locator('[data-testid="upload-area"]')).toBeVisible();

// Baru lakukan interaksi
await page.locator('[data-testid="upload-area"]').click();
```

### 3. Gunakan assertions yang tepat
```typescript
// Untuk teks
await expect(page.locator('h1')).toHaveText('Statify Dashboard');

// Untuk visibility
await expect(page.locator('.modal')).toBeVisible();

// Untuk URL
await expect(page).toHaveURL('/dashboard');
```

### 4. Kelompokkan test yang berkaitan
```typescript
test.describe('Fitur Upload Data', () => {
  test('dapat upload file CSV', async ({ page }) => {
    // test implementation
  });
  
  test('dapat upload file Excel', async ({ page }) => {
    // test implementation
  });
});
```

## Debugging

### 1. Gunakan page.pause() untuk debugging interaktif
```typescript
test('debug test', async ({ page }) => {
  await page.goto('/');
  await page.pause(); // Browser akan pause di sini
});
```

### 2. Ambil screenshot manual
```typescript
await page.screenshot({ path: 'debug-screenshot.png' });
```

### 3. Console log dari browser
```typescript
page.on('console', msg => console.log('Browser log:', msg.text()));
```

## Continuous Integration

Test Playwright akan berjalan otomatis di CI dengan konfigurasi:
- Retry: 2x jika gagal
- Workers: 1 (untuk menghindari race condition)
- Hanya browser Chromium (untuk performa)

## File yang Dihasilkan

- `test-results/` - Screenshot dan video dari test yang gagal
- `playwright-report/` - HTML report dengan detail hasil test
- `blob-report/` - Raw data untuk report

Semua file ini sudah ditambahkan ke `.gitignore`.

## Troubleshooting

### Development server tidak berjalan
Pastikan frontend development server berjalan di `http://localhost:3001` sebelum menjalankan test.

### Browser tidak terinstall
Jalankan `npx playwright install` untuk menginstall browser yang diperlukan.

### Test timeout
Tingkatkan timeout di `playwright.config.ts` jika aplikasi membutuhkan waktu loading yang lama.

### Port conflict
Ubah port di `playwright.config.ts` jika aplikasi berjalan di port yang berbeda.