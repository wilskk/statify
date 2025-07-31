# Cross-Browser Testing untuk Statify

Dokumentasi ini menjelaskan konfigurasi dan penggunaan cross-browser testing untuk aplikasi Statify.

## Overview

Statify menggunakan Playwright untuk melakukan pengujian end-to-end secara sequential di berbagai browser:
- **Chromium** (Google Chrome)
- **Firefox** (Mozilla Firefox)
- **WebKit** (Safari)

## Konfigurasi

### Playwright Configuration

File `playwright.config.ts` telah dikonfigurasi untuk:
- **Sequential Execution**: `fullyParallel: false` dan `workers: 1`
- **Extended Timeouts**: Timeout diperpanjang untuk cross-browser compatibility
- **Browser-Specific Settings**: Setiap browser memiliki pengaturan khusus
- **Performance Monitoring**: Tracking metrik performa per browser

### Browser-Specific Settings

#### Chromium
```typescript
{
  name: 'chromium',
  use: { 
    ...devices['Desktop Chrome'],
    launchOptions: {
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor'],
    },
  },
}
```

#### Firefox
```typescript
{
  name: 'firefox',
  use: { 
    ...devices['Desktop Firefox'],
    launchOptions: {
      firefoxUserPrefs: {
        'dom.webnotifications.enabled': false,
        'dom.push.enabled': false,
      },
    },
  },
}
```

#### WebKit
```typescript
{
  name: 'webkit',
  use: { 
    ...devices['Desktop Safari'],
    launchOptions: {
      args: ['--disable-web-security'],
    },
  },
}
```

## Performance Monitoring

### Browser-Specific Metrics

Setiap tes mengumpulkan metrik performa yang spesifik untuk browser:

```typescript
interface PerformanceMetrics {
  // Standard metrics
  renderTime: number;
  loadTime: number;
  memoryUsage: number;
  
  // Browser-specific metrics
  browserName: string;
  browserVersion: string;
  userAgent: string;
  viewport: { width: number; height: number };
  devicePixelRatio: number;
}
```

### Browser-Specific Thresholds

Setiap browser memiliki threshold performa yang berbeda:

| Metric | Chromium | Firefox | WebKit |
|--------|----------|---------|--------|
| Load Time | 3000ms | 3000ms | 3500ms |
| Render Time | 2000ms | 2500ms | 2000ms |
| JS Heap Size | 50MB | 60MB | 40MB |
| DOM Nodes | 1500 | 1500 | 1500 |
| Network Latency | 1000ms | 1000ms | 1000ms |
| Error Rate | 5% | 5% | 5% |

## Cara Menjalankan Tes

### 1. Menggunakan Script PowerShell
```powershell
.\run-cross-browser-tests.ps1
```

### 2. Command Line Manual

#### Semua Browser Sequential
```bash
npx playwright test descriptive-analysis.spec.ts
```

#### Browser Spesifik
```bash
# Chromium saja
npx playwright test --project=chromium

# Firefox saja
npx playwright test --project=firefox

# WebKit saja
npx playwright test --project=webkit
```

#### Mode Debugging
```bash
# Dengan UI mode
npx playwright test --ui

# Dengan headed mode (browser visible)
npx playwright test --headed

# Dengan debug mode
npx playwright test --debug
```

### 3. Tes Spesifik
```bash
# Tes tertentu di semua browser
npx playwright test -g "should complete full descriptive analysis workflow"

# Tes tertentu di browser spesifik
npx playwright test -g "should complete full descriptive analysis workflow" --project=chromium
```

## Hasil dan Laporan

### HTML Report
Setelah tes selesai, laporan HTML tersedia di:
```
playwright-report/index.html
```

Untuk membuka laporan:
```bash
npx playwright show-report
```

### Performance Logs
Setiap tes menghasilkan log performa yang detail:
```
=== Performance Metrics for: Test Name ===
Browser: chromium v139.0.7258.5
Viewport: 1280x720
Device Pixel Ratio: 1
User Agent: Mozilla/5.0...
--- Performance Metrics ---
Load Time: 456.00ms
Render Time (FCP): 456.00ms
Interaction Time: 11393ms
JS Heap Size: 20.69MB
DOM Nodes: 1464
Network Requests: 51
Average Network Latency: 0.00ms
```

### Test Artifacts
Setiap tes yang gagal menghasilkan:
- Screenshot
- Video recording
- Trace file
- Performance metrics JSON
- Error logs JSON

## Best Practices

### 1. Sequential Testing
- Tes dijalankan secara sequential untuk menghindari konflik resource
- Setiap browser dijalankan satu per satu untuk hasil yang konsisten

### 2. Browser Compatibility
- Gunakan selector yang kompatibel dengan semua browser
- Hindari fitur browser-specific dalam tes
- Test timeout disesuaikan dengan karakteristik setiap browser

### 3. Performance Monitoring
- Monitor metrik performa di setiap browser
- Bandingkan hasil antar browser untuk identifikasi masalah
- Set threshold yang realistis untuk setiap browser

### 4. Error Handling
- Setiap browser memiliki karakteristik error yang berbeda
- Monitor JavaScript errors dan network failures
- Gunakan retry mechanism untuk tes yang flaky

## Troubleshooting

### Common Issues

1. **Timeout di WebKit**
   - WebKit cenderung lebih lambat, gunakan timeout yang lebih panjang
   - Periksa network requests yang mungkin tertunda

2. **Memory Issues di Firefox**
   - Firefox menggunakan lebih banyak memory
   - Monitor JS heap size dan DOM nodes

3. **Selector Issues**
   - Beberapa selector mungkin tidak bekerja di semua browser
   - Gunakan `data-testid` untuk selector yang stabil

### Debug Commands
```bash
# Debug tes yang gagal
npx playwright test --debug --project=webkit

# Trace viewer untuk analisis detail
npx playwright show-trace test-results/trace.zip

# Inspector untuk debugging real-time
npx playwright test --headed --slowMo=1000
```

## Integrasi CI/CD

Untuk integrasi dengan CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run Cross-Browser Tests
  run: |
    npx playwright install
    npx playwright test descriptive-analysis.spec.ts
  
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Monitoring dan Alerting

- Set up monitoring untuk performance regressions
- Alert jika ada browser yang consistently gagal
- Track performance trends across browsers
- Monitor error rates per browser

---

**Note**: Cross-browser testing memastikan aplikasi Statify bekerja konsisten di semua platform browser utama yang digunakan oleh pengguna.