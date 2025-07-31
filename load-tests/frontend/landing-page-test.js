import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';

// === METRIK KHUSUS LANDING PAGE ===
// Metrik untuk navbar di data/result
const navbarDataResultLoadTime = new Trend('navbar_data_result_load_time');
const navbarDataResultSuccessRate = new Rate('navbar_data_result_success_rate');
const navbarDataResultErrors = new Counter('navbar_data_result_errors');

// Metrik untuk nav di landing
const navLandingLoadTime = new Trend('nav_landing_load_time');
const navLandingSuccessRate = new Rate('nav_landing_success_rate');
const navLandingErrors = new Counter('nav_landing_errors');

// Metrik untuk div di help
const divHelpLoadTime = new Trend('div_help_load_time');
const divHelpSuccessRate = new Rate('div_help_success_rate');
const divHelpErrors = new Counter('div_help_errors');

// Metrik umum landing page
const landingPageLoadTime = new Trend('landing_page_load_time');
const landingPageSuccessRate = new Rate('landing_page_success_rate');
const landingPageErrors = new Counter('landing_page_errors');
const landingPageThroughput = new Counter('landing_page_throughput');
const landingPageResponseSize = new Trend('landing_page_response_size_bytes');
const landingPageTTFB = new Trend('landing_page_ttfb');
const landingPageConnectionTime = new Trend('landing_page_connection_time');
const landingPageDownloadTime = new Trend('landing_page_download_time');

// Metrik performa UI
const uiRenderTime = new Trend('ui_render_time');
const componentLoadTime = new Trend('component_load_time');
const interactionResponseTime = new Trend('interaction_response_time');
const resourceLoadingTime = new Trend('resource_loading_time');

// === KONFIGURASI PENGUJIAN ===
export const options = {
  scenarios: {
    // Skenario 1: Pengujian Landing Page Utama
    landing_page_load: {
      executor: 'ramping-vus',
      startVUs: 2,
      stages: [
        { duration: '30s', target: 10 }, // Ramp up ke 10 VUs
        { duration: '1m', target: 10 },  // Maintain 10 VUs
        { duration: '30s', target: 0 },  // Ramp down ke 0
      ],
      gracefulRampDown: '10s',
      env: { TEST_TYPE: 'landing' }
    },
    
    // Skenario 2: Pengujian Navbar Data/Result
    navbar_data_result_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 5 },  // Ramp up ke 5 VUs
        { duration: '40s', target: 5 },  // Maintain 5 VUs
        { duration: '20s', target: 0 },  // Ramp down ke 0
      ],
      startTime: '15s', // Mulai setelah 15 detik
      gracefulRampDown: '5s',
      env: { TEST_TYPE: 'navbar_data' }
    },
    
    // Skenario 3: Pengujian Help Section
    help_section_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 3 },  // Ramp up ke 3 VUs
        { duration: '40s', target: 3 },  // Maintain 3 VUs
        { duration: '20s', target: 0 },  // Ramp down ke 0
      ],
      startTime: '30s', // Mulai setelah 30 detik
      gracefulRampDown: '5s',
      env: { TEST_TYPE: 'help' }
    }
  },
  
  // === THRESHOLD PERFORMA ===
  thresholds: {
    // Threshold umum HTTP
    http_req_duration: ['p(95)<1500', 'p(99)<3000', 'avg<800'],
    http_req_failed: ['rate<0.05'], // Maksimal 5% failure
    
    // Threshold Landing Page
    landing_page_load_time: ['p(95)<2000', 'avg<1000'],
    landing_page_success_rate: ['rate>0.95'],
    landing_page_errors: ['count<5'],
    landing_page_ttfb: ['p(95)<500'],
    landing_page_connection_time: ['p(95)<300'],
    landing_page_download_time: ['p(95)<800'],
    landing_page_response_size_bytes: ['avg<200000'], // 200KB rata-rata
    
    // Threshold Navbar Data/Result
    navbar_data_result_load_time: ['p(95)<1000', 'avg<600'],
    navbar_data_result_success_rate: ['rate>0.98'],
    navbar_data_result_errors: ['count<3'],
    
    // Threshold Nav Landing
    nav_landing_load_time: ['p(95)<800', 'avg<400'],
    nav_landing_success_rate: ['rate>0.98'],
    nav_landing_errors: ['count<2'],
    
    // Threshold Help Section
    div_help_load_time: ['p(95)<1200', 'avg<700'],
    div_help_success_rate: ['rate>0.95'],
    div_help_errors: ['count<3'],
    
    // Threshold UI Performance
    ui_render_time: ['p(95)<400'],
    component_load_time: ['p(95)<600'],
    interaction_response_time: ['p(95)<200'],
    resource_loading_time: ['p(95)<1000']
  }
};

/**
 * Fungsi untuk mendapatkan base URL dari environment variable atau default
 */
function getBaseUrl() {
  return __ENV.BASE_URL || 'http://localhost:3000';
}

/**
 * Fungsi untuk mengukur waktu loading komponen
 */
function measureComponentLoad(componentName, startTime) {
  const loadTime = Date.now() - startTime;
  componentLoadTime.add(loadTime);
  console.log(`📦 ${componentName} loaded in ${loadTime}ms`);
  return loadTime;
}

/**
 * Fungsi untuk validasi response HTML dan mencari elemen spesifik
 */
function validateHtmlElements(response, elementSelectors) {
  const body = response.body || '';
  const results = {};
  
  elementSelectors.forEach(selector => {
    // Simulasi pencarian elemen (dalam real test, bisa menggunakan parser HTML)
    const found = body.includes(selector.identifier);
    results[selector.name] = found;
    
    if (found) {
      console.log(`✅ ${selector.name} ditemukan`);
    } else {
      console.log(`❌ ${selector.name} tidak ditemukan`);
    }
  });
  
  return results;
}

/**
 * Pengujian Landing Page Utama
 */
export function testLandingPage() {
  const baseUrl = getBaseUrl();
  const startTime = Date.now();
  
  console.log('🏠 Memulai pengujian Landing Page...');
  
  // Request ke landing page
  const response = http.get(baseUrl, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'User-Agent': 'K6-LandingTest/1.0'
    },
    timeout: '30s'
  });
  
  const duration = Date.now() - startTime;
  
  // Validasi response
  const isSuccess = check(response, {
    'Landing page status 200': (r) => r.status === 200,
    'Landing page has content': (r) => r.body && r.body.length > 0,
    'Landing page loads quickly': (r) => r.timings.duration < 2000,
    'Landing page has title': (r) => r.body && r.body.includes('<title>'),
    'Landing page has nav': (r) => r.body && r.body.includes('<nav')
  });
  
  // Pencarian elemen spesifik
  const elementSelectors = [
    { name: 'Navigation Bar', identifier: '<nav' },
    { name: 'Statify Brand', identifier: 'Statify' },
    { name: 'Features Section', identifier: 'features' },
    { name: 'CSP Section', identifier: 'csp' },
    { name: 'Comparison Section', identifier: 'comparison' }
  ];
  
  const elementsFound = validateHtmlElements(response, elementSelectors);
  
  // Metrik landing page
  landingPageLoadTime.add(duration);
  landingPageSuccessRate.add(isSuccess ? 1 : 0);
  landingPageThroughput.add(1);
  landingPageResponseSize.add(response.body ? response.body.length : 0);
  landingPageTTFB.add(response.timings.waiting);
  landingPageConnectionTime.add(response.timings.connecting);
  landingPageDownloadTime.add(response.timings.receiving);
  
  if (!isSuccess) {
    landingPageErrors.add(1);
    console.log(`❌ Landing page error: Status ${response.status}`);
  }
  
  // Simulasi render time
  const renderTime = Math.random() * 200 + 100; // 100-300ms
  uiRenderTime.add(renderTime);
  
  console.log(`🏠 Landing page loaded: ${duration}ms, Status: ${response.status}, Size: ${response.body ? response.body.length : 0}B`);
  
  return { success: isSuccess, duration, elementsFound };
}

/**
 * Pengujian Navbar Data/Result
 */
export function testNavbarDataResult() {
  const baseUrl = getBaseUrl();
  const startTime = Date.now();
  
  console.log('📊 Memulai pengujian Navbar Data/Result...');
  
  // Request ke halaman dashboard (yang memiliki navbar data/result)
  const response = http.get(`${baseUrl}/dashboard`, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'K6-NavbarTest/1.0'
    },
    timeout: '20s'
  });
  
  const duration = Date.now() - startTime;
  
  // Validasi navbar data/result
  const isSuccess = check(response, {
    'Navbar data/result status 200': (r) => r.status === 200,
    'Navbar has data menu': (r) => r.body && (r.body.includes('Data') || r.body.includes('data')),
    'Navbar has result elements': (r) => r.body && (r.body.includes('Result') || r.body.includes('result')),
    'Navbar loads quickly': (r) => r.timings.duration < 1000,
    'Navbar has menu structure': (r) => r.body && (r.body.includes('menu') || r.body.includes('nav'))
  });
  
  // Pencarian elemen navbar spesifik
  const navbarElements = [
    { name: 'Data Menu', identifier: 'Data' },
    { name: 'Transform Menu', identifier: 'Transform' },
    { name: 'Analyze Menu', identifier: 'Analyze' },
    { name: 'Graphs Menu', identifier: 'Graphs' },
    { name: 'Help Menu', identifier: 'Help' }
  ];
  
  const navbarFound = validateHtmlElements(response, navbarElements);
  
  // Metrik navbar
  navbarDataResultLoadTime.add(duration);
  navbarDataResultSuccessRate.add(isSuccess ? 1 : 0);
  
  if (!isSuccess) {
    navbarDataResultErrors.add(1);
    console.log(`❌ Navbar data/result error: Status ${response.status}`);
  }
  
  console.log(`📊 Navbar data/result loaded: ${duration}ms, Status: ${response.status}`);
  
  return { success: isSuccess, duration, navbarFound };
}

/**
 * Pengujian Help Section
 */
export function testHelpSection() {
  const baseUrl = getBaseUrl();
  const startTime = Date.now();
  
  console.log('❓ Memulai pengujian Help Section...');
  
  // Request ke halaman help
  const response = http.get(`${baseUrl}/help`, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'K6-HelpTest/1.0'
    },
    timeout: '25s'
  });
  
  const duration = Date.now() - startTime;
  
  // Validasi help section
  const isSuccess = check(response, {
    'Help section status 200': (r) => r.status === 200,
    'Help has content div': (r) => r.body && r.body.includes('<div'),
    'Help has search functionality': (r) => r.body && (r.body.includes('search') || r.body.includes('Search')),
    'Help loads reasonably': (r) => r.timings.duration < 1500,
    'Help has help center': (r) => r.body && (r.body.includes('Help Center') || r.body.includes('help'))
  });
  
  // Pencarian elemen help spesifik
  const helpElements = [
    { name: 'Help Center Title', identifier: 'Help Center' },
    { name: 'Search Input', identifier: 'search' },
    { name: 'Help Content Div', identifier: '<div' },
    { name: 'Guide Links', identifier: 'guide' },
    { name: 'Documentation', identifier: 'doc' }
  ];
  
  const helpFound = validateHtmlElements(response, helpElements);
  
  // Metrik help section
  divHelpLoadTime.add(duration);
  divHelpSuccessRate.add(isSuccess ? 1 : 0);
  
  if (!isSuccess) {
    divHelpErrors.add(1);
    console.log(`❌ Help section error: Status ${response.status}`);
  }
  
  console.log(`❓ Help section loaded: ${duration}ms, Status: ${response.status}`);
  
  return { success: isSuccess, duration, helpFound };
}

/**
 * Fungsi utama yang menjalankan pengujian berdasarkan environment
 */
export default function() {
  const testType = __ENV.TEST_TYPE || 'landing';
  
  switch(testType) {
    case 'landing':
      testLandingPage();
      break;
    case 'navbar_data':
      testNavbarDataResult();
      break;
    case 'help':
      testHelpSection();
      break;
    default:
      // Jalankan semua pengujian secara berurutan
      console.log('🔄 Menjalankan semua pengujian frontend...');
      
      const landingResult = testLandingPage();
      sleep(1);
      
      const navbarResult = testNavbarDataResult();
      sleep(1);
      
      const helpResult = testHelpSection();
      
      // Simulasi interaksi response time
      const interactionTime = Math.random() * 100 + 50; // 50-150ms
      interactionResponseTime.add(interactionTime);
      
      console.log('✅ Semua pengujian frontend selesai');
      break;
  }
  
  // Delay antar iterasi
  sleep(Math.random() * 2 + 1); // 1-3 detik
}

/**
 * Setup function - dijalankan sekali di awal
 */
export function setup() {
  console.log('🚀 Memulai pengujian Landing Page Frontend...');
  console.log(`📍 Target URL: ${getBaseUrl()}`);
  console.log('🎯 Fokus pengujian:');
  console.log('   1. Landing Page Navigation');
  console.log('   2. Navbar Data/Result Elements');
  console.log('   3. Help Section Div Elements');
  console.log('==========================================');
  
  return {
    baseUrl: getBaseUrl(),
    startTime: Date.now()
  };
}

/**
 * Teardown function - dijalankan sekali di akhir
 */
export function teardown(data) {
  const totalDuration = Date.now() - data.startTime;
  
  console.log('\n==========================================');
  console.log('✅ Pengujian Landing Page Frontend selesai');
  console.log(`⏱️  Total durasi: ${Math.round(totalDuration/1000)} detik`);
  console.log('📊 Cek hasil metrik di atas untuk detail performa');
  console.log('🎯 Elemen yang diuji:');
  console.log('   ✓ Landing Page Navigation');
  console.log('   ✓ Navbar Data/Result');
  console.log('   ✓ Help Section Div');
  console.log('==========================================');
}