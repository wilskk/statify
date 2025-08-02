import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';

// === METRIK KHUSUS UNTUK WRITE SAV KECIL ===
export const savWriteSmallSuccessRate = new Rate('sav_write_small_success_rate');
export const savWriteSmallDuration = new Trend('sav_write_small_duration_ms');

// === KONFIGURASI SKENARIO ===
export const options = {
  scenarios: {
    sav_write_small_data: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 3 },
        { duration: '30s', target: 3 },
        { duration: '20s', target: 0 }
      ],
      env: {
        DATA_SIZE_CATEGORY: 'small'
      }
    }
  },
  thresholds: {
    sav_write_small_success_rate: ['rate>0.95'],
    sav_write_small_duration_ms: ['p(95)<2000', 'p(99)<3000', 'avg<1000'],
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<5000']
  }
};

// === FUNGSI UTAMA ===
export default function () {
  // === KONFIGURASI BASE URL ===
  const baseUrl = __ENV.BASE_URL || 'https://statify-dev.student.stis.ac.id';
  
  // === PERSIAPAN DATA SAV ===
  // Tentukan ukuran data berdasarkan kategori
  const dataSizeCategory = __ENV.DATA_SIZE_CATEGORY || 'small';
  
  // Template data sederhana untuk testing
  const dataTemplate = {
    type: 'customer_survey',
    variables: [
      { name: 'customer_id', label: 'ID Pelanggan', type: 'NUMERIC', width: 8, decimal: 0, measure: 'NOMINAL' },
      { name: 'age', label: 'Usia', type: 'NUMERIC', width: 3, decimal: 0, measure: 'SCALE' },
      { name: 'gender', label: 'Jenis Kelamin', type: 'STRING', width: 10, decimal: 0, measure: 'NOMINAL' },
      { name: 'satisfaction', label: 'Tingkat Kepuasan', type: 'NUMERIC', width: 2, decimal: 0, measure: 'ORDINAL' }
    ],
    sampleData: [
      { customer_id: 1, age: 25, gender: 'Male', satisfaction: 4 },
      { customer_id: 2, age: 30, gender: 'Female', satisfaction: 5 },
      { customer_id: 3, age: 35, gender: 'Male', satisfaction: 3 }
    ]
  };
  
  // Generate data berdasarkan kategori ukuran
  let generatedData = [...dataTemplate.sampleData];
  let targetRecords = Math.floor(Math.random() * 10) + 5; // 5-15 records untuk small
  
  // Generate data tambahan jika diperlukan
  while (generatedData.length < targetRecords) {
    const baseRecord = dataTemplate.sampleData[Math.floor(Math.random() * dataTemplate.sampleData.length)];
    const newRecord = { ...baseRecord };
    newRecord.customer_id = newRecord.customer_id + Math.floor(Math.random() * 1000);
    newRecord.age = newRecord.age + Math.floor(Math.random() * 10) - 5;
    generatedData.push(newRecord);
  }
  
  // === PERSIAPAN REQUEST ===
  const createPayload = {
    variables: dataTemplate.variables,
    data: generatedData
  };
  
  const payloadSize = JSON.stringify(createPayload).length;
  
  // === EKSEKUSI REQUEST ===
  const startTime = Date.now();
  
  const response = http.post(`${baseUrl}/api/sav/create`, JSON.stringify(createPayload), {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '30s'
  });
  
  const duration = Date.now() - startTime;
  
  // === VALIDASI RESPONSE ===
  const isSuccess = check(response, {
    'SAV Create - Status is 200': (r) => r.status === 200,
    'SAV Create - Response has content': (r) => r.body && r.body.length > 0,
  });
  
  // === METRIK ===
  savWriteSmallSuccessRate.add(isSuccess ? 1 : 0);
  savWriteSmallDuration.add(duration);
  
  // === LOGGING ===
  if (isSuccess) {
    console.log(`[SMALL] SAV Write Success - Template: ${dataTemplate.type}, Variables: ${dataTemplate.variables.length}, Records: ${generatedData.length}, Duration: ${duration}ms`);
  } else {
    console.log(`[SMALL] SAV Write Error - Template: ${dataTemplate.type}, Status: ${response.status}, Duration: ${duration}ms`);
  }
  
  sleep(1);
}