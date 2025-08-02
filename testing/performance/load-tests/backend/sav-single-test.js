import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// === METRIK SEDERHANA ===
export const savSingleSuccessRate = new Rate('sav_single_success_rate');
export const savSingleDuration = new Trend('sav_single_duration_ms');

// === KONFIGURASI MINIMAL - HANYA 1 REQUEST ===
export const options = {
  scenarios: {
    sav_single_test: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1  // Hanya 1 request
    }
  },
  thresholds: {
    // Tidak ada threshold - terima hasil apapun
  }
};

/**
 * Fungsi untuk melakukan 1 request ke SAV API production
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
  
  console.log('🚀 Mengirim request ke SAV API Production...');
  console.log(`📍 URL: ${baseUrl}/api/sav/create`);
  console.log(`📦 Payload: ${JSON.stringify(minimalPayload).length} bytes`);
  
  // === REQUEST ===
  const startTime = Date.now();
  
  const response = http.post(`${baseUrl}/api/sav/create`, JSON.stringify(minimalPayload), {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream',
      'User-Agent': 'K6-SingleTest/1.0'
    },
    timeout: '60s'
  });
  
  const duration = Date.now() - startTime;
  
  // === ANALISIS RESPONSE ===
  const isSuccess = response.status === 200;
  const isRateLimited = response.status === 429;
  const isServerError = response.status >= 500;
  const isClientError = response.status >= 400 && response.status < 500;
  
  // === METRIK ===
  savSingleSuccessRate.add(isSuccess ? 1 : 0);
  savSingleDuration.add(duration);
  
  // === LOGGING DETAIL ===
  console.log('\n=== HASIL PENGUJIAN SAV API PRODUCTION ===');
  console.log(`📊 Status Code: ${response.status}`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📏 Response Size: ${response.body ? response.body.length : 0} bytes`);
  console.log(`🔗 Headers: ${JSON.stringify(response.headers)}`);
  
  if (isSuccess) {
    console.log('🎉 SUCCESS! Request berhasil!');
    console.log(`📄 Response Body (first 200 chars): ${response.body ? response.body.substring(0, 200) : 'No body'}`);
  } else if (isRateLimited) {
    console.log('⏳ RATE LIMITED (429) - Server membatasi request');
    console.log(`📄 Response Body: ${response.body || 'No body'}`);
  } else if (isServerError) {
    console.log(`🔥 SERVER ERROR (${response.status}) - Ada masalah di server`);
    console.log(`📄 Response Body: ${response.body || 'No body'}`);
  } else if (isClientError) {
    console.log(`❌ CLIENT ERROR (${response.status}) - Ada masalah dengan request`);
    console.log(`📄 Response Body: ${response.body || 'No body'}`);
  } else {
    console.log(`❓ UNKNOWN STATUS (${response.status})`);
    console.log(`📄 Response Body: ${response.body || 'No body'}`);
  }
  
  console.log('\n=== RINGKASAN ===');
  console.log(`✅ Success Rate: ${isSuccess ? '100%' : '0%'}`);
  console.log(`🚫 Failed: ${!isSuccess ? 'Ya' : 'Tidak'}`);
  console.log(`⚡ Performance: ${duration < 1000 ? 'Cepat' : duration < 5000 ? 'Normal' : 'Lambat'}`);
  console.log('==========================================\n');
}

/**
 * Setup function
 */
export function setup() {
  console.log('🎯 PENGUJIAN TUNGGAL SAV API PRODUCTION');
  console.log('📍 Target: https://statify-dev.student.stis.ac.id/api/sav/create');
  console.log('🔢 Jumlah Request: 1 (satu)');
  console.log('⚠️  Tidak ada threshold - menerima hasil apapun');
  console.log('==========================================');
  return {};
}

/**
 * Teardown function
 */
export function teardown(data) {
  console.log('✅ Pengujian tunggal SAV API Production selesai.');
  console.log('📊 Hasil lengkap telah ditampilkan di atas.');
  console.log('==========================================');
}