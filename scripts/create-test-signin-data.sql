-- Create test sign-in records
-- Run this in Supabase SQL Editor after creating the table

-- Insert test records based on your existing auth.users data
INSERT INTO sign_in_records (user_id, email, sign_in_at, ip_address, user_agent, success, device_info)
VALUES 
  (
    '314452c8-46c4-4c01-bec1-4c0221a1b2c3', -- Replace with actual user ID from auth.users
    'jc@gmail.com',
    '2025-01-28 12:45:38.821+00',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    true,
    '{"browser": "Chrome", "os": "Windows", "deviceType": "Desktop"}'::jsonb
  ),
  (
    '0b3f7842-9ed9-4398-8e57-4aa7a1b2c3d4', -- Replace with actual user ID from auth.users
    'jcson0417@gmail.com',
    '2025-01-28 12:41:50.518+00',
    '192.168.1.101',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    true,
    '{"browser": "Chrome", "os": "Windows", "deviceType": "Desktop"}'::jsonb
  ),
  (
    '314452c8-46c4-4c01-bec1-4c0221a1b2c3', -- Same user, failed attempt
    'jc@gmail.com',
    '2025-01-28 12:40:00.000+00',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    false,
    '{"browser": "Chrome", "os": "Windows", "deviceType": "Desktop"}'::jsonb,
    'Invalid password'
  );

-- Verify the data was inserted
SELECT COUNT(*) as total_records FROM sign_in_records;
SELECT * FROM sign_in_records ORDER BY sign_in_at DESC;
