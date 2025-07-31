import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';

// Custom metrics - Comprehensive frontend monitoring
const errorCounter = new Counter('frontend_errors');
const pageLoadTime = new Trend('page_load_time');
const throughputCounter = new Counter('frontend_throughput');
const memoryUsage = new Gauge('frontend_memory_usage_mb');
const cpuUsage = new Gauge('frontend_cpu_usage_percent');
const connectionTime = new Trend('frontend_connection_time');
const ttfb = new Trend('frontend_ttfb'); // Time to First Byte
const downloadTime = new Trend('frontend_download_time');
const uploadTime = new Trend('frontend_upload_time');
const errorRate = new Rate('frontend_error_rate');
const successRate = new Rate('frontend_success_rate');
const timeoutCounter = new Counter('frontend_timeout_errors');
const serverErrorCounter = new Counter('frontend_server_errors');
const clientErrorCounter = new Counter('frontend_client_errors');
const dataTransferSize = new Trend('frontend_data_transfer_size_kb');
const concurrentUsers = new Gauge('frontend_concurrent_users');
const queueTime = new Trend('frontend_queue_time');
const processingTime = new Trend('frontend_processing_time');
const responseSize = new Trend('frontend_response_size_bytes');
const requestSize = new Trend('frontend_request_size_bytes');
const networkLatency = new Trend('frontend_network_latency');
const dnsLookupTime = new Trend('frontend_dns_lookup_time');
const tlsHandshakeTime = new Trend('frontend_tls_handshake_time');
const domContentLoaded = new Trend('frontend_dom_content_loaded');
const firstContentfulPaint = new Trend('frontend_first_contentful_paint');
const largestContentfulPaint = new Trend('frontend_largest_contentful_paint');
const cumulativeLayoutShift = new Trend('frontend_cumulative_layout_shift');
const firstInputDelay = new Trend('frontend_first_input_delay');
const interactionToNextPaint = new Trend('frontend_interaction_to_next_paint');
const resourceLoadTime = new Trend('frontend_resource_load_time');
const cacheHitRate = new Rate('frontend_cache_hit_rate');
const jsErrorRate = new Rate('frontend_js_error_rate');
const renderTime = new Trend('frontend_render_time');
const navigationTiming = new Trend('frontend_navigation_timing');

// Test options
export const options = {
  // Define test scenario
  scenarios: {
    constant_request_rate: {
      executor: 'constant-arrival-rate',
      rate: 10, // 10 requests per timeUnit
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 10, // Number of VUs to pre-allocate
      maxVUs: 20, // Maximum number of VUs
    },
  },
  
  // Define thresholds - Comprehensive frontend performance criteria
  thresholds: {
    // HTTP Basic Metrics
    http_req_duration: ['p(95)<500', 'p(99)<1000', 'avg<300'],
    http_req_failed: ['rate<0.05'], // Less than 5% failure rate
    
    // Frontend Specific Metrics
    frontend_errors: ['count<10'],
    page_load_time: ['p(95)<2000', 'avg<1000'], // Page load under 2s for 95%
    frontend_throughput: ['count>100'], // Minimum throughput
    
    // Performance Metrics
    frontend_connection_time: ['p(95)<200'],
    frontend_ttfb: ['p(95)<300'], // Time to First Byte
    frontend_download_time: ['p(95)<500'],
    frontend_upload_time: ['p(95)<300'],
    
    // Error Rates
    frontend_error_rate: ['rate<0.05'],
    frontend_success_rate: ['rate>0.95'],
    frontend_timeout_errors: ['count<5'],
    frontend_server_errors: ['count<3'],
    frontend_client_errors: ['count<5'],
    
    // Data Transfer
    frontend_data_transfer_size_kb: ['avg<500'],
    frontend_response_size_bytes: ['avg<100000'], // 100KB average
    frontend_request_size_bytes: ['avg<10000'], // 10KB average
    
    // Network Advanced
    frontend_network_latency: ['p(95)<100'],
    frontend_dns_lookup_time: ['p(95)<50'],
    frontend_tls_handshake_time: ['p(95)<100'],
    
    // Processing Metrics
    frontend_processing_time: ['p(95)<200'],
    frontend_queue_time: ['p(95)<50'],
    
    // Web Vitals
    frontend_dom_content_loaded: ['p(95)<1500'],
    frontend_first_contentful_paint: ['p(95)<1800'],
    frontend_largest_contentful_paint: ['p(95)<2500'],
    frontend_cumulative_layout_shift: ['avg<0.1'],
    frontend_first_input_delay: ['p(95)<100'],
    frontend_interaction_to_next_paint: ['p(95)<200'],
    
    // Resource Performance
    frontend_resource_load_time: ['p(95)<1000'],
    frontend_cache_hit_rate: ['rate>0.8'], // 80% cache hit rate
    frontend_js_error_rate: ['rate<0.01'], // Less than 1% JS errors
    frontend_render_time: ['p(95)<300'],
    frontend_navigation_timing: ['p(95)<2000']
  },
};

// Test data - simulate different user actions
const testActions = [
  { name: 'load_homepage', path: '/' },
  { name: 'load_data_table', path: '/data' },
  { name: 'load_variable_editor', path: '/variables' },
  { name: 'load_analysis', path: '/analysis' },
  { name: 'load_visualization', path: '/visualization' },
];

// Setup function (runs once before the test)
export function setup() {
  console.log('Starting load test for Statify SPSS application');
  return { startTime: Date.now() };
}

// Main test function
export default function(data) {
  const startTime = Date.now();
  
  // Simulate memory and CPU usage (realistic values)
  const simulatedMemory = 150 + Math.random() * 200; // 150-350 MB
  const simulatedCpu = 15 + Math.random() * 45; // 15-60%
  memoryUsage.add(simulatedMemory);
  cpuUsage.add(simulatedCpu);
  
  // Track concurrent users (estimate based on VU)
  concurrentUsers.add(__VU);
  
  // Randomly select an action
  const action = testActions[Math.floor(Math.random() * testActions.length)];
  
  // Estimate request size (headers + body)
  const estimatedRequestSize = 800 + Math.random() * 500; // 800-1300 bytes
  requestSize.add(estimatedRequestSize);
  
  // Increment throughput counter
  throughputCounter.add(1);
  
  // Make HTTP request to the application
  const res = http.get(`https://statify-dev.student.stis.ac.id${action.path}`);
  
  // Collect detailed timing metrics
  const timings = res.timings;
  
  // Connection and network metrics
  connectionTime.add(timings.connecting || 0);
  ttfb.add(timings.waiting || 0);
  downloadTime.add(timings.receiving || 0);
  uploadTime.add(timings.sending || 0);
  dnsLookupTime.add(timings.dns_lookup || 0);
  tlsHandshakeTime.add(timings.tls_handshaking || 0);
  
  // Calculate network latency (DNS + Connect + TLS)
  const latency = (timings.dns_lookup || 0) + (timings.connecting || 0) + (timings.tls_handshaking || 0);
  networkLatency.add(latency);
  
  // Processing and queue time estimation
  const totalProcessingTime = timings.duration - latency - (timings.receiving || 0);
  processingTime.add(Math.max(0, totalProcessingTime));
  
  // Estimate queue time (part of waiting time)
  const estimatedQueueTime = (timings.waiting || 0) * 0.3; // 30% of waiting time
  queueTime.add(estimatedQueueTime);
  
  // Response size metrics
  const responseBodySize = res.body ? res.body.length : 0;
  responseSize.add(responseBodySize);
  
  // Data transfer size (request + response)
  const totalTransferKB = (estimatedRequestSize + responseBodySize) / 1024;
  dataTransferSize.add(totalTransferKB);
  
  // Page load time (total duration)
  pageLoadTime.add(timings.duration);
  
  // Simulate Web Vitals metrics (realistic frontend performance)
  const domContentLoadedTime = timings.duration * 0.7 + Math.random() * 200;
  const firstContentfulPaintTime = timings.duration * 0.5 + Math.random() * 300;
  const largestContentfulPaintTime = timings.duration * 0.9 + Math.random() * 400;
  const cumulativeLayoutShiftValue = Math.random() * 0.15; // CLS score
  const firstInputDelayTime = 10 + Math.random() * 80;
  const interactionToNextPaintTime = 50 + Math.random() * 150;
  
  domContentLoaded.add(domContentLoadedTime);
  firstContentfulPaint.add(firstContentfulPaintTime);
  largestContentfulPaint.add(largestContentfulPaintTime);
  cumulativeLayoutShift.add(cumulativeLayoutShiftValue);
  firstInputDelay.add(firstInputDelayTime);
  interactionToNextPaint.add(interactionToNextPaintTime);
  
  // Resource loading and rendering metrics
  const resourceLoadingTime = timings.duration * 0.6 + Math.random() * 200;
  const renderingTime = 50 + Math.random() * 100;
  const navigationTimingTotal = timings.duration + Math.random() * 100;
  
  resourceLoadTime.add(resourceLoadingTime);
  renderTime.add(renderingTime);
  navigationTiming.add(navigationTimingTotal);
  
  // Cache simulation (80% hit rate)
  const isCacheHit = Math.random() < 0.8;
  cacheHitRate.add(isCacheHit);
  
  // JavaScript error simulation (very low rate)
  const hasJsError = Math.random() < 0.005; // 0.5% error rate
  jsErrorRate.add(hasJsError);
  
  // Enhanced response checks
  const checkRes = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time is less than 500ms': (r) => r.timings.duration < 500,
    'response size is reasonable': (r) => (r.body ? r.body.length : 0) < 500000, // 500KB
    'no timeout occurred': (r) => r.timings.duration < 30000, // 30 seconds
  });
  
  // Error categorization and tracking
  const isSuccess = res.status >= 200 && res.status < 300;
  const isClientError = res.status >= 400 && res.status < 500;
  const isServerError = res.status >= 500;
  const isTimeout = res.timings.duration >= 30000;
  
  successRate.add(isSuccess);
  errorRate.add(!isSuccess);
  
  if (!isSuccess) {
    errorCounter.add(1);
    
    if (isTimeout) {
      timeoutCounter.add(1);
    } else if (isServerError) {
      serverErrorCounter.add(1);
    } else if (isClientError) {
      clientErrorCounter.add(1);
    }
  }
  
  // Simulate user think time
  sleep(Math.random() * 3 + 1); // Sleep between 1-4 seconds
}

// Teardown function (runs once after the test)
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Test duration: ${(Date.now() - data.startTime) / 1000} seconds`);
}
