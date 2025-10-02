-- Simple test data with explicit dates
-- Run this in Supabase SQL Editor

-- Clear existing test data first
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_name LIKE '%Test%' OR customer_name IN ('John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Wong', 'Charlie Brown', 'David Lee', 'Emma Tan'));
DELETE FROM orders WHERE customer_name IN ('John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Wong', 'Charlie Brown', 'David Lee', 'Emma Tan');

-- Insert orders with explicit dates
INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_amount, status, created_at)
VALUES 
  (
    (SELECT id FROM auth.users LIMIT 1),
    'John Doe',
    '+65 9123 4567',
    '123 Main Street, Singapore',
    150.00,
    'completed',
    '2024-12-15 10:00:00+00'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Jane Smith',
    '+65 9876 5432',
    '456 Orchard Road, Singapore',
    200.50,
    'completed',
    '2024-11-20 14:30:00+00'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Bob Johnson',
    '+65 8765 4321',
    '789 Marina Bay, Singapore',
    75.25,
    'pending',
    '2024-10-10 09:15:00+00'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Alice Wong',
    '+65 9123 1111',
    '100 Orchard Road, Singapore',
    120.00,
    'completed',
    '2024-09-05 16:45:00+00'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Charlie Brown',
    '+65 9123 2222',
    '200 Marina Bay, Singapore',
    180.75,
    'completed',
    '2024-08-15 11:20:00+00'
  );

-- Insert order items for these orders
INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
VALUES 
  (1, 1, 2, 50.00, 100.00, 'Dried Chilli', 'CH001'),
  (1, 2, 1, 50.00, 50.00, 'Dried Mushrooms', 'MU001'),
  (2, 1, 3, 45.00, 135.00, 'Dried Chilli', 'CH001'),
  (2, 3, 2, 32.75, 65.50, 'Dried Fruits', 'FR001'),
  (3, 2, 1, 50.00, 50.00, 'Dried Mushrooms', 'MU001'),
  (3, 4, 1, 25.25, 25.25, 'Herbs & Spices', 'HS001'),
  (4, 1, 2, 60.00, 120.00, 'Dried Chilli', 'CH001'),
  (5, 2, 3, 60.25, 180.75, 'Dried Mushrooms', 'MU001');

-- Verify the data
SELECT 'Orders created:' as info, COUNT(*) as count FROM orders;
SELECT 'Order items created:' as info, COUNT(*) as count FROM order_items;

-- Show the months that should be available
SELECT 
  TO_CHAR(created_at, 'Month YYYY') as month_year,
  COUNT(*) as order_count
FROM orders 
GROUP BY TO_CHAR(created_at, 'Month YYYY')
ORDER BY created_at DESC;
