import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

/**
 * Test Rate Limit untuk SAV API Backend
 * 
 * Test ini dirancang untuk mengetahui batas rate limit dengan pendekatan bertahap:
 * 1. Mulai dengan request ringan dan cepat
 * 2. Tingkatkan intensitas secara bertahap
 * 3. Catat kapan mulai terkena rate limit (429)
 * 4. Analisis pola rate limiting
 * 
 * Skenario:
 * - Phase 1: 1 request/detik selama 30 detik (baseline)
 * - Phase 2: 2 request/detik selama 30 detik
 * - Phase 3: 5 request/detik selama 30 detik
 * - Phase 4: 10 request/detik selama 30 detik
 * - Phase 5: 20 request/detik selama 30 detik (stress test)
 */

// === METRIK RATE LIMIT ===
const rateLimitHits = new Counter('rate_limit_hits_total');
const successfulRequests = new Counter('successful_requests_total');
const requestsPerSecond = new Rate('requests_per_second');
const responseTime = new Trend('response_time_ms');
const rateLimitRate = new Rate('rate_limit_rate');

// === METRIK PER PHASE ===
const phase1Success = new Rate('phase1_success_rate');
const phase2Success = new Rate('phase2_success_rate');
const phase3Success = new Rate('phase3_success_rate');
const phase4Success = new Rate('phase4_success_rate');
const phase5Success = new Rate('phase5_success_rate');

const phase1RateLimit = new Counter('phase1_rate_limit_count');
const phase2RateLimit = new Counter('phase2_rate_limit_count');
const phase3RateLimit = new Counter('phase3_rate_limit_count');
const phase4RateLimit = new Counter('phase4_rate_limit_count');
const phase5RateLimit = new Counter('phase5_rate_limit_count');

// === KONFIGURASI BERTAHAP ===
export const options = {
  scenarios: {
    // Phase 1: Baseline - 1 request/detik
    phase1_baseline: {
      executor: 'constant-arrival-rate',
      rate: 1, // 1 request per detik
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 2,
      maxVUs: 5,
      env: { PHASE: '1', PHASE_NAME: 'Baseline' },
      startTime: '0s'
    },
    
    // Phase 2: Light Load - 2 request/detik
    phase2_light: {
      executor: 'constant-arrival-rate',
      rate: 2,
      timeUnit: '1s', 
      duration: '30s',
      preAllocatedVUs: 3,
      maxVUs: 8,
      env: { PHASE: '2', PHASE_NAME: 'Light Load' },
      startTime: '35s'
    },
    
    // Phase 3: Medium Load - 5 request/detik
    phase3_medium: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '30s', 
      preAllocatedVUs: 5,
      maxVUs: 15,
      env: { PHASE: '3', PHASE_NAME: 'Medium Load' },
      startTime: '1m10s'
    },
    
    // Phase 4: High Load - 10 request/detik
    phase4_high: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 8,
      maxVUs: 25,
      env: { PHASE: '4', PHASE_NAME: 'High Load' },
      startTime: '1m45s'
    },
    
    // Phase 5: Stress Test - 20 request/detik
    phase5_stress: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 15,
      maxVUs: 40,
      env: { PHASE: '5', PHASE_NAME: 'Stress Test' },
      startTime: '2m20s'
    }
  },
  
  // Threshold yang longgar untuk mengamati rate limiting
  thresholds: {
    rate_limit_hits_total: ['count>=0'], // Terima rate limit hits
    successful_requests_total: ['count>=10'], // Minimal 10 request berhasil
    rate_limit_rate: ['rate<=0.8'], // Maksimal 80% terkena rate limit
    response_time_ms: ['p(95)<30000'], // Response time maksimal 30 detik
    
    // Threshold per phase
    phase1_success_rate: ['rate>=0.8'], // Phase 1 harus 80% berhasil
    phase2_success_rate: ['rate>=0.7'], // Phase 2 harus 70% berhasil
    phase3_success_rate: ['rate>=0.5'], // Phase 3 harus 50% berhasil
    phase4_success_rate: ['rate>=0.3'], // Phase 4 harus 30% berhasil
    phase5_success_rate: ['rate>=0.1'], // Phase 5 harus 10% berhasil
  }
};

/**
 * Fungsi utama untuk testing rate limit
 */
export default function () {
  const phase = __ENV.PHASE || '1';
  const phaseName = __ENV.PHASE_NAME || 'Unknown';
  const baseUrl = 'https://statify-dev.student.stis.ac.id';
  
  // Data minimal untuk request
  const payload = {
    variables: [
      { name: 'id', label: 'ID', type: 'NUMERIC', width: 5, decimal: 0, measure: 'NOMINAL' },
      { name: 'test', label: 'Test', type: 'NUMERIC', width: 3, decimal: 0, measure: 'SCALE' }
    ],
    data: [
      { id: 1, test: 100 }
    ]
  };
  
  const startTime = Date.now();
  
  // Kirim request
  const response = http.post(`${baseUrl}/api/sav/create`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream',
      'User-Agent': `K6-RateLimit-Test-Phase${phase}/1.0`
    },
    timeout: '30s'
  });
  
  const duration = Date.now() - startTime;
  const isSuccess = response.status === 200;
  const isRateLimited = response.status === 429;
  
  // Catat metrik umum
  responseTime.add(duration);
  requestsPerSecond.add(1);
  rateLimitRate.add(isRateLimited ? 1 : 0);
  
  if (isSuccess) {
    successfulRequests.add(1);
  }
  
  if (isRateLimited) {
    rateLimitHits.add(1);
  }
  
  // Catat metrik per phase
  switch(phase) {
    case '1':
      phase1Success.add(isSuccess ? 1 : 0);
      if (isRateLimited) phase1RateLimit.add(1);
      break;
    case '2':
      phase2Success.add(isSuccess ? 1 : 0);
      if (isRateLimited) phase2RateLimit.add(1);
      break;
    case '3':
      phase3Success.add(isSuccess ? 1 : 0);
      if (isRateLimited) phase3RateLimit.add(1);
      break;
    case '4':
      phase4Success.add(isSuccess ? 1 : 0);
      if (isRateLimited) phase4RateLimit.add(1);
      break;
    case '5':
      phase5Success.add(isSuccess ? 1 : 0);
      if (isRateLimited) phase5RateLimit.add(1);
      break;
  }
  
  // Logging detail
  const timestamp = new Date().toISOString();
  if (isRateLimited) {
    console.log(`🚫 [${timestamp}] Phase ${phase} (${phaseName}): RATE LIMITED - Status: ${response.status}, Duration: ${duration}ms`);
  } else if (isSuccess) {
    console.log(`✅ [${timestamp}] Phase ${phase} (${phaseName}): SUCCESS - Duration: ${duration}ms`);
  } else {
    console.log(`❌ [${timestamp}] Phase ${phase} (${phaseName}): ERROR ${response.status} - Duration: ${duration}ms`);
  }
  
  // Delay minimal untuk menghindari overload
  if (isRateLimited) {
    sleep(0.5); // 500ms delay jika rate limited
  } else {
    sleep(0.1); // 100ms delay normal
  }
}

/**
 * Setup function - persiapan testing
 */
export function setup() {
  console.log('🚀 Memulai Rate Limit Test untuk SAV API...');
  console.log('📍 Target: https://statify-dev.student.stis.ac.id/api/sav/create');
  console.log('📊 Test akan berjalan dalam 5 phase:');
  console.log('   Phase 1: 1 req/s selama 30s (Baseline)');
  console.log('   Phase 2: 2 req/s selama 30s (Light Load)');
  console.log('   Phase 3: 5 req/s selama 30s (Medium Load)');
  console.log('   Phase 4: 10 req/s selama 30s (High Load)');
  console.log('   Phase 5: 20 req/s selama 30s (Stress Test)');
  console.log('⚠️  Tujuan: Mengetahui kapan mulai terkena rate limit (429)');
  console.log('⏱️  Total durasi: ~3 menit\n');
  
  return {};
}

/**
 * Teardown function - analisis hasil
 */
export function teardown(data) {
  console.log('\n🏁 Rate Limit Test selesai!');
  console.log('📈 Analisis hasil:');
  console.log('   - Lihat metrik rate_limit_hits_total untuk total rate limit');
  console.log('   - Lihat metrik phase*_success_rate untuk success rate per phase');
  console.log('   - Lihat metrik phase*_rate_limit_count untuk rate limit per phase');
  console.log('💡 Gunakan hasil ini untuk menentukan batas optimal request rate');
}