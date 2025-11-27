# Stress Test Quick Reference Checklist

## Pre-Test Setup

- [ ] Set up isolated test environment (separate Supabase project)
- [ ] Configure test API keys and credentials
- [ ] Generate test data (products, users, orders)
- [ ] Install testing tools (k6, Artillery, etc.)
- [ ] Set up monitoring (Supabase Dashboard, application logs)
- [ ] Document baseline metrics
- [ ] Notify team about test schedule

## Test Execution Checklist

### Phase 1: Baseline Testing
- [ ] Run single-user performance tests
- [ ] Measure product loading time (100, 500, 1000 products)
- [ ] Test search functionality (response time)
- [ ] Test order submission (single order)
- [ ] Test authentication flow
- [ ] Document baseline metrics

### Phase 2: Load Testing
- [ ] Test with 10 concurrent users
- [ ] Test with 50 concurrent users
- [ ] Test with 100 concurrent users
- [ ] Monitor database performance
- [ ] Monitor API response times
- [ ] Check error rates
- [ ] Document thresholds

### Phase 3: Stress Testing
- [ ] Test with 500+ concurrent users
- [ ] Test order submission under extreme load
- [ ] Test file uploads under load
- [ ] Test database connection pool limits
- [ ] Test external service failures
- [ ] Document breaking points

### Phase 4: Endurance Testing
- [ ] Run 24-hour sustained load test
- [ ] Monitor for memory leaks
- [ ] Check resource exhaustion
- [ ] Verify system stability
- [ ] Document long-term performance

## Key Metrics to Monitor

### Performance Metrics
- [ ] Response times (p50, p95, p99)
- [ ] Throughput (requests/second)
- [ ] Error rates
- [ ] Success rates

### Resource Metrics
- [ ] CPU usage
- [ ] Memory usage
- [ ] Network bandwidth
- [ ] Database connections
- [ ] Database query performance

### User Experience Metrics
- [ ] Page load times
- [ ] Time to interactive (TTI)
- [ ] Component render times
- [ ] Search response times

## Critical Test Scenarios

### Product Catalog
- [ ] Load 1,000+ products
- [ ] Search across large dataset
- [ ] Filter by category
- [ ] Switch languages (EN/CH)

### Order Management
- [ ] Submit 10 concurrent orders
- [ ] Submit 50 concurrent orders
- [ ] Submit 100 concurrent orders
- [ ] Order with 50+ items
- [ ] Order with file uploads

### Authentication
- [ ] 50 concurrent sign-ins
- [ ] 100 concurrent sign-ins
- [ ] Sign-in logging performance
- [ ] Session management

### File Uploads
- [ ] Single file (1MB, 10MB, 50MB)
- [ ] Multiple files (5 files)
- [ ] 10 concurrent uploads
- [ ] 50 concurrent uploads

### Database
- [ ] Query performance (1,000 products)
- [ ] Order history queries
- [ ] Concurrent writes
- [ ] Transaction performance

## Success Criteria Checklist

### Performance Targets
- [ ] Product loading < 2s for 1,000 products
- [ ] Search response < 300ms
- [ ] Order submission < 2s
- [ ] Authentication < 2s
- [ ] Image upload < 30s for 10MB
- [ ] API response < 200ms (p95)

### Scalability Targets
- [ ] Support 100+ concurrent users
- [ ] Handle 50+ orders/minute
- [ ] Database queries < 200ms (p95)
- [ ] API throughput 100+ req/s

### Reliability Targets
- [ ] 99.9% availability
- [ ] < 1% error rate under normal load
- [ ] 100% data integrity
- [ ] < 5 minutes recovery time

## Post-Test Activities

- [ ] Analyze test results
- [ ] Identify bottlenecks
- [ ] Document findings
- [ ] Create performance report
- [ ] Share results with team
- [ ] Prioritize optimizations
- [ ] Plan follow-up tests
- [ ] Clean up test data

## Risk Areas to Monitor

- [ ] Database connection pool exhaustion
- [ ] Cloudinary rate limits
- [ ] Supabase rate limits
- [ ] Order transaction deadlocks
- [ ] Session memory leaks
- [ ] File upload failures
- [ ] External service outages

## Tools Checklist

- [ ] k6 installed and configured
- [ ] Artillery installed (optional)
- [ ] Chrome DevTools ready
- [ ] React DevTools ready
- [ ] Supabase Dashboard access
- [ ] Monitoring tools configured
- [ ] Test data generation scripts ready

## Documentation Checklist

- [ ] Test plan documented
- [ ] Test scripts created
- [ ] Baseline metrics recorded
- [ ] Test results saved
- [ ] Performance report created
- [ ] Recommendations documented
- [ ] Next steps identified

---

## Quick Commands

```bash
# Run order submission test
k6 run stress-tests/k6/order-submission.js

# Run product catalog test
k6 run stress-tests/k6/product-catalog.js

# Run with custom load
k6 run --vus 100 --duration 10m stress-tests/k6/order-submission.js

# Run Artillery test
artillery run stress-tests/artillery/load-test.yml
```

---

*Use this checklist to ensure comprehensive stress testing coverage.*

