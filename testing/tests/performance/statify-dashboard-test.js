import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 5, // 5 virtual users
  duration: '60s', // run for 60 seconds
};

export default function () {
  // Test Statify dashboard data page
  let response = http.get('https://statify-dev.student.stis.ac.id/dashboard/data');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
    'contains dashboard content': (r) => r.body.includes('dashboard') || r.body.includes('data'),
    'response size > 1KB': (r) => r.body.length > 1024,
  });
  
  sleep(1);
}
