import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 3,
  duration: '45s',
};

export default function () {
  // Test multiple Statify pages
  const baseUrl = 'https://statify-dev.student.stis.ac.id';
  
  // Test dashboard data page
  let dashboardResponse = http.get(`${baseUrl}/dashboard/data`);
  check(dashboardResponse, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  sleep(1);
  
  // Test home page (if exists)
  let homeResponse = http.get(baseUrl);
  check(homeResponse, {
    'home status is 200 or redirect': (r) => r.status === 200 || r.status === 302 || r.status === 301,
    'home response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  sleep(1);
}
