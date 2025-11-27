# Stress Test Scripts

This directory contains load and stress test scripts for the Sandy POS application.

## Prerequisites

### Install K6
```bash
# Windows (using Chocolatey)
choco install k6

# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Install Artillery (Alternative)
```bash
npm install -g artillery
# or
pnpm add -g artillery
```

## Running Tests

### K6 Tests

#### Order Submission Test
```bash
# Basic run
k6 run k6/order-submission.js

# Custom load
k6 run --vus 50 --duration 5m k6/order-submission.js

# With environment variable
BASE_URL=https://your-test-env.com k6 run k6/order-submission.js
```

#### Product Catalog Test
```bash
# Basic run
k6 run k6/product-catalog.js

# High load
k6 run --vus 100 --duration 10m k6/product-catalog.js
```

### Artillery Tests

```bash
# Run load test
artillery run artillery/load-test.yml

# Run with custom config
artillery run --config artillery/config.json artillery/load-test.yml
```

## Test Environment Setup

1. **Create Test Environment**
   - Set up a separate Supabase project for testing
   - Use test API keys and credentials
   - Ensure test data is isolated from production

2. **Environment Variables**
   ```bash
   export BASE_URL=https://your-test-env.com
   export SUPABASE_URL=your-test-supabase-url
   export SUPABASE_KEY=your-test-supabase-key
   ```

3. **Test Data**
   - Run setup scripts to create test data
   - Ensure sufficient products, users, and orders exist

## Test Scripts

### K6 Scripts
- `k6/order-submission.js` - Tests order creation under load
- `k6/product-catalog.js` - Tests product fetching and search
- `k6/authentication.js` - Tests sign-in performance (to be created)
- `k6/image-upload.js` - Tests file upload performance (to be created)

### Artillery Scripts
- `artillery/load-test.yml` - General load test configuration
- `artillery/stress-test.yml` - Stress test configuration

## Results

Test results will be saved in the `results/` directory:
- `results/baseline/` - Baseline performance metrics
- `results/load/` - Load test results
- `results/stress/` - Stress test results

## Monitoring

During tests, monitor:
- **Supabase Dashboard**: Database performance and connection pool
- **Application Logs**: Error rates and response times
- **System Resources**: CPU, memory, and network usage

## Best Practices

1. **Start Small**: Begin with low load and gradually increase
2. **Monitor Closely**: Watch for errors and performance degradation
3. **Test in Isolation**: Use separate test environment
4. **Document Results**: Save all test results for comparison
5. **Clean Up**: Remove test data after tests complete

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check BASE_URL is correct
   - Verify network connectivity
   - Check firewall rules

2. **Rate Limiting**
   - Reduce virtual users (VUs)
   - Increase sleep times between requests
   - Check Supabase/Cloudinary rate limits

3. **Timeout Errors**
   - Increase timeout values in test scripts
   - Check database query performance
   - Verify external service availability

## Next Steps

1. Create additional test scripts for:
   - Authentication flows
   - Image uploads
   - Admin dashboard operations
   - Real-time features

2. Set up CI/CD integration:
   - Run tests on each deployment
   - Compare results over time
   - Alert on performance regressions

3. Create performance dashboards:
   - Visualize test results
   - Track performance trends
   - Identify bottlenecks

