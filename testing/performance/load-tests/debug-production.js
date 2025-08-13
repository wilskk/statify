import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  const baseUrl = 'https://statify-dev.student.stis.ac.id/api';
  
  const payload = {
    variables: [
      { name: 'age', type: 'numeric', values: [25, 30, 35, 28, 32] },
      { name: 'income', type: 'numeric', values: [50000, 60000, 75000, 55000, 65000] }
    ],
    filename: 'test-production.sav'
  };

  console.log('Testing production endpoint:', `${baseUrl}/sav/create`);
  console.log('Payload:', JSON.stringify(payload));

  const response = http.post(`${baseUrl}/sav/create`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'User-Agent': 'Statify-Debug/1.0'
    },
    timeout: '60s',
  });

  console.log('Response Status:', response.status);
  console.log('Response Status Text:', response.status_text);
  console.log('Response Body:', response.body);
  console.log('Response Time:', response.timings.duration);

  // Check yang lebih spesifik untuk production
  const isSuccess = check(response, {
    'status is 200': (r) => r.status === 200,
    'status is 403': (r) => r.status === 403,
    'has response': (r) => r.body && r.body.length > 0,
  });

  console.log('Production test result - Status:', response.status, 'Success:', isSuccess);
  
  if (response.status === 403) {
    console.log('⚠️ Production server returned 403 Forbidden - may require authentication');
  } else if (response.status === 200) {
    console.log('✅ Production server responded successfully');
  } else {
    console.log('❌ Production server returned unexpected status:', response.status);
  }
}