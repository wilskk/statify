# Backend Load Tests

This directory contains load tests for the Statify backend APIs.

## Test Scripts

### Comprehensive Tests
1. **sav-apis-test.js** - Test lengkap untuk SAV APIs dengan multiple scenarios (read dan write operations)
2. **sav-production-test.js** - Test untuk production environment
3. **sav-write-small-test.js** - Test khusus untuk write operations dengan data kecil

### Quick & Focused Tests (Baru)
4. **sav-rate-limit-test.js** - 🎯 **Test untuk mengetahui batas rate limit dengan 5 phase bertahap**
   - Phase 1: 1 req/s (Baseline)
   - Phase 2: 2 req/s (Light Load) 
   - Phase 3: 5 req/s (Medium Load)
   - Phase 4: 10 req/s (High Load)
   - Phase 5: 20 req/s (Stress Test)
   - **Tujuan**: Mengetahui kapan mulai terkena rate limit (429)

5. **sav-quick-rate-test.js** - ⚡ **Test cepat untuk mengetahui berapa request sebelum rate limit**
   - 1 VU dengan delay minimal
   - Durasi: 2 menit
   - **Tujuan**: Cepat mengetahui batas rate limit dan pola recovery

6. **sav-speed-test.js** - 🚀 **Test kecepatan response time minimal**
   - Payload super minimal
   - Delay 10 detik antar request
   - **Tujuan**: Baseline performa dan waktu response tercepat

7. **sav-minimal-test.js** - Test minimal untuk production dengan toleransi tinggi
8. **sav-single-test.js** - Test single request untuk debugging

## Running Tests

From the project root directory:

```bash
# Test lengkap SAV APIs
npm run test:load:sav

# Test rate limit (recommended untuk mengetahui batas)
k6 run load-tests/backend/sav-rate-limit-test.js

# Test cepat rate limit
k6 run load-tests/backend/sav-quick-rate-test.js

# Test kecepatan response
k6 run load-tests/backend/sav-speed-test.js

# Test minimal production
k6 run load-tests/backend/sav-minimal-test.js

# Test single request
k6 run load-tests/backend/sav-single-test.js
```

## Rekomendasi Penggunaan

### Untuk Mengetahui Rate Limit:
1. **Mulai dengan**: `sav-speed-test.js` - untuk baseline performa
2. **Lanjut dengan**: `sav-quick-rate-test.js` - untuk cepat tahu batas rate limit
3. **Detail analysis**: `sav-rate-limit-test.js` - untuk analisis mendalam

### Untuk Testing Rutin:
- **Development**: `sav-single-test.js` atau `sav-minimal-test.js`
- **Production**: `sav-minimal-test.js` dengan delay panjang
- **Load Testing**: `sav-apis-test.js` (setelah tahu batas rate limit)
