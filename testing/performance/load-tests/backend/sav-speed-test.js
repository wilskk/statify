import http from 'k6/http';
import { sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

/**
 * Speed Test - Pengujian Kecepatan Response Time Minimal
 * 
 * Test ini dirancang untuk:
 * 1. Mendapatkan waktu response tercepat dari server
 * 2. Mengetahui baseline performa dengan payload minimal
 * 3. Test dengan delay panjang untuk menghindari rate limit
 * 4. Fokus pada kualitas response, bukan kuantitas
 * 
 * Strategi:
 * - Payload sangat minimal (1 variabel, 1 data)
 * - Delay 10 detik antar request
 * - Hanya 6 request dalam 1 menit
 * - Fokus pada analisis waktu response
 */

// === METRIK SPEED TEST ===
const fastestResponse = new Trend('fastest_response_ms');
const slowestResponse = new Trend('slowest_response_ms');
const averageResponse = new Trend('average_response_ms');
const speedTestSuccess = new Rate('speed_test_success_rate');
const responseSize = new Trend('response_size_bytes');
const requestSize = new Trend('request_size_bytes');

// === KONFIGURASI SUPER RINGAN ===
export const options = {
  scenarios: {
    speed_test: {
      executor: 'constant-vus',
      vus: 1, // Hanya 1 virtual user
      duration: '1m', // 1 menit
    }
  },
  
  // Threshold yang sangat longgar untuk speed test
  thresholds: {
    fastest_response_ms: ['min>=0'], // Terima waktu response apapun
    speed_test_success_rate: ['rate>=0.5'], // Minimal 50% berhasil
  }
};

// === TRACKING VARIABLES ===
let requestNumber = 0;
let responseTimes = [];
let successfulResponses = 0;

/**
 * Fungsi utama untuk speed test
 */
export default function () {
  const baseUrl = 'https://statify-dev.student.stis.ac.id';
  
  // Payload super minimal untuk speed test
  const minimalPayload = {
    variables: [
      { name: 'x', label: 'X', type: 'NUMERIC', width: 1, decimal: 0, measure: 'SCALE' }
    ],
    data: [
      { x: 1 }
    ]
  };
  
  const payloadString = JSON.stringify(minimalPayload);
  const payloadSizeBytes = payloadString.length; // Hitung ukuran string dalam bytes
  
  requestNumber++;
  console.log(`\n🚀 Speed Test Request #${requestNumber}`);
  console.log(`📦 Payload size: ${payloadSizeBytes} bytes`);
  console.log(`⏰ Starting at: ${new Date().toISOString()}`);
  
  const startTime = Date.now();
  
  // Kirim request dengan timeout yang cukup
  const response = http.post(`${baseUrl}/api/sav/create`, payloadString, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream',
      'User-Agent': 'K6-SpeedTest/1.0'
    },
    timeout: '45s'
  });
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  const isSuccess = response.status === 200;
  const responseSizeBytes = response.body ? response.body.length : 0;
  
  // Update tracking
  responseTimes.push(duration);
  if (isSuccess) {
    successfulResponses++;
  }
  
  // Update metrik
  fastestResponse.add(duration);
  slowestResponse.add(duration);
  averageResponse.add(duration);
  speedTestSuccess.add(isSuccess ? 1 : 0);
  responseSize.add(responseSizeBytes);
  requestSize.add(payloadSizeBytes);
  
  // Analisis response
  console.log(`⏱️  Response time: ${duration}ms`);
  console.log(`📊 Status: ${response.status}`);
  console.log(`📏 Response size: ${responseSizeBytes} bytes`);
  
  if (isSuccess) {
    console.log(`✅ SUCCESS! File SAV berhasil dibuat`);
    console.log(`🎯 Performance: ${duration < 1000 ? 'SANGAT CEPAT' : duration < 3000 ? 'CEPAT' : duration < 5000 ? 'NORMAL' : 'LAMBAT'}`);
  } else if (response.status === 429) {
    console.log(`🚫 RATE LIMITED - Server membatasi request`);
  } else {
    console.log(`❌ ERROR - ${response.status}`);
    if (response.body) {
      console.log(`📄 Error details: ${response.body.substring(0, 100)}`);
    }
  }
  
  // Statistik real-time
  if (responseTimes.length > 1) {
    const fastest = Math.min(...responseTimes);
    const slowest = Math.max(...responseTimes);
    const average = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    console.log(`\n📈 Statistik sementara:`);
    console.log(`   Tercepat: ${fastest}ms`);
    console.log(`   Terlambat: ${slowest}ms`);
    console.log(`   Rata-rata: ${average.toFixed(1)}ms`);
    console.log(`   Success rate: ${((successfulResponses/requestNumber)*100).toFixed(1)}%`);
  }
  
  // Delay panjang untuk menghindari rate limit
  console.log(`⏳ Waiting 10 seconds before next request...`);
  sleep(10);
}

/**
 * Setup function
 */
export function setup() {
  console.log('🚀 Memulai Speed Test untuk SAV API...');
  console.log('📍 Target: https://statify-dev.student.stis.ac.id/api/sav/create');
  console.log('🎯 Tujuan:');
  console.log('   - Mendapatkan waktu response tercepat');
  console.log('   - Mengetahui baseline performa server');
  console.log('   - Mengukur konsistensi response time');
  console.log('⚡ Strategi:');
  console.log('   - Payload super minimal (1 variabel, 1 data)');
  console.log('   - Delay 10 detik antar request');
  console.log('   - Maksimal 6 request dalam 1 menit');
  console.log('⏱️  Durasi: 1 menit\n');
  
  return {};
}

/**
 * Teardown function
 */
export function teardown(data) {
  console.log('\n🏁 Speed Test selesai!');
  
  if (responseTimes.length > 0) {
    const fastest = Math.min(...responseTimes);
    const slowest = Math.max(...responseTimes);
    const average = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const median = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)];
    
    console.log('\n📊 HASIL SPEED TEST:');
    console.log(`📈 Total Requests: ${requestNumber}`);
    console.log(`✅ Successful: ${successfulResponses} (${((successfulResponses/requestNumber)*100).toFixed(1)}%)`);
    console.log('\n⏱️  Response Time Analysis:');
    console.log(`   🚀 Tercepat: ${fastest}ms`);
    console.log(`   🐌 Terlambat: ${slowest}ms`);
    console.log(`   📊 Rata-rata: ${average.toFixed(1)}ms`);
    console.log(`   📍 Median: ${median}ms`);
    console.log(`   📏 Range: ${slowest - fastest}ms`);
    
    console.log('\n💡 Analisis Performa:');
    if (average < 1000) {
      console.log('   🎉 EXCELLENT - Server sangat responsif (< 1 detik)');
    } else if (average < 3000) {
      console.log('   ✅ GOOD - Server responsif (1-3 detik)');
    } else if (average < 5000) {
      console.log('   ⚠️  ACCEPTABLE - Server cukup responsif (3-5 detik)');
    } else {
      console.log('   🐌 SLOW - Server lambat (> 5 detik)');
    }
    
    console.log('\n🎯 Rekomendasi untuk Load Testing:');
    if (average < 2000) {
      console.log('   - Server dapat menangani load testing dengan baik');
      console.log('   - Bisa menggunakan delay 1-2 detik antar request');
    } else if (average < 5000) {
      console.log('   - Server perlu delay lebih panjang untuk load testing');
      console.log('   - Gunakan delay 3-5 detik antar request');
    } else {
      console.log('   - Server sangat lambat, hindari load testing intensif');
      console.log('   - Gunakan delay minimal 10 detik antar request');
    }
  } else {
    console.log('❌ Tidak ada data response time yang berhasil dikumpulkan');
  }
}