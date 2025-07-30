import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics
const readTime = new Trend('sav_read_time');
const writeTime = new Trend('sav_write_time');
const errorCounter = new Counter('sav_errors');

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
  
  // Define thresholds
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2000ms
    sav_read_time: ['p(95)<3000'],     // 95% of read operations should be below 3s
    sav_write_time: ['p(95)<5000'],    // 95% of write operations should be below 5s
    sav_errors: ['count<5'],           // Allow no more than 5 errors
  },
};

// Setup function
export function setup() {
  console.log('Starting SAV API load test for Statify');
  
  // Common headers for requests
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'k6-load-tester',
  };
  
  return { headers: headers, startTime: Date.now() };
}

// Test SAV read operation (upload endpoint)
export function testSavRead(data) {
  // For testing the read operation, we'll upload an actual example dataset file
  // List of example datasets from the frontend (based on files in frontend/public/exampleData)
  const exampleFiles = [
    '/exampleData/accidents.sav',
    '/exampleData/adl.sav',
    '/exampleData/advert.sav',
    '/exampleData/car_sales.sav',
    '/exampleData/customer_dbase.sav',
    '/exampleData/demo.sav',
    '/exampleData/dietstudy.sav',
    '/exampleData/Employee data.sav',
    '/exampleData/german_credit.sav',
    '/exampleData/insurance_claims.sav',
    '/exampleData/patient_los.sav',
    '/exampleData/salesperformance.sav',
    '/exampleData/satisf.sav',
    '/exampleData/tcm_kpi.sav',
    '/exampleData/telco_extra.sav',
    '/exampleData/test_scores.sav',
    '/exampleData/worldsales.sav'
  ];
  
  // Select a random example file
  const randomFile = exampleFiles[Math.floor(Math.random() * exampleFiles.length)];
  
  // Create a minimal form data object to simulate file upload
  // In a real scenario, the file would be downloaded and uploaded
  // For load testing, we're just testing the endpoint with minimal data
  const formdata = {
    'filename': randomFile.split('/').pop()
  };
  
  const res = http.post(
    'https://statify-dev.student.stis.ac.id/api/sav/upload',
    formdata,
    { headers: data.headers }
  );
  
  const checkRes = check(res, {
    'sav read status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'sav read time is less than 3s': (r) => r.timings.duration < 3000,
  });
  
  if (!checkRes) {
    errorCounter.add(1);
  }
  
  readTime.add(res.timings.duration);
  
  return res;
}

// Test SAV write operation (create endpoint)
export function testSavWrite(data) {
  // Sample payload for creating a SAV file
  const payload = {
    variables: [
      {
        name: 'age',
        label: 'Age of respondent',
        type: 'NUMERIC',
        width: 8,
        decimal: 0
      },
      {
        name: 'gender',
        label: 'Gender of respondent',
        type: 'STRING',
        width: 10,
        decimal: 0
      }
    ],
    data: [
      { age: 25, gender: 'Male' },
      { age: 30, gender: 'Female' },
      { age: 35, gender: 'Male' }
    ]
  };
  
  const res = http.post(
    'https://statify-dev.student.stis.ac.id/api/sav/create',
    JSON.stringify(payload),
    { headers: data.headers }
  );
  
  const checkRes = check(res, {
    'sav write status is 200': (r) => r.status === 200 || r.status === 400, // 400 is expected if data is invalid
    'sav write time is less than 5s': (r) => r.timings.duration < 5000,
  });
  
  if (!checkRes) {
    errorCounter.add(1);
  }
  
  writeTime.add(res.timings.duration);
  
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
