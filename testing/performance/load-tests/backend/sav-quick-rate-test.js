import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

/**
 * Quick Rate Limit Test - Pengujian Cepat untuk Mengetahui Batas Rate Limit
 * 
 * Test ini dirancang untuk:
 * 1. Cepat mengetahui berapa request yang bisa dilakukan sebelum rate limit
 * 2. Mengukur waktu response yang ringan
 * 3. Mengetahui pola rate limiting server
 * 
 * Strategi:
 * - Mulai dengan 1 VU, kirim request secara berurutan
 * - Catat kapan mulai mendapat 429 (rate limited)
 * - Hitung berapa request berhasil sebelum rate limit
 * - Ukur waktu recovery setelah rate limit
 */

// === METRIK SEDERHANA ===
const totalRequests = new Counter('total_requests');
const successfulRequests = new Counter('successful_requests');
const rateLimitedRequests = new Counter('rate_limited_requests');
const errorRequests = new Counter('error_requests');
const responseTime = new Trend('response_time_ms');
const successRate = new Rate('success_rate');
const rateLimitRate = new Rate('rate_limit_rate');

// === KONFIGURASI RINGAN ===
export const options = {
  scenarios: {
    quick_rate_test: {
      executor: 'constant-vus',
      vus: 1, // Hanya 1 virtual user
      duration: '2m', // 2 menit testing
    }
  },
  
  // Threshold yang sangat longgar
  thresholds: {
    total_requests: ['count>=10'], // Minimal 10 request
    response_time_ms: ['p(95)<60000'], // Maksimal 60 detik
    // Tidak ada threshold untuk success rate - terima hasil apapun
  }
};

// === VARIABEL GLOBAL UNTUK TRACKING ===
let requestCount = 0;
let successCount = 0;
let rateLimitCount = 0;
let firstRateLimitAt = null;
let consecutiveSuccessAfterRateLimit = 0;

/**
 * Fungsi utama untuk quick rate limit test
 */
export default function () {
  const baseUrl = 'https://statify-dev.student.stis.ac.id';
  
  // Data minimal untuk request cepat
  const quickPayload = {
    variables: [
      { name: 'id', label: 'ID', type: 'NUMERIC', width: 3, decimal: 0, measure: 'NOMINAL' }
    ],
    data: [
      { id: 1 }
    ]
  };
  
  requestCount++;
  const startTime = Date.now();
  
  // Kirim request
  const response = http.post(`${baseUrl}/api/sav/create`, JSON.stringify(quickPayload), {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream',
      'User-Agent': 'K6-QuickRateTest/1.0'
    },
    timeout: '30s'
  });
  
  const duration = Date.now() - startTime;
  const isSuccess = response.status === 200;
  const isRateLimited = response.status === 429;
  const isError = !isSuccess && !isRateLimited;
  
  // Update metrik
  totalRequests.add(1);
  responseTime.add(duration);
  successRate.add(isSuccess ? 1 : 0);
  rateLimitRate.add(isRateLimited ? 1 : 0);
  
  if (isSuccess) {
    successfulRequests.add(1);
    successCount++;
    consecutiveSuccessAfterRateLimit++;
  } else if (isRateLimited) {
    rateLimitedRequests.add(1);
    rateLimitCount++;
    consecutiveSuccessAfterRateLimit = 0;
    
    // Catat kapan pertama kali rate limited
    if (firstRateLimitAt === null) {
      firstRateLimitAt = requestCount;
      console.log(`🚫 FIRST RATE LIMIT detected at request #${requestCount}!`);
      console.log(`📊 Successful requests before rate limit: ${successCount}`);
    }
  } else {
    errorRequests.add(1);
    consecutiveSuccessAfterRateLimit = 0;
  }
  
  // Logging setiap 10 request atau jika ada event penting
  if (requestCount % 10 === 0 || isRateLimited || (isSuccess && rateLimitCount > 0 && consecutiveSuccessAfterRateLimit === 1)) {
    const timestamp = new Date().toISOString().substring(11, 19); // HH:MM:SS
    
    if (isRateLimited) {
      console.log(`🚫 [${timestamp}] Request #${requestCount}: RATE LIMITED (${response.status}) - Duration: ${duration}ms`);
    } else if (isSuccess) {
      if (rateLimitCount > 0 && consecutiveSuccessAfterRateLimit === 1) {
        console.log(`🔄 [${timestamp}] Request #${requestCount}: RECOVERED from rate limit - Duration: ${duration}ms`);
      } else {
        console.log(`✅ [${timestamp}] Request #${requestCount}: SUCCESS - Duration: ${duration}ms`);
      }
    } else {
      console.log(`❌ [${timestamp}] Request #${requestCount}: ERROR ${response.status} - Duration: ${duration}ms`);
    }
    
    // Status summary setiap 10 request
    if (requestCount % 10 === 0) {
      const successPercentage = ((successCount / requestCount) * 100).toFixed(1);
      const rateLimitPercentage = ((rateLimitCount / requestCount) * 100).toFixed(1);
      console.log(`📈 Summary: ${requestCount} total, ${successCount} success (${successPercentage}%), ${rateLimitCount} rate limited (${rateLimitPercentage}%)`);
    }
  }
  
  // Strategi delay berdasarkan response
  if (isRateLimited) {
    // Jika rate limited, tunggu lebih lama
    console.log(`⏳ Rate limited, waiting 3 seconds...`);
    sleep(3);
  } else if (isSuccess) {
    // Jika sukses, delay minimal untuk test cepat
    sleep(0.5); // 500ms
  } else {
    // Jika error lain, delay sedang
    sleep(1);
  }
}

/**
 * Setup function
 */
export function setup() {
  console.log('🚀 Memulai Quick Rate Limit Test...');
  console.log('📍 Target: https://statify-dev.student.stis.ac.id/api/sav/create');
  console.log('🎯 Tujuan:');
  console.log('   - Mengetahui berapa request sebelum rate limit (429)');
  console.log('   - Mengukur waktu response yang cepat');
  console.log('   - Memahami pola rate limiting');
  console.log('⚡ Strategi: 1 VU dengan delay minimal untuk test cepat');
  console.log('⏱️  Durasi: 2 menit\n');
  
  return {};
}

/**
 * Teardown function
 */
export function teardown(data) {
  console.log('\n🏁 Quick Rate Limit Test selesai!');
  console.log('\n📊 HASIL AKHIR:');
  console.log(`📈 Total Requests: ${requestCount}`);
  console.log(`✅ Successful Requests: ${successCount} (${((successCount/requestCount)*100).toFixed(1)}%)`);
  console.log(`🚫 Rate Limited Requests: ${rateLimitCount} (${((rateLimitCount/requestCount)*100).toFixed(1)}%)`);
  
  if (firstRateLimitAt !== null) {
    console.log(`🎯 First Rate Limit at Request: #${firstRateLimitAt}`);
    console.log(`💡 Requests before rate limit: ${firstRateLimitAt - 1}`);
  } else {
    console.log(`🎉 No rate limit detected! Server dapat menangani ${requestCount} requests`);
  }
  
  console.log('\n💡 Rekomendasi:');
  if (firstRateLimitAt !== null && firstRateLimitAt <= 10) {
    console.log('   - Rate limit sangat ketat (≤10 requests)');
    console.log('   - Gunakan delay 5-10 detik antar request');
  } else if (firstRateLimitAt !== null && firstRateLimitAt <= 50) {
    console.log('   - Rate limit moderat (≤50 requests)');
    console.log('   - Gunakan delay 2-5 detik antar request');
  } else if (firstRateLimitAt !== null) {
    console.log('   - Rate limit longgar (>50 requests)');
    console.log('   - Gunakan delay 1-2 detik antar request');
  } else {
    console.log('   - Tidak ada rate limit terdeteksi');
    console.log('   - Bisa menggunakan delay minimal (0.5-1 detik)');
  }
}