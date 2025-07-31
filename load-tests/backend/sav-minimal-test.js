import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// === METRIK MINIMAL ===
export const savMinimalSuccessRate = new Rate('sav_minimal_success_rate');
export const savMinimalDuration = new Trend('sav_minimal_duration_ms');

// === KONFIGURASI SANGAT RINGAN ===
export const options = {
  scenarios: {
    sav_minimal_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: '2m'  // 2 menit dengan 1 VU
    }
  },
  thresholds: {
    sav_minimal_success_rate: ['rate>0.20'], // Target minimal 20% success
    sav_minimal_duration_ms: ['p(95)<20000'], // Maksimal 20 detik
    http_req_failed: ['rate<0.90'], // Toleransi 90% failure
    http_req_duration: ['p(95)<30000'] // Maksimal 30 detik
  }
};

/**
 * Fungsi minimal untuk test production SAV API
 * Dengan delay panjang untuk menghindari rate limiting
 */
export default function () {
  // === KONFIGURASI ===
  const baseUrl = 'https://statify-dev.student.stis.ac.id';
  
  // === DATA MINIMAL ===
  const minimalPayload = {
    variables: [
      { name: 'id', label: 'ID', type: 'NUMERIC', width: 5, decimal: 0, measure: 'NOMINAL' },
      { name: 'value', label: 'Value', type: 'NUMERIC', width: 3, decimal: 0, measure: 'SCALE' }
    ],
    data: [
      { id: 1, value: 10 },
      { id: 2, value: 20 }
    ]
  };
  
  // === REQUEST ===
  const startTime = Date.now();
  
  const response = http.post(`${baseUrl}/api/sav/create`, JSON.stringify(minimalPayload), {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream',
      'User-Agent': 'K6-Test/1.0'
    },
    timeout: '60s'
  });
  
  const duration = Date.now() - startTime;
  
  // === VALIDASI ===
  const isSuccess = response.status === 200;
  const isRateLimited = response.status === 429;
  const isServerError = response.status >= 500;
  
  // === METRIK ===
  savMinimalSuccessRate.add(isSuccess ? 1 : 0);
  savMinimalDuration.add(duration);
  
  // === LOGGING DETAIL ===
  if (isSuccess) {
    console.log(`🎉 SUCCESS! Status: ${response.status}, Duration: ${duration}ms, Response Size: ${response.body ? response.body.length : 0}B`);
  } else if (isRateLimited) {
    console.log(`⏳ Rate Limited (429) - Duration: ${duration}ms`);
  } else if (isServerError) {
    console.log(`🔥 Server Error (${response.status}) - Duration: ${duration}ms`);
  } else {
    console.log(`❌ Error ${response.status} - Duration: ${duration}ms, Body: ${response.body ? response.body.substring(0, 50) : 'No body'}`);
  }
  
  // === DELAY PANJANG UNTUK MENGHINDARI RATE LIMITING ===
  if (isRateLimited) {
    console.log('💤 Rate limited detected, sleeping for 10 seconds...');
    sleep(10); // 10 detik jika rate limited
  } else {
    sleep(5); // 5 detik normal delay
  }
}

/**
 * Setup function
 */
export function setup() {
  console.log('🚀 Memulai pengujian minimal SAV API Production...');
  console.log('📍 Target: https://statify-dev.student.stis.ac.id/api/sav/create');
  console.log('⚠️  Menggunakan delay panjang untuk menghindari rate limiting');
  return {};
}

/**
 * Teardown function
 */
export function teardown(data) {
  console.log('✅ Pengujian minimal SAV API Production selesai.');
  console.log('📊 Cek hasil di atas untuk melihat response yang berhasil.');
}