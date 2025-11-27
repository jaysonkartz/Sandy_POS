# Step-by-Step Stress Testing Guide

This guide walks you through executing stress tests for the Sandy POS application.

## Prerequisites

### Step 1: Install Testing Tools

#### Install K6 (Recommended)

**Windows Options:**

**Option 1: Using winget (Windows Package Manager) - Recommended**
```powershell
# Run in PowerShell
winget install k6
```

**Option 2: Using Scoop**
```powershell
# First install Scoop if you don't have it:
# Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
# irm get.scoop.sh | iex

# Then install k6
scoop install k6
```

**Option 3: Direct Download (No package manager needed)**
```powershell
# 1. Download from: https://github.com/grafana/k6/releases/latest
# 2. Download: k6-v0.x.x-windows-amd64.zip
# 3. Extract to a folder (e.g., C:\k6)
# 4. Add to PATH:
#    - Open System Properties → Environment Variables
#    - Add C:\k6 to PATH
#    - Or run in PowerShell:
$env:Path += ";C:\k6"
```

**Option 4: Using Chocolatey (if installed)**
```powershell
# Run PowerShell as Administrator
choco install k6
```

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

#### Verify Installation
```bash
k6 version
# Should output: k6 v0.x.x
```

#### Install Artillery (Optional Alternative)
```bash
npm install -g artillery
# or
pnpm add -g artillery
```

---

## Environment Setup

### Step 2: Prepare Test Environment

#### 2.1 Create Test Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project for testing (e.g., "sandy-pos-test")
3. Copy your test project credentials:
   - Project URL
   - Anon/Public Key
   - Service Role Key (for admin operations)

#### 2.2 Set Up Environment Variables
Create a `.env.test` file in your project root:

```env
# Test Environment
NEXT_PUBLIC_SUPABASE_URL=your-test-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key

# Cloudinary (Test Account)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-test-cloud-name
CLOUDINARY_API_KEY=your-test-api-key
CLOUDINARY_API_SECRET=your-test-api-secret

# Test Base URL
TEST_BASE_URL=http://localhost:3000
```

#### 2.3 Deploy Test Application
```bash
# Option 1: Run locally
pnpm dev

# Option 2: Deploy to test/staging environment
# (Vercel, Railway, etc.)
```

---

## Test Data Preparation

### Step 3: Generate Test Data

#### 3.1 Create Test Users Script
Create `stress-tests/scripts/setup-test-data.js`:

```javascript
// Example: Create test users in Supabase
// Run this once to set up test data
```

#### 3.2 Manual Test Data Setup
1. **Products**: Ensure you have at least 1,000 products in your test database
2. **Users**: Create 10-20 test user accounts
3. **Orders**: Create some historical orders for testing order history queries

#### 3.3 Verify Test Data
```bash
# Check product count
# In Supabase SQL Editor:
SELECT COUNT(*) FROM products;

# Check user count
SELECT COUNT(*) FROM auth.users;
```

---

## Running Tests

### Step 4: Baseline Testing (Start Here)

#### 4.1 Test Product Loading (Single User)
```bash
# Navigate to stress-tests directory
cd stress-tests

# Run product catalog test with 1 user
k6 run --vus 1 --duration 30s k6/product-catalog.js
```

**What to Check:**
- Response times
- Success rate (should be 100%)
- Any errors in output

#### 4.2 Test Order Submission (Single User)
```bash
# Run order submission test with 1 user
k6 run --vus 1 --duration 30s k6/order-submission.js
```

**What to Check:**
- Order creation success
- Response time
- Database transaction completion

#### 4.3 Document Baseline Metrics
Create `stress-tests/results/baseline/baseline-metrics.md`:

```markdown
# Baseline Metrics
Date: [Current Date]

## Product Loading
- Single user response time: [X]ms
- Success rate: [X]%

## Order Submission
- Single order creation time: [X]ms
- Success rate: [X]%

## Notes
- [Any observations]
```

---

### Step 5: Load Testing (Gradual Increase)

#### 5.1 Light Load (10 Users)
```bash
# Product catalog with 10 users
k6 run --vus 10 --duration 2m k6/product-catalog.js

# Order submission with 10 users
k6 run --vus 10 --duration 2m k6/order-submission.js
```

**Monitor:**
- Supabase Dashboard → Database → Active Connections
- Application logs for errors
- Response times

#### 5.2 Medium Load (50 Users)
```bash
# Product catalog with 50 users
k6 run --vus 50 --duration 3m k6/product-catalog.js

# Order submission with 50 users
k6 run --vus 50 --duration 3m k6/order-submission.js
```

**Monitor:**
- Error rates (should stay < 1%)
- Database query performance
- API response times

#### 5.3 High Load (100 Users)
```bash
# Product catalog with 100 users
k6 run --vus 100 --duration 5m k6/product-catalog.js

# Order submission with 100 users
k6 run --vus 100 --duration 5m k6/order-submission.js
```

**Monitor:**
- System resources (CPU, memory)
- Database connection pool
- External service limits (Cloudinary, Supabase)

---

### Step 6: Stress Testing (Find Limits)

#### 6.1 Extreme Load (500+ Users)
```bash
# Gradually increase to find breaking point
k6 run --vus 200 --duration 5m k6/product-catalog.js
k6 run --vus 300 --duration 5m k6/product-catalog.js
k6 run --vus 500 --duration 5m k6/product-catalog.js
```

**What to Look For:**
- Error rate increases
- Response time degradation
- System failures
- Database connection errors

#### 6.2 Spike Testing
```bash
# Sudden spike in load
k6 run --vus 0:100:0s --duration 1m k6/product-catalog.js
```

This creates an instant spike from 0 to 100 users.

---

### Step 7: Endurance Testing (Long Duration)

#### 7.1 Sustained Load (24 Hours)
```bash
# Run for extended period
k6 run --vus 50 --duration 24h k6/product-catalog.js
```

**Monitor:**
- Memory leaks
- Resource exhaustion
- System stability
- Performance degradation over time

---

## Monitoring During Tests

### Step 8: Set Up Monitoring

#### 8.1 Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **Database** → **Performance**
3. Monitor:
   - Active connections
   - Query performance
   - Slow queries
   - Connection pool usage

#### 8.2 Application Logs
```bash
# If running locally, watch logs
# Terminal 1: Run application
pnpm dev

# Terminal 2: Watch logs (if using logging)
tail -f logs/app.log
```

#### 8.3 Browser DevTools (Frontend Tests)
1. Open Chrome DevTools (F12)
2. Go to **Performance** tab
3. Record during test execution
4. Analyze:
   - Frame rate
   - Memory usage
   - Component render times

#### 8.4 System Resources
```bash
# Windows (PowerShell)
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Select-Object CPU, WorkingSet

# macOS/Linux
top
# or
htop
```

---

## Analyzing Results

### Step 9: Review Test Results

#### 9.1 K6 Output Analysis
K6 provides detailed output:

```
✓ order created successfully
✓ response time < 3s
✗ order created successfully: 95.5% success rate

checks.........................: 95.50% ✓ 1910  ✗ 90
data_received..................: 2.1 MB 35 kB/s
data_sent......................: 1.2 MB 20 kB/s
http_req_duration..............: avg=1.2s min=200ms med=800ms max=5s p(95)=2.1s
http_reqs......................: 2000    33.33/s
iteration_duration.............: avg=3.5s min=1s med=3s max=10s p(95)=6s
iterations.....................: 2000    33.33/s
vus............................: 50      min=50 max=50
```

**Key Metrics:**
- `http_req_duration`: Response times (p95 should be < 2s)
- `checks`: Success rate (should be > 95%)
- `http_reqs`: Throughput (requests per second)

#### 9.2 Save Results
```bash
# Save output to file
k6 run k6/order-submission.js > results/load/order-submission-$(date +%Y%m%d-%H%M%S).txt

# Or use JSON output
k6 run --out json=results/load/order-submission.json k6/order-submission.js
```

#### 9.3 Compare Results
Create comparison table:

| Test | Users | Duration | Success Rate | Avg Response | p95 Response |
|------|-------|----------|--------------|--------------|--------------|
| Baseline | 1 | 30s | 100% | 200ms | 300ms |
| Light Load | 10 | 2m | 99.5% | 500ms | 1.2s |
| Medium Load | 50 | 3m | 98.2% | 1.1s | 2.5s |
| High Load | 100 | 5m | 95.1% | 1.8s | 3.2s |

---

## Common Issues & Solutions

### Step 10: Troubleshooting

#### Issue: Connection Errors
```
Error: dial tcp: lookup localhost: no such host
```
**Solution:**
- Check BASE_URL in test script
- Verify application is running
- Check firewall/network settings

#### Issue: Rate Limiting
```
Error: 429 Too Many Requests
```
**Solution:**
- Reduce virtual users (VUs)
- Increase sleep time between requests
- Check Supabase/Cloudinary rate limits
- Implement request queuing

#### Issue: Database Connection Pool Exhausted
```
Error: remaining connection slots are reserved
```
**Solution:**
- Increase Supabase connection pool size
- Reduce concurrent database operations
- Implement connection pooling in application
- Add retry logic with backoff

#### Issue: Timeout Errors
```
Error: context deadline exceeded
```
**Solution:**
- Increase timeout values in test scripts
- Optimize slow database queries
- Check external service availability
- Review network latency

---

## Next Steps After Testing

### Step 11: Document Findings

#### 11.1 Create Test Report
Create `stress-tests/results/test-report-YYYY-MM-DD.md`:

```markdown
# Stress Test Report
Date: [Date]
Test Duration: [Duration]
Tested By: [Your Name]

## Executive Summary
[High-level findings]

## Test Results
[Detailed results]

## Bottlenecks Identified
1. [Issue 1]
2. [Issue 2]

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

## Performance Improvements
[Before/After comparisons]
```

#### 11.2 Share Results
- Share report with development team
- Discuss findings in team meeting
- Prioritize optimizations
- Plan follow-up tests

#### 11.3 Implement Optimizations
Based on findings:
- Optimize slow database queries
- Add caching where appropriate
- Implement connection pooling
- Add rate limiting
- Optimize frontend rendering

---

## Quick Reference Commands

### Basic Tests
```bash
# Single user test
k6 run --vus 1 --duration 30s k6/product-catalog.js

# 10 users for 2 minutes
k6 run --vus 10 --duration 2m k6/order-submission.js

# 50 users for 5 minutes
k6 run --vus 50 --duration 5m k6/product-catalog.js
```

### Advanced Tests
```bash
# Gradual ramp-up (stages)
k6 run k6/order-submission.js

# Custom stages
k6 run --stage 1m:10 --stage 2m:50 --stage 1m:0 k6/product-catalog.js

# Save results
k6 run --out json=results.json k6/order-submission.js
```

### Monitoring
```bash
# Run with verbose output
k6 run --verbose k6/product-catalog.js

# Run with summary only
k6 run --summary k6/order-submission.js
```

---

## Testing Checklist

Use this checklist to ensure you've covered everything:

- [ ] Tools installed (k6)
- [ ] Test environment set up
- [ ] Test data prepared
- [ ] Baseline tests completed
- [ ] Load tests completed (10, 50, 100 users)
- [ ] Stress tests completed (500+ users)
- [ ] Results documented
- [ ] Bottlenecks identified
- [ ] Recommendations created
- [ ] Team notified of findings

---

## Tips for Success

1. **Start Small**: Always begin with baseline tests
2. **Monitor Closely**: Watch for errors and performance degradation
3. **Document Everything**: Save all test results and observations
4. **Test Regularly**: Run tests after major changes
5. **Compare Results**: Track performance over time
6. **Test Realistic Scenarios**: Simulate actual user behavior
7. **Clean Up**: Remove test data after tests complete

---

*For detailed test scenarios, see `STRESS_TEST_PLAN.md`*
*For quick reference, see `STRESS_TEST_CHECKLIST.md`*

