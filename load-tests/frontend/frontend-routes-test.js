import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics
const pageLoadTime = new Trend('page_load_time');
const errorCounter = new Counter('frontend_errors');

// Test options
export const options = {
  scenarios: {
    // Simulate homepage access
    homepage_access: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '30s', target: 15 }, // Ramp up to 15 VUs
        { duration: '1m', target: 15 },  // Stay at 15 VUs
        { duration: '30s', target: 0 },  // Ramp down to 0 VUs
      ],
      gracefulRampDown: '10s',
    },
    
    // Simulate dashboard navigation
    dashboard_navigation: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '30s', target: 10 }, // Ramp up to 10 VUs
        { duration: '1m', target: 10 },  // Stay at 10 VUs
        { duration: '30s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '15s', // Start after 15s
      gracefulRampDown: '10s',
    },
    
    // Simulate data operations
    data_operations: {
      executor: 'ramping-vus',
      startVUs: 3,
      stages: [
        { duration: '30s', target: 8 },  // Ramp up to 8 VUs
        { duration: '1m', target: 8 },   // Stay at 8 VUs
        { duration: '30s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '30s', // Start after 30s
      gracefulRampDown: '10s',
    },
    
    // Simulate variable operations
    variable_operations: {
      executor: 'ramping-vus',
      startVUs: 3,
      stages: [
        { duration: '30s', target: 6 },  // Ramp up to 6 VUs
        { duration: '1m', target: 6 },   // Stay at 6 VUs
        { duration: '30s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '45s', // Start after 45s
      gracefulRampDown: '10s',
    },
    
    // Simulate results access
    results_access: {
      executor: 'ramping-vus',
      startVUs: 2,
      stages: [
        { duration: '30s', target: 5 },  // Ramp up to 5 VUs
        { duration: '1m', target: 5 },   // Stay at 5 VUs
        { duration: '30s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '1m', // Start after 1 minute
      gracefulRampDown: '10s',
    },
    
    // Simulate help page access
    help_access: {
      executor: 'ramping-vus',
      startVUs: 2,
      stages: [
        { duration: '30s', target: 5 },  // Ramp up to 5 VUs
        { duration: '1m', target: 5 },   // Stay at 5 VUs
        { duration: '30s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '1m15s', // Start after 1 minute 15 seconds
      gracefulRampDown: '10s',
    },
  },
  
  // Define thresholds
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1000ms
    page_load_time: ['p(95)<2000'],    // 95% of page loads should be below 2s
    frontend_errors: ['count<5'],      // Allow no more than 5 errors
  },
};

// Setup function
export function setup() {
  console.log('Starting frontend routes load test for Statify');
  return { startTime: Date.now() };
}

// Test functions for each route

// Test homepage access
export function testHomepage(data) {
  const res = http.get('https://statify-dev.student.stis.ac.id/');
  
  const checkRes = check(res, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage load time is less than 2s': (r) => r.timings.duration < 2000,
  });
  
  if (!checkRes) {
    errorCounter.add(1);
  }
  
  pageLoadTime.add(res.timings.duration);
  
  return res;
}

// Test dashboard access
export function testDashboard(data) {
  const res = http.get('https://statify-dev.student.stis.ac.id/dashboard');
  
  const checkRes = check(res, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard load time is less than 2s': (r) => r.timings.duration < 2000,
  });
  
  if (!checkRes) {
    errorCounter.add(1);
  }
  
  pageLoadTime.add(res.timings.duration);
  
  return res;
}

// Test data management page
export function testDataPage(data) {
  const res = http.get('https://statify-dev.student.stis.ac.id/dashboard/data');
  
  const checkRes = check(res, {
    'data page status is 200': (r) => r.status === 200,
    'data page load time is less than 2s': (r) => r.timings.duration < 2000,
  });
  
  if (!checkRes) {
    errorCounter.add(1);
  }
  
  pageLoadTime.add(res.timings.duration);
  
  return res;
}

// Test variable management page
export function testVariablePage(data) {
  const res = http.get('https://statify-dev.student.stis.ac.id/dashboard/variable');
  
  const checkRes = check(res, {
    'variable page status is 200': (r) => r.status === 200,
    'variable page load time is less than 2s': (r) => r.timings.duration < 2000,
  });
  
  if (!checkRes) {
    errorCounter.add(1);
  }
  
  pageLoadTime.add(res.timings.duration);
  
  return res;
}

// Test results page
export function testResultsPage(data) {
  const res = http.get('https://statify-dev.student.stis.ac.id/dashboard/result');
  
  const checkRes = check(res, {
    'results page status is 200': (r) => r.status === 200,
    'results page load time is less than 2s': (r) => r.timings.duration < 2000,
  });
  
  if (!checkRes) {
    errorCounter.add(1);
  }
  
  pageLoadTime.add(res.timings.duration);
  
  return res;
}

// Test help page
export function testHelpPage(data) {
  const res = http.get('https://statify-dev.student.stis.ac.id/help');
  
  const checkRes = check(res, {
    'help page status is 200': (r) => r.status === 200,
    'help page load time is less than 2s': (r) => r.timings.duration < 2000,
  });
  
  if (!checkRes) {
    errorCounter.add(1);
  }
  
  pageLoadTime.add(res.timings.duration);
  
  return res;
}

// Main test function
export default function(data) {
  // Randomly choose a page to test
  const pages = [
    { func: testHomepage, weight: 3 },      // 20% chance
    { func: testDashboard, weight: 2 },      // 15% chance
    { func: testDataPage, weight: 2 },       // 15% chance
    { func: testVariablePage, weight: 2 },   // 15% chance
    { func: testResultsPage, weight: 2 },    // 15% chance
    { func: testHelpPage, weight: 1 },       // 10% chance
  ];
  
  // Weighted random selection
  const totalWeight = pages.reduce((sum, page) => sum + page.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const page of pages) {
    random -= page.weight;
    if (random <= 0) {
      page.func(data);
      break;
    }
  }
  
  // Simulate user think time
  sleep(Math.random() * 2 + 1); // Sleep between 1-3 seconds
}

// Teardown function
export function teardown(data) {
  console.log('Frontend routes load test completed');
  console.log(`Total test duration: ${(Date.now() - data.startTime) / 1000} seconds`);
}
