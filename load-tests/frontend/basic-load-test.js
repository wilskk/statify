import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter } from 'k6/metrics';

// Custom metrics
const errorCounter = new Counter('errors');

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
  
  // Define thresholds
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    errors: ['count<10'], // Allow no more than 10 errors
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
  // Randomly select an action
  const action = testActions[Math.floor(Math.random() * testActions.length)];
  
  // Make HTTP request to the application
  const res = http.get(`https://statify-dev.student.stis.ac.id${action.path}`);
  
  // Check response
  const checkRes = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time is less than 500ms': (r) => r.timings.duration < 500,
  });
  
  // Count errors
  if (!checkRes) {
    errorCounter.add(1);
  }
  
  // Simulate user think time
  sleep(Math.random() * 3 + 1); // Sleep between 1-4 seconds
}

// Teardown function (runs once after the test)
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Test duration: ${(Date.now() - data.startTime) / 1000} seconds`);
}
