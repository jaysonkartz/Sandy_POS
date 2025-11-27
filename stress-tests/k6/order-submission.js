/**
 * K6 Load Test Script: Order Submission Stress Test
 * 
 * This script tests the order submission flow under various load conditions.
 * 
 * Usage:
 *   k6 run order-submission.js
 *   k6 run --vus 50 --duration 5m order-submission.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const orderSuccessRate = new Rate('order_success');
const orderResponseTime = new Trend('order_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '2m', target: 10 },    // Stay at 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    order_success: ['rate>0.95'],       // 95% success rate
    order_response_time: ['p(95)<3000'], // 95% of orders should complete in < 3s
  },
};

// Base URL - Update with your test environment URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data - In real tests, load from JSON files or generate dynamically
const testProducts = [
  { id: 1, quantity: 2 },
  { id: 2, quantity: 1 },
  { id: 3, quantity: 3 },
];

// Simulate user session
function authenticate() {
  // In real tests, implement actual authentication
  // For now, return a mock session token
  return {
    accessToken: 'mock-token',
    userId: 'test-user-' + Math.random().toString(36).substring(7),
  };
}

// Submit an order
function submitOrder(session) {
  const url = `${BASE_URL}/api/orders`; // Update with actual API endpoint
  
  const payload = JSON.stringify({
    customer_name: `Test Customer ${Math.random().toString(36).substring(7)}`,
    customer_phone: '+65 9123 4567',
    customer_address: '123 Test Street, Singapore',
    items: testProducts,
    total_amount: 150.00,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
    },
  };

  const startTime = Date.now();
  const response = http.post(url, payload, params);
  const responseTime = Date.now() - startTime;

  const success = check(response, {
    'order created successfully': (r) => r.status === 201 || r.status === 200,
    'response time < 3s': (r) => r.timings.duration < 3000,
  });

  orderSuccessRate.add(success);
  orderResponseTime.add(responseTime);

  return { success, response, responseTime };
}

// Main test function
export default function () {
  // Authenticate user
  const session = authenticate();

  // Submit order
  const result = submitOrder(session);

  // Simulate user think time
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

// Setup function (runs once before all VUs)
export function setup() {
  console.log('Setting up test environment...');
  // Add any setup logic here (e.g., create test data)
  return {};
}

// Teardown function (runs once after all VUs)
export function teardown(data) {
  console.log('Cleaning up test environment...');
  // Add any cleanup logic here
}

