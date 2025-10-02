-- Insert test sign-in records to verify UI is working
-- Run this in Supabase SQL Editor

-- First, let's check what user IDs exist in auth.users
SELECT id, email FROM auth.users LIMIT 5;

-- Insert test records (replace the user_id values with actual ones from the query above)
INSERT INTO sign_in_records (user_id, email, sign_in_at, ip_address, user_agent, success, device_info, failure_reason)
VALUES 
  -- Get a real user ID from auth.users first, then replace 'REPLACE_WITH_REAL_USER_ID' below
  (
    'REPLACE_WITH_REAL_USER_ID', -- Replace this with actual user ID from auth.users
    'test@example.com',
    NOW() - INTERVAL '1 hour',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    true,
    '{"browser": "Chrome", "os": "Windows", "deviceType": "Desktop"}'::jsonb,
    NULL
  ),
  (
    'REPLACE_WITH_REAL_USER_ID', -- Replace this with actual user ID from auth.users
    'test@example.com',
    NOW() - INTERVAL '2 hours',
    '192.168.1.101',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    false,
    '{"browser": "Chrome", "os": "Windows", "deviceType": "Desktop"}'::jsonb,
    'Invalid password'
  ),
  (
    'REPLACE_WITH_REAL_USER_ID', -- Replace this with actual user ID from auth.users
    'admin@example.com',
    NOW() - INTERVAL '30 minutes',
    '192.168.1.102',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    true,
    '{"browser": "Chrome", "os": "macOS", "deviceType": "Desktop"}'::jsonb,
    NULL
  );

-- Verify the data was inserted
SELECT COUNT(*) as total_records FROM sign_in_records;
SELECT * FROM sign_in_records ORDER BY sign_in_at DESC;
