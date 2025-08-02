import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// === METRIK UNTUK PRODUCTION TEST ===
export const savProductionSuccessRate = new Rate('sav_production_success_rate');
export const savProductionDuration = new Trend('sav_production_duration_ms');

// === KONFIGURASI SKENARIO RINGAN ===
export const options = {
  scenarios: {
    sav_production_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 1 },  // Hanya 1 VU untuk menghindari rate limiting
        { duration: '30s', target: 1 },  // Tetap di 1 VU
        { duration: '10s', target: 0 }   // Ramp down
      ]
    }
  },
  thresholds: {
    sav_production_success_rate: ['rate>0.50'], // Target 50% success rate (realistis untuk production)
    sav_production_duration_ms: ['p(95)<10000'], // Maksimal 10 detik
    http_req_failed: ['rate<0.60'], // Toleransi 60% failure karena rate limiting
    http_req_duration: ['p(95)<15000'] // Maksimal 15 detik
  }
};

/**
 * Fungsi utama untuk menguji endpoint SAV production
 * Mengirim request ke https://statify-dev.student.stis.ac.id/api/sav/create
 */
export default function () {
  // === KONFIGURASI BASE URL ===
  const baseUrl = 'https://statify-dev.student.stis.ac.id';
  
  // === PERSIAPAN DATA SAV SEDERHANA ===
  const dataTemplate = {
    type: 'simple_test',
    variables: [
      { name: 'id', label: 'ID', type: 'NUMERIC', width: 8, decimal: 0, measure: 'NOMINAL' },
      { name: 'name', label: 'Nama', type: 'STRING', width: 20, decimal: 0, measure: 'NOMINAL' },
      { name: 'score', label: 'Skor', type: 'NUMERIC', width: 3, decimal: 0, measure: 'SCALE' }
    ],
    sampleData: [
      { id: 1, name: 'Test1', score: 85 },
      { id: 2, name: 'Test2', score: 90 },
      { id: 3, name: 'Test3', score: 78 }
    ]
  };
  
  // === PERSIAPAN REQUEST ===
  const createPayload = {
    variables: dataTemplate.variables,
    data: dataTemplate.sampleData
  };
  
  // === EKSEKUSI REQUEST ===
  const startTime = Date.now();
  
  const response = http.post(`${baseUrl}/api/sav/create`, JSON.stringify(createPayload), {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'K6-LoadTest/1.0'
    },
    timeout: '30s'
  });
  
  const duration = Date.now() - startTime;
  
  // === VALIDASI RESPONSE ===
  const isSuccess = check(response, {
    'Production SAV - Status is 200': (r) => r.status === 200,
    'Production SAV - Response has content': (r) => r.body && r.body.length > 0,
    'Production SAV - Not rate limited': (r) => r.status !== 429
  });
  
  // === METRIK ===
  savProductionSuccessRate.add(isSuccess ? 1 : 0);
  savProductionDuration.add(duration);
  
  // === LOGGING DETAIL ===
  if (isSuccess) {
    console.log(`✅ [PRODUCTION] SAV Success - Status: ${response.status}, Duration: ${duration}ms, Size: ${response.body.length}B`);
  } else {
    console.log(`❌ [PRODUCTION] SAV Error - Status: ${response.status}, Duration: ${duration}ms, Body: ${response.body ? response.body.substring(0, 100) : 'No body'}`);
  }
  
  // === DELAY UNTUK MENGHINDARI RATE LIMITING ===
  sleep(2); // 2 detik delay antar request
}

/**
 * Setup function untuk mempersiapkan test
 */
export function setup() {
  console.log('🚀 Memulai pengujian SAV API Production...');
  console.log('📍 Target: https://statify-dev.student.stis.ac.id/api/sav/create');
  return {};
}

/**
 * Teardown function untuk cleanup setelah test
 */
export function teardown(data) {
  console.log('✅ Pengujian SAV API Production selesai.');
}