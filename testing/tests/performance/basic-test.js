import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1, // 1 virtual user
  duration: '30s', // run for 30 seconds
};

export default function () {
  // Test Statify dashboard data page
  let response = http.get('https://statify-dev.student.stis.ac.id/dashboard/data');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
    'contains dashboard content': (r) => r.body.includes('dashboard') || r.body.includes('data'),
  });
  
  sleep(1);
}
