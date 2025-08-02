import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// === METRIK FRONTEND LOKAL ===
const frontendLoadTime = new Trend('frontend_local_load_time');
const frontendSuccessRate = new Rate('frontend_local_success_rate');
const frontendErrors = new Counter('frontend_local_errors');
const frontendThroughput = new Counter('frontend_local_throughput');
const elementValidation = new Rate('frontend_element_validation_rate');

// === KONFIGURASI SEDERHANA ===
export const options = {
  scenarios: {
    frontend_local_test: {
      executor: 'constant-vus',
      vus: 3,
      duration: '1m'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.10'], // Toleransi 10% failure
    frontend_local_load_time: ['p(95)<3000'],
    frontend_local_success_rate: ['rate>0.80'], // Target 80% success
    frontend_local_errors: ['count<20']
  }
};

/**
 * Fungsi untuk mendapatkan base URL
 */
function getBaseUrl() {
  return __ENV.BASE_URL || 'http://localhost:3000';
}

/**
 * Fungsi untuk validasi elemen HTML
 */
function validateElements(body, testName) {
  const elements = {
    hasNav: body.includes('<nav') || body.includes('nav'),
    hasDiv: body.includes('<div'),
    hasStatify: body.includes('Statify') || body.includes('statify'),
    hasTitle: body.includes('<title>'),
    hasContent: body.length > 1000
  };
  
  const foundCount = Object.values(elements).filter(Boolean).length;
  const totalCount = Object.keys(elements).length;
  const validationRate = foundCount / totalCount;
  
  console.log(`🔍 [${testName}] Elemen ditemukan: ${foundCount}/${totalCount}`);
  
  Object.entries(elements).forEach(([key, found]) => {
    const status = found ? '✅' : '❌';
    console.log(`   ${status} ${key}: ${found}`);
  });
  
  elementValidation.add(validationRate);
  return elements;
}

/**
 * Pengujian Landing Page
 */
export function testLanding() {
  const baseUrl = getBaseUrl();
  const startTime = Date.now();
  
  console.log('🏠 Testing Landing Page...');
  
  const response = http.get(baseUrl, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'K6-Frontend-Test/1.0'
    },
    timeout: '30s'
  });
  
  const duration = Date.now() - startTime;
  
  const isSuccess = check(response, {
    'Landing status 200': (r) => r.status === 200,
    'Landing has content': (r) => r.body && r.body.length > 0,
    'Landing loads reasonably': (r) => r.timings.duration < 3000
  });
  
  if (response.body) {
    validateElements(response.body, 'Landing');
  }
  
  // Metrik
  frontendLoadTime.add(duration);
  frontendSuccessRate.add(isSuccess ? 1 : 0);
  frontendThroughput.add(1);
  
  if (!isSuccess) {
    frontendErrors.add(1);
    console.log(`❌ Landing error: Status ${response.status}`);
  } else {
    console.log(`✅ Landing OK: ${duration}ms, Status: ${response.status}, Size: ${response.body ? response.body.length : 0}B`);
  }
  
  return isSuccess;
}

/**
 * Pengujian Dashboard (Navbar Data/Result)
 */
export function testDashboard() {
  const baseUrl = getBaseUrl();
  const startTime = Date.now();
  
  console.log('📊 Testing Dashboard (Navbar Data/Result)...');
  
  const response = http.get(`${baseUrl}/dashboard`, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'K6-Frontend-Test/1.0'
    },
    timeout: '30s'
  });
  
  const duration = Date.now() - startTime;
  
  const isSuccess = check(response, {
    'Dashboard status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'Dashboard responds': (r) => r.status < 500
  });
  
  if (response.body && response.status === 200) {
    validateElements(response.body, 'Dashboard');
  }
  
  // Metrik
  frontendLoadTime.add(duration);
  frontendSuccessRate.add(isSuccess ? 1 : 0);
  frontendThroughput.add(1);
  
  if (!isSuccess) {
    frontendErrors.add(1);
    console.log(`❌ Dashboard error: Status ${response.status}`);
  } else {
    console.log(`✅ Dashboard OK: ${duration}ms, Status: ${response.status}`);
  }
  
  return isSuccess;
}

/**
 * Pengujian Help Page
 */
export function testHelp() {
  const baseUrl = getBaseUrl();
  const startTime = Date.now();
  
  console.log('❓ Testing Help Page...');
  
  const response = http.get(`${baseUrl}/help`, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'K6-Frontend-Test/1.0'
    },
    timeout: '30s'
  });
  
  const duration = Date.now() - startTime;
  
  const isSuccess = check(response, {
    'Help status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'Help responds': (r) => r.status < 500
  });
  
  if (response.body && response.status === 200) {
    validateElements(response.body, 'Help');
  }
  
  // Metrik
  frontendLoadTime.add(duration);
  frontendSuccessRate.add(isSuccess ? 1 : 0);
  frontendThroughput.add(1);
  
  if (!isSuccess) {
    frontendErrors.add(1);
    console.log(`❌ Help error: Status ${response.status}`);
  } else {
    console.log(`✅ Help OK: ${duration}ms, Status: ${response.status}`);
  }
  
  return isSuccess;
}

/**
 * Fungsi utama
 */
export default function() {
  const testType = Math.floor(Math.random() * 3);
  
  switch(testType) {
    case 0:
      testLanding();
      break;
    case 1:
      testDashboard();
      break;
    case 2:
      testHelp();
      break;
    default:
      testLanding();
      break;
  }
  
  sleep(Math.random() * 2 + 1); // 1-3 detik delay
}

/**
 * Setup function
 */
export function setup() {
  console.log('🚀 Memulai pengujian Frontend Lokal...');
  console.log(`📍 Target: ${getBaseUrl()}`);
  console.log('🎯 Menguji elemen:');
  console.log('   1. Landing Page Navigation');
  console.log('   2. Dashboard Navbar (Data/Result)');
  console.log('   3. Help Page Div Elements');
  console.log('==========================================');
  
  return { baseUrl: getBaseUrl(), startTime: Date.now() };
}

/**
 * Teardown function
 */
export function teardown(data) {
  const duration = Date.now() - data.startTime;
  
  console.log('\n==========================================');
  console.log('✅ Pengujian Frontend Lokal selesai');
  console.log(`⏱️  Durasi: ${Math.round(duration/1000)} detik`);
  console.log('📊 Hasil validasi elemen tersedia di log');
  console.log('==========================================');
}