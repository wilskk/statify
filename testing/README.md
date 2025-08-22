# Statify Testing Framework

Performance testing untuk Statify menggunakan k6.

## Setup

k6 sudah terinstall secara global. Untuk menjalankan test:

### Basic Tests
```bash
npm test                # Basic test
npm run test:smoke      # Smoke test (1 VU, 30s)
npm run test:load       # Load test (10 VU, 60s)
npm run test:stress     # Stress test (50 VU, 120s)
npm run test:report     # Test dengan JSON report
```

### Browser UI Tests
```bash
npm run test:browser:frequencies        # Test frequencies analysis workflow (slow, ~5-10 min)
npm run test:browser:frequencies:patient # Same test with quiet output for slow operations  
npm run test:browser:smoke             # Browser smoke test (fast, ~10-30 sec)
npm run test:browser:simple            # Alias for smoke test
```

**Note**: Test frequencies analysis membutuhkan waktu lama karena proses import dataset di Statify memang lambat. Test ini akan menunggu hingga 15 detik untuk dataset loading dan total timeout 10 menit.
### Statify Specific Tests
```bash
npm run test:dashboard       # Test dashboard page (5 VU, 60s)
npm run test:multi-page      # Test multiple pages (3 VU, 45s)
npm run test:all-statify     # Run all Statify tests
```

## Target Website

Tests dikonfigurasi untuk website:
- **Main Target**: https://statify-dev.student.stis.ac.id/dashboard/data
- **Base URL**: https://statify-dev.student.stis.ac.id

## Struktur Direktori

```
tests/
  performance/              # k6 performance tests
    basic-test.js          # Basic test template
    statify-dashboard-test.js    # Specific dashboard test
    statify-multi-page-test.js   # Multi-page test
  browser/                  # k6 browser UI tests
    statify-frequencies-analysis.js  # Frequencies analysis workflow test
reports/                   # Test reports dan hasil
```

## Membuat Test Baru

1. Buat file `.js` baru di `tests/performance/`
2. Gunakan template dasar k6
3. Update script di `package.json` jika diperlukan

## Contoh Test Dasar

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1,
  duration: '30s',
};

export default function () {
  let response = http.get('https://your-api.com/endpoint');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```
