-- Fix existing data and add test data across multiple months
-- Run this in Supabase SQL Editor

-- First, let's check the current data
SELECT 'Current orders count:' as info, COUNT(*) as count FROM orders;
SELECT 'Current order items count:' as info, COUNT(*) as count FROM order_items;

-- Check if there are any issues with the orders table
SELECT id, customer_name, created_at, status FROM orders ORDER BY created_at DESC LIMIT 5;

-- Update existing orders to have proper dates across different months
UPDATE orders 
SET created_at = '2024-12-15 10:00:00+00'
WHERE customer_name = 'Bob Johnson';

UPDATE orders 
SET created_at = '2024-11-20 14:30:00+00'
WHERE customer_name = 'Jane Smith';

UPDATE orders 
SET created_at = '2024-10-10 09:15:00+00'
WHERE customer_name = 'Jay';

-- Add more orders for different months
INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_amount, status, created_at)
VALUES 
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
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'David Lee',
    '+65 9123 3333',
    '300 Sentosa, Singapore',
    95.50,
    'completed',
    '2024-07-10 13:30:00+00'
  );

-- Get the order IDs for the updated orders
SELECT id, customer_name, created_at FROM orders ORDER BY created_at DESC;

-- Add order items for all orders (using the actual order IDs)
-- Note: You'll need to replace the order_id values with the actual IDs from the query above
INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 
  o.id,
  1,
  2,
  50.00,
  100.00,
  'Dried Chilli',
  'CH001'
FROM orders o 
WHERE o.customer_name = 'Bob Johnson'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id);

INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 
  o.id,
  2,
  1,
  50.00,
  50.00,
  'Dried Mushrooms',
  'MU001'
FROM orders o 
WHERE o.customer_name = 'Jane Smith'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id);

INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 
  o.id,
  3,
  2,
  37.625,
  75.25,
  'Dried Fruits',
  'FR001'
FROM orders o 
WHERE o.customer_name = 'Jay'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id);

INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 
  o.id,
  1,
  2,
  60.00,
  120.00,
  'Dried Chilli',
  'CH001'
FROM orders o 
WHERE o.customer_name = 'Alice Wong'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id);

INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 
  o.id,
  2,
  3,
  60.25,
  180.75,
  'Dried Mushrooms',
  'MU001'
FROM orders o 
WHERE o.customer_name = 'Charlie Brown'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id);

INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 
  o.id,
  4,
  2,
  47.75,
  95.50,
  'Herbs & Spices',
  'HS001'
FROM orders o 
WHERE o.customer_name = 'David Lee'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id);

-- Verify the final data
SELECT 'Final orders count:' as info, COUNT(*) as count FROM orders;
SELECT 'Final order items count:' as info, COUNT(*) as count FROM order_items;

-- Show the months that should now be available
SELECT 
  TO_CHAR(created_at, 'Month YYYY') as month_year,
  COUNT(*) as order_count
FROM orders 
GROUP BY TO_CHAR(created_at, 'Month YYYY')
ORDER BY created_at DESC;

-- Show sample order items
SELECT 
  oi.id,
  oi.order_id,
  oi.product_name,
  oi.quantity,
  oi.price,
  o.total_amount,
  o.customer_name,
  o.created_at
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
ORDER BY o.created_at DESC
LIMIT 10;
