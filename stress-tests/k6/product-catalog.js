/**
 * K6 Load Test Script: Product Catalog Stress Test
 * 
 * This script tests product fetching and filtering performance.
 * 
 * Usage:
 *   k6 run product-catalog.js
 *   k6 run --vus 100 --duration 10m product-catalog.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const productLoadSuccess = new Rate('product_load_success');
const productLoadTime = new Trend('product_load_time');
const searchSuccess = new Rate('search_success');
const searchTime = new Trend('search_time');
const searchQueries = new Counter('search_queries');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '2m', target: 20 },   // Stay at 20 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],     // 95% of requests should be below 2s
    product_load_success: ['rate>0.98'],   // 98% success rate
    product_load_time: ['p(95)<2000'],     // 95% of loads should be < 2s
    search_time: ['p(95)<500'],            // 95% of searches should be < 500ms
  },
};

// Base URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test categories
const categories = ['all', '1', '2', '3', '5', '6'];

// Search terms (mix of English and Chinese)
const searchTerms = [
  'chilli', '辣椒', 'dried', '乾', 'bean', '豆', 
  'rice', '米', 'nut', '堅果', 'seafood', '海產'
];

// Load products
function loadProducts(category = 'all') {
  const url = category === 'all' 
    ? `${BASE_URL}/api/products`  // Update with actual endpoint
    : `${BASE_URL}/api/products?category=${category}`;

  const startTime = Date.now();
  const response = http.get(url);
  const responseTime = Date.now() - startTime;

  const success = check(response, {
    'products loaded successfully': (r) => r.status === 200,
    'response has products': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data) && data.length > 0;
      } catch {
        return false;
      }
    },
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  productLoadSuccess.add(success);
  productLoadTime.add(responseTime);

  return { success, response, responseTime };
}

// Search products
function searchProducts(searchTerm) {
  const url = `${BASE_URL}/api/products?search=${encodeURIComponent(searchTerm)}`;

  const startTime = Date.now();
  const response = http.get(url);
  const responseTime = Date.now() - startTime;

  searchQueries.add(1);

  const success = check(response, {
    'search completed successfully': (r) => r.status === 200,
    'search response time < 500ms': (r) => r.timings.duration < 500,
  });

  searchSuccess.add(success);
  searchTime.add(responseTime);

  return { success, response, responseTime };
}

// Main test function
export default function () {
  // Simulate user browsing products
  const category = categories[Math.floor(Math.random() * categories.length)];
  loadProducts(category);
  sleep(Math.random() * 2 + 1); // 1-3 seconds

  // Simulate user searching (30% of users)
  if (Math.random() < 0.3) {
    const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    searchProducts(searchTerm);
    sleep(Math.random() * 1 + 0.5); // 0.5-1.5 seconds
  }

  // Simulate user think time
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}

export function setup() {
  console.log('Setting up product catalog test...');
  return {};
}

export function teardown(data) {
  console.log('Cleaning up product catalog test...');
}

