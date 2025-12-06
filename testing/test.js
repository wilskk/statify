import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1, // 1 virtual user
  duration: '30s', // run for 30 seconds
};

export default function () {
  // Replace with your target URL
  let response = http.get('https://httpbin.org/get');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
