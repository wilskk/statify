import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';

/**
 * Metrik SAV API Performance - Backend Load Testing
 * Mengukur performa operasi upload dan create file SAV
 * 
 * File SAV dikategorikan berdasarkan ukuran:
 * - File Kecil (< 5KB): accidents.sav, advert.sav, salesperformance.sav, dll
 * - File Sedang (5KB - 100KB): ozone.sav, satisf.sav, workprog.sav, dll  
 * - File Besar (> 100KB): telco.sav, demo.sav, customer_dbase.sav, dll
 * 
 * Distribusi testing: 40% file kecil, 40% file sedang, 20% file besar
 */

// === METRIK UTAMA SAV OPERATIONS ===
// Waktu operasi SAV (dalam milliseconds)
const savFileUploadTime = new Trend('sav_file_upload_duration_ms');
const savFileCreateTime = new Trend('sav_file_create_duration_ms');
const savReadTime = new Trend('sav_read_time_ms');
const savWriteTime = new Trend('sav_write_time_ms');
const savOperationErrors = new Counter('sav_operation_errors_total');

// === METRIK PERFORMA API ===
// Throughput dan beban sistem
const apiRequestsPerSecond = new Counter('api_requests_per_second');
const serverMemoryUsage = new Gauge('server_memory_usage_mb');
const serverCpuUsage = new Gauge('server_cpu_usage_percent');
const activeConnections = new Gauge('active_connections_count');

// === METRIK JARINGAN ===
// Waktu koneksi dan transfer (dalam milliseconds)
const tcpConnectionTime = new Trend('tcp_connection_time_ms');
const timeToFirstByte = new Trend('time_to_first_byte_ms');
const dataDownloadTime = new Trend('data_download_time_ms');
const dataUploadTime = new Trend('data_upload_time_ms');
const dnsResolutionTime = new Trend('dns_resolution_time_ms');
const tlsHandshakeTime = new Trend('tls_handshake_time_ms');
const totalNetworkLatency = new Trend('total_network_latency_ms');

// === METRIK KEBERHASILAN ===
// Rate keberhasilan dan kegagalan
const apiErrorRate = new Rate('api_error_rate_percent');
const apiSuccessRate = new Rate('api_success_rate_percent');
const timeoutErrors = new Counter('timeout_errors_total');
const serverErrors = new Counter('server_errors_5xx_total');
const clientErrors = new Counter('client_errors_4xx_total');

// === METRIK DATA TRANSFER ===
// Ukuran data yang ditransfer (dalam bytes dan KB)
const requestPayloadSize = new Trend('request_payload_size_bytes');
const responsePayloadSize = new Trend('response_payload_size_bytes');
const totalDataTransfer = new Trend('total_data_transfer_kb');

// === METRIK PEMROSESAN ===
// Waktu pemrosesan server (dalam milliseconds)
const serverProcessingTime = new Trend('server_processing_time_ms');
const requestQueueTime = new Trend('request_queue_time_ms');

// Test options
export const options = {
  scenarios: {
    // Simulate SAV read operations
    sav_read_operations: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '30s', target: 15 }, // Ramp up to 15 VUs
        { duration: '1m', target: 15 },  // Stay at 15 VUs
        { duration: '30s', target: 0 },  // Ramp down to 0 VUs
      ],
      gracefulRampDown: '10s',
    },
    
    // Simulate SAV write operations
    sav_write_operations: {
      executor: 'ramping-vus',
      startVUs: 3,
      stages: [
        { duration: '30s', target: 10 }, // Ramp up to 10 VUs
        { duration: '1m', target: 10 },  // Stay at 10 VUs
        { duration: '30s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '15s', // Start after 15s
      gracefulRampDown: '10s',
    },
  },
  
  // Define thresholds untuk semua metrik
  thresholds: {
    // === THRESHOLD HTTP DASAR ===
    http_req_duration: ['p(95)<2000', 'p(99)<3000', 'avg<1000'], // Response time harus < 2s (95%), < 3s (99%), rata-rata < 1s
    http_req_failed: ['rate<0.05'], // Maksimal 5% request gagal
    
    // === THRESHOLD SAV OPERATIONS ===
    sav_file_upload_duration_ms: ['p(95)<3000', 'p(99)<5000', 'avg<2000'], // Upload SAV: 95% < 3s, 99% < 5s, rata-rata < 2s
    sav_file_create_duration_ms: ['p(95)<5000', 'p(99)<8000', 'avg<3000'], // Create SAV: 95% < 5s, 99% < 8s, rata-rata < 3s
    sav_read_time_ms: ['p(95)<3000', 'p(99)<5000', 'avg<2000'], // Read SAV: 95% < 3s, 99% < 5s, rata-rata < 2s
    sav_write_time_ms: ['p(95)<5000', 'p(99)<8000', 'avg<3000'], // Write SAV: 95% < 5s, 99% < 8s, rata-rata < 3s
    sav_operation_errors_total: ['count<10'], // Maksimal 10 error SAV operation selama test
    
    // === THRESHOLD PERFORMA API ===
    api_requests_per_second: ['rate>5'], // Minimal 5 requests per detik
    server_memory_usage_mb: ['value<1000'], // Memory usage < 1GB
    server_cpu_usage_percent: ['value<80'], // CPU usage < 80%
    active_connections_count: ['value<100'], // Maksimal 100 koneksi aktif
    
    // === THRESHOLD JARINGAN ===
    tcp_connection_time_ms: ['p(95)<500', 'avg<200'], // Koneksi TCP: 95% < 500ms, rata-rata < 200ms
    time_to_first_byte_ms: ['p(95)<1000', 'avg<500'], // TTFB: 95% < 1s, rata-rata < 500ms
    data_download_time_ms: ['p(95)<1500', 'avg<800'], // Download: 95% < 1.5s, rata-rata < 800ms
    data_upload_time_ms: ['p(95)<2000', 'avg<1000'], // Upload: 95% < 2s, rata-rata < 1s
    dns_resolution_time_ms: ['p(95)<100', 'avg<50'], // DNS: 95% < 100ms, rata-rata < 50ms
    tls_handshake_time_ms: ['p(95)<200', 'avg<100'], // TLS: 95% < 200ms, rata-rata < 100ms
    total_network_latency_ms: ['p(95)<300', 'avg<150'], // Total latency: 95% < 300ms, rata-rata < 150ms
    
    // === THRESHOLD KEBERHASILAN ===
    api_error_rate_percent: ['rate<0.05'], // Error rate < 5%
    api_success_rate_percent: ['rate>0.95'], // Success rate > 95%
    timeout_errors_total: ['count<5'], // Maksimal 5 timeout error
    server_errors_5xx_total: ['count<3'], // Maksimal 3 server error (5xx)
    client_errors_4xx_total: ['count<5'], // Maksimal 5 client error (4xx)
    
    // === THRESHOLD DATA TRANSFER ===
    request_payload_size_bytes: ['avg<10000'], // Request size rata-rata < 10KB
    response_payload_size_bytes: ['avg<50000'], // Response size rata-rata < 50KB
    total_data_transfer_kb: ['avg<1000'], // Total transfer rata-rata < 1MB
    
    // === THRESHOLD PEMROSESAN ===
    server_processing_time_ms: ['p(95)<2500', 'avg<1500'], // Processing: 95% < 2.5s, rata-rata < 1.5s
    request_queue_time_ms: ['p(95)<100', 'avg<50'], // Queue time: 95% < 100ms, rata-rata < 50ms
  },
};

// Setup function
export function setup() {
  console.log('Starting SAV API load test for Statify');
  
  // Base URL untuk API backend (sesuaikan dengan environment)
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3001';
  
  // Common headers for requests
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'k6-load-tester',
    'Accept': 'application/json'
  };
  
  console.log(`Target API: ${baseUrl}`);
  
  return { 
    baseUrl: baseUrl,
    headers: headers, 
    startTime: Date.now() 
  };
}

// Test SAV read operation (upload endpoint)
/**
 * Test SAV File Upload Operation
 * Menguji endpoint POST /api/sav/upload untuk upload file SAV
 *.export function testSavRead(data) {
  // Daftar file contoh SAV yang tersedia di frontend berdasarkan ukuran
  // File kecil (< 5KB) - untuk testing performa optimal
  const smallFiles = [
    { name: 'accidents.sav', size: 0.96 },
    { name: 'advert.sav', size: 0.98 },
    { name: 'salesperformance.sav', size: 1.1 },
    { name: 'contacts.sav', size: 1.85 },
    { name: 'dietstudy.sav', size: 2.21 },
    { name: 'adl.sav', size: 3.71 },
    { name: 'behavior.sav', size: 3.73 }
  ];
  
  // File sedang (5KB - 100KB) - untuk testing performa normal
  const mediumFiles = [
    { name: 'ozone.sav', size: 10.44 },
    { name: 'satisf.sav', size: 13.83 },
    { name: 'workprog.sav', size: 17.02 },
    { name: 'Employee data.sav', size: 25.04 },
    { name: 'german_credit.sav', size: 30.58 },
    { name: 'tcm_kpi.sav', size: 33.2 },
    { name: 'car_sales.sav', size: 34.63 },
    { name: 'worldsales.sav', size: 41.49 },
    { name: 'bankloan.sav', size: 51.78 },
    { name: 'test_scores.sav', size: 74.97 }
  ];
  
  // File besar (> 100KB) - untuk testing performa dengan beban tinggi
  const largeFiles = [
    { name: 'telco.sav', size: 118.1 },
    { name: 'telco_extra.sav', size: 171.43 },
    { name: 'dmdata3.sav', size: 197.96 },
    { name: 'demo.sav', size: 284.08 },
    { name: 'patient_los.sav', size: 456.34 },
    { name: 'insurance_claims.sav', size: 503.38 },
    { name: 'poll_cs_sample.sav', size: 552.6 },
    { name: 'customer_dbase.sav', size: 1555.48 }
  ];
  
  // Pilih kategori file berdasarkan probabilitas (40% kecil, 40% sedang, 20% besar)
  let selectedFile;
  const random = Math.random();
  
  if (random < 0.4) {
    // 40% chance untuk file kecil
    selectedFile = smallFiles[Math.floor(Math.random() * smallFiles.length)];
  } else if (random < 0.8) {
    // 40% chance untuk file sedang
    selectedFile = mediumFiles[Math.floor(Math.random() * mediumFiles.length)];
  } else {
    // 20% chance untuk file besar
    selectedFile = largeFiles[Math.floor(Math.random() * largeFiles.length)];
  }
  
  // === SIMULASI RESOURCE MONITORING ===
  // Simulasi penggunaan memory server (100-600 MB)
  const simulatedMemory = Math.random() * 500 + 100;
  serverMemoryUsage.add(simulatedMemory);
  
  // Simulasi penggunaan CPU server (10-90%)
  const simulatedCpu = Math.random() * 80 + 10;
  serverCpuUsage.add(simulatedCpu);
  
  // Track jumlah koneksi aktif (berdasarkan VU)
  activeConnections.add(__VU);
  
  // === PERSIAPAN REQUEST ===
  // Simulasi form data untuk upload file SAV dengan ukuran yang sesuai
  const formdata = {
    'filename': selectedFile.name,
    'filesize': Math.floor(selectedFile.size * 1024), // Konversi KB ke bytes
    'category': selectedFile.size < 5 ? 'small' : selectedFile.size < 100 ? 'medium' : 'large'
  };
  
  // Hitung ukuran request payload
  const requestSizeBytes = JSON.stringify(formdata).length;
  requestPayloadSize.add(requestSizeBytes);
  
  // Increment counter throughput API
  apiRequestsPerSecond.add(1);
  
  // === EKSEKUSI REQUEST ===
  const startTime = Date.now();
  const res = http.post(
    `${data.baseUrl}/api/sav/upload`, // Menggunakan endpoint yang benar
    formdata,
    { 
      headers: data.headers,
      timeout: '30s' // Timeout 30 detik untuk upload
    }
  );
  const endTime = Date.now();
  
  // === PENGUMPULAN METRIK TIMING ===
  // Catat waktu total operasi upload SAV
  const uploadDuration = endTime - startTime;
  savFileUploadTime.add(uploadDuration);
  
  // Collect detailed network timing metrics
  if (res.timings) {
    tcpConnectionTime.add(res.timings.connecting || 0);
    timeToFirstByte.add(res.timings.waiting || 0);
    dataDownloadTime.add(res.timings.receiving || 0);
    dataUploadTime.add(res.timings.sending || 0);
    dnsResolutionTime.add(res.timings.dns_lookup || 0);
    tlsHandshakeTime.add(res.timings.tls_handshaking || 0);
    
    // Hitung estimasi waktu pemrosesan server dan network latency
    const totalTime = res.timings.duration;
    const estimatedProcessingTime = totalTime * 0.6; // Estimasi 60% untuk processing
    const estimatedNetworkLatency = totalTime - estimatedProcessingTime;
    
    totalNetworkLatency.add(estimatedNetworkLatency);
    serverProcessingTime.add(estimatedProcessingTime);
    
    // Estimasi queue time berdasarkan connection time
    const estimatedQueueTime = res.timings.connecting * 0.3;
    requestQueueTime.add(estimatedQueueTime);
  }
  
  // === PENGUMPULAN METRIK RESPONSE ===
  // Ukuran response payload
  const responseSizeBytes = res.body ? res.body.length : 0;
  responsePayloadSize.add(responseSizeBytes);
  
  // Total data transfer dalam KB
  const totalTransferKb = (requestSizeBytes + responseSizeBytes) / 1024;
  totalDataTransfer.add(totalTransferKb);
  
  // === VALIDASI RESPONSE ===
  const checkRes = check(res, {
    'SAV upload berhasil (status 200/201)': (r) => r.status === 200 || r.status === 201,
    'SAV upload selesai dalam 3 detik': (r) => r.timings.duration < 3000,
    'Response size wajar (< 100KB)': (r) => responseSizeBytes < 100000,
    'Tidak ada timeout': (r) => r.status !== 0,
    'Response memiliki content': (r) => r.body && r.body.length > 0,
  });
  
  // === KATEGORISASI ERROR DAN SUCCESS RATE ===
  const isSuccess = res.status >= 200 && res.status < 300;
  const isClientError = res.status >= 400 && res.status < 500;
  const isServerError = res.status >= 500;
  const isTimeout = res.status === 0;
  
  // Update success dan error rates
  apiSuccessRate.add(isSuccess);
  apiErrorRate.add(!isSuccess);
  
  // Kategorisasi error berdasarkan jenis
  if (isTimeout) {
    timeoutErrors.add(1);
  }
  if (isServerError) {
    serverErrors.add(1);
  }
  if (isClientError) {
    clientErrors.add(1);
  }
  
  // Hitung total SAV operation errors
  if (!checkRes || !isSuccess) {
    savOperationErrors.add(1);
  }
  
  // === LOGGING UNTUK DEBUGGING ===
  if (!isSuccess) {
    console.log(`SAV Read Error - File: ${selectedFile.name} (${selectedFile.size}KB), Status: ${res.status}, Duration: ${res.timings.duration}ms, Response Size: ${responseSizeBytes}B`);
  } else {
    console.log(`SAV Read Success - File: ${selectedFile.name} (${formdata.category}), Duration: ${res.timings.duration}ms`);
  }
  
  // Record read operation time
  savReadTime.add(res.timings.duration);
  
  return res;
}

/**
 * Test SAV File Create Operation
 * Menguji endpoint POST /api/sav/create untuk membuat file SAV baru
 */
export function testSavWrite(data) {
  // === SIMULASI RESOURCE MONITORING ===
  // Write operations menggunakan lebih banyak memory (150-750 MB)
  const simulatedMemory = Math.random() * 600 + 150;
  serverMemoryUsage.add(simulatedMemory);
  
  // Write operations menggunakan lebih banyak CPU (15-95%)
  const simulatedCpu = Math.random() * 80 + 15;
  serverCpuUsage.add(simulatedCpu);
  
  // Track jumlah koneksi aktif
  activeConnections.add(__VU);
  
  // === PERSIAPAN DATA SAV ===
  // Template data berdasarkan jenis dataset yang umum digunakan
  const dataTemplates = [
    {
      type: 'customer_survey',
      variables: [
        { name: 'customer_id', label: 'ID Pelanggan', type: 'NUMERIC', width: 8, decimal: 0, measure: 'NOMINAL' },
        { name: 'age', label: 'Usia', type: 'NUMERIC', width: 3, decimal: 0, measure: 'SCALE' },
        { name: 'gender', label: 'Jenis Kelamin', type: 'STRING', width: 10, decimal: 0, measure: 'NOMINAL' },
        { name: 'satisfaction', label: 'Tingkat Kepuasan', type: 'NUMERIC', width: 2, decimal: 0, measure: 'ORDINAL' },
        { name: 'income', label: 'Pendapatan', type: 'NUMERIC', width: 12, decimal: 2, measure: 'SCALE' }
      ],
      sampleData: [
        { customer_id: 1, age: 25, gender: 'Male', satisfaction: 4, income: 5000000.50 },
        { customer_id: 2, age: 30, gender: 'Female', satisfaction: 5, income: 6500000.75 },
        { customer_id: 3, age: 35, gender: 'Male', satisfaction: 3, income: 7200000.00 }
      ]
    },
    {
      type: 'employee_data',
      variables: [
        { name: 'emp_id', label: 'Employee ID', type: 'NUMERIC', width: 6, decimal: 0, measure: 'NOMINAL' },
        { name: 'department', label: 'Department', type: 'STRING', width: 15, decimal: 0, measure: 'NOMINAL' },
        { name: 'salary', label: 'Salary', type: 'NUMERIC', width: 10, decimal: 2, measure: 'SCALE' },
        { name: 'performance', label: 'Performance Rating', type: 'NUMERIC', width: 3, decimal: 1, measure: 'SCALE' },
        { name: 'years_service', label: 'Years of Service', type: 'NUMERIC', width: 2, decimal: 0, measure: 'SCALE' }
      ],
      sampleData: [
        { emp_id: 101, department: 'IT', salary: 8500000.00, performance: 4.2, years_service: 3 },
        { emp_id: 102, department: 'HR', salary: 7200000.00, performance: 3.8, years_service: 5 },
        { emp_id: 103, department: 'Finance', salary: 9100000.00, performance: 4.5, years_service: 7 }
      ]
    },
    {
      type: 'sales_data',
      variables: [
        { name: 'transaction_id', label: 'Transaction ID', type: 'NUMERIC', width: 8, decimal: 0, measure: 'NOMINAL' },
        { name: 'product_category', label: 'Product Category', type: 'STRING', width: 20, decimal: 0, measure: 'NOMINAL' },
        { name: 'sales_amount', label: 'Sales Amount', type: 'NUMERIC', width: 12, decimal: 2, measure: 'SCALE' },
        { name: 'region', label: 'Sales Region', type: 'STRING', width: 15, decimal: 0, measure: 'NOMINAL' },
        { name: 'quarter', label: 'Quarter', type: 'NUMERIC', width: 1, decimal: 0, measure: 'ORDINAL' }
      ],
      sampleData: [
        { transaction_id: 1001, product_category: 'Electronics', sales_amount: 2500000.00, region: 'Jakarta', quarter: 1 },
        { transaction_id: 1002, product_category: 'Clothing', sales_amount: 1200000.00, region: 'Surabaya', quarter: 1 },
        { transaction_id: 1003, product_category: 'Books', sales_amount: 350000.00, region: 'Bandung', quarter: 2 }
      ]
    }
  ];
  
  // Pilih template secara acak
  const selectedTemplate = dataTemplates[Math.floor(Math.random() * dataTemplates.length)];
  
  // Buat payload dengan template yang dipilih
  const payload = {
    filename: `${selectedTemplate.type}_${__VU}_${Date.now()}.sav`,
    variables: selectedTemplate.variables,
    data: selectedTemplate.sampleData,
    metadata: {
      created_by: 'k6_load_test',
      template_type: selectedTemplate.type,
      test_vu: __VU,
      timestamp: new Date().toISOString()
    }
  };
  
  // === PERSIAPAN REQUEST ===
  // Hitung ukuran request payload
  const requestSizeBytes = JSON.stringify(payload).length;
  requestPayloadSize.add(requestSizeBytes);
  
  // Increment counter throughput API
  apiRequestsPerSecond.add(1);
  
  // === EKSEKUSI REQUEST ===
  const startTime = Date.now();
  const res = http.post(
    `${data.baseUrl}/api/sav/create`, // Menggunakan endpoint yang benar
    JSON.stringify(payload),
    { 
      headers: {
        ...data.headers,
        'Content-Type': 'application/json'
      },
      timeout: '60s' // Timeout 60 detik untuk create operation
    }
  );
  const endTime = Date.now();
  
  // === PENGUMPULAN METRIK TIMING ===
  // Catat waktu total operasi create SAV
  const createDuration = endTime - startTime;
  savFileCreateTime.add(createDuration);
  
  // Collect detailed network timing metrics
  if (res.timings) {
    tcpConnectionTime.add(res.timings.connecting || 0);
    timeToFirstByte.add(res.timings.waiting || 0);
    dataUploadTime.add(res.timings.sending || 0); // Upload time untuk write operations
    dataDownloadTime.add(res.timings.receiving || 0);
    dnsResolutionTime.add(res.timings.dns_lookup || 0);
    tlsHandshakeTime.add(res.timings.tls_handshaking || 0);
    
    // Hitung estimasi waktu pemrosesan server dan network latency
    // Write operations membutuhkan lebih banyak processing time
    const totalTime = res.timings.duration;
    const estimatedProcessingTime = totalTime * 0.7; // 70% untuk processing
    const estimatedNetworkLatency = totalTime - estimatedProcessingTime;
    
    totalNetworkLatency.add(estimatedNetworkLatency);
    serverProcessingTime.add(estimatedProcessingTime);
    
    // Estimasi queue time untuk write operations (biasanya lebih lama)
    const estimatedQueueTime = res.timings.connecting * 0.4;
    requestQueueTime.add(estimatedQueueTime);
  }
  
  // === PENGUMPULAN METRIK RESPONSE ===
  // Ukuran response payload
  const responseSizeBytes = res.body ? res.body.length : 0;
  responsePayloadSize.add(responseSizeBytes);
  
  // Total data transfer dalam KB
  const totalTransferKb = (requestSizeBytes + responseSizeBytes) / 1024;
  totalDataTransfer.add(totalTransferKb);
  
  // === VALIDASI RESPONSE ===
  const checkRes = check(res, {
    'SAV create berhasil (status 200/201)': (r) => r.status === 200 || r.status === 201,
    'SAV create selesai dalam 5 detik': (r) => r.timings.duration < 5000,
    'Response size wajar (< 200KB)': (r) => responseSizeBytes < 200000,
    'Tidak ada timeout': (r) => r.status !== 0,
    'Upload payload berhasil (< 3s)': (r) => r.timings.sending < 3000,
    'Response memiliki content': (r) => r.body && r.body.length > 0,
  });
  
  // === KATEGORISASI ERROR DAN SUCCESS RATE ===
  const isSuccess = res.status >= 200 && res.status < 300;
  const isClientError = res.status >= 400 && res.status < 500;
  const isServerError = res.status >= 500;
  const isTimeout = res.status === 0;
  
  // Update success dan error rates
  apiSuccessRate.add(isSuccess);
  apiErrorRate.add(!isSuccess);
  
  // Kategorisasi error berdasarkan jenis
  if (isTimeout) {
    timeoutErrors.add(1);
  }
  if (isServerError) {
    serverErrors.add(1);
  }
  if (isClientError) {
    clientErrors.add(1);
  }
  
  // === LOGGING UNTUK DEBUGGING ===
   if (!isSuccess) {
     console.log(`SAV Write Error - Template: ${selectedTemplate.type}, Status: ${res.status}, Duration: ${res.timings.duration}ms, Response Size: ${responseSizeBytes}B`);
   } else {
     console.log(`SAV Write Success - Template: ${selectedTemplate.type}, Filename: ${payload.filename}, Duration: ${res.timings.duration}ms`);
   }
   
   // Record write operation time
   savWriteTime.add(res.timings.duration);
   
   return res;
}

// Main test function
export default function(data) {
  // Randomly choose an operation to perform
  const operations = [
    { func: testSavRead, weight: 2 },   // 40% chance
    { func: testSavWrite, weight: 3 },  // 60% chance
  ];
  
  // Weighted random selection
  const totalWeight = operations.reduce((sum, op) => sum + op.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const operation of operations) {
    random -= operation.weight;
    if (random <= 0) {
      operation.func(data);
      break;
    }
  }
  
  // Simulate user think time
  sleep(Math.random() * 2 + 1); // Sleep between 1-3 seconds
}

// Teardown function
export function teardown(data) {
  console.log('SAV API load test completed');
  console.log(`Total test duration: ${(Date.now() - data.startTime) / 1000} seconds`);
}
