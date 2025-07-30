import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics
const pageLoadTime = new Trend('page_load_time');
const userJourneyTime = new Trend('user_journey_time');
const errorCounter = new Counter('spss_errors');

// Test options with different scenarios
export const options = {
  scenarios: {
    // Simulate realistic user journeys through the application
    user_journeys: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '30s', target: 15 }, // Ramp up to 15 VUs
        { duration: '2m', target: 15 },  // Stay at 15 VUs
        { duration: '30s', target: 0 },  // Ramp down to 0 VUs
      ],
      gracefulRampDown: '10s',
    },
  },
  
  // Define thresholds
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1000ms
    page_load_time: ['p(95)<2000'],    // 95% of page loads should be below 2s
    spss_errors: ['count<5'],          // Allow no more than 5 errors
  },
};

// Setup function
export function setup() {
  console.log('Starting SPSS operations load test with realistic user journeys');
  
  // Common headers for requests
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'k6-load-tester',
  };
  
  return { headers: headers, startTime: Date.now() };
}

// Test landing page
export function testLandingPage(data) {
  const res = http.get('https://statify-dev.student.stis.ac.id/');
  
  const checkRes = check(res, {
    'landing page status is 200': (r) => r.status === 200,
    'landing page load time is less than 2s': (r) => r.timings.duration < 2000,
  });
  
  if (!checkRes) {
    errorCounter.add(1);
  }
  
  pageLoadTime.add(res.timings.duration);
  
  return res;
}

// Test dashboard page
export function testDashboardPage(data) {
  const res = http.get('https://statify-dev.student.stis.ac.id/dashboard');
  
  const checkRes = check(res, {
    'dashboard page status is 200': (r) => r.status === 200,
    'dashboard page load time is less than 2s': (r) => r.timings.duration < 2000,
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

// Simulate a realistic user journey through the application
export function simulateUserJourney(data) {
  const journeyStartTime = new Date().getTime();
  
  // 1. Visit landing page
  testLandingPage(data);
  sleep(Math.random() * 1 + 0.5); // Short think time
  
  // 2. Navigate to dashboard
  testDashboardPage(data);
  sleep(Math.random() * 1 + 0.5); // Short think time
  
  // 3. Work with data (most time spent here)
  testDataPage(data);
  sleep(Math.random() * 2 + 1); // Longer think time
  
  // 4. Manage variables
  testVariablePage(data);
  sleep(Math.random() * 2 + 1); // Longer think time
  
  // 5. View results
  testResultsPage(data);
  sleep(Math.random() * 1 + 0.5); // Short think time
  
  // 6. Occasionally visit help
  if (Math.random() < 0.3) { // 30% chance
    testHelpPage(data);
    sleep(Math.random() * 1 + 0.5); // Short think time
  }
  
  const journeyDuration = new Date().getTime() - journeyStartTime;
  userJourneyTime.add(journeyDuration);
}

// Main test function
export default function(data) {
  // Simulate a realistic user journey through the application
  simulateUserJourney(data);
  
  // Occasionally test individual pages (10% of the time)
  if (Math.random() < 0.1) {
    const pages = [
      testLandingPage,
      testDashboardPage,
      testDataPage,
      testVariablePage,
      testResultsPage,
      testHelpPage
    ];
    
    const randomPage = pages[Math.floor(Math.random() * pages.length)];
    randomPage(data);
  }
  
  // Simulate user think time between journeys
  sleep(Math.random() * 3 + 2); // Sleep between 2-5 seconds
}

// Teardown function
export function teardown(data) {
  console.log('SPSS operations load test completed');
  console.log(`Total test duration: ${(Date.now() - data.startTime) / 1000} seconds`);
}
