-- Check and fix products table structure for variant management
-- Run this in Supabase SQL Editor

-- First, let's check the current structure of the products table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Check if the id column is properly set as SERIAL
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'id';

-- If the id column is not SERIAL, fix it
-- (Only run this if the above query shows the id column is not SERIAL)
-- ALTER TABLE products ALTER COLUMN id SET DEFAULT nextval('products_id_seq');

-- Check if the sequence exists
SELECT sequence_name, last_value 
FROM information_schema.sequences 
WHERE sequence_name LIKE '%products%';

-- If sequence doesn't exist, create it
-- CREATE SEQUENCE IF NOT EXISTS products_id_seq;
-- ALTER TABLE products ALTER COLUMN id SET DEFAULT nextval('products_id_seq');

-- Check current RLS policies on products table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'products';

-- Test inserting a sample product to see if it works
-- (This will be rolled back, so it's safe to test)
BEGIN;
INSERT INTO products (Product, Variation, price, stock_quantity, UOM, Category, Country) 
VALUES ('Test Product', 'Test Variation', 10.00, 100, 'kg', 1, 1);
ROLLBACK;

-- Show the current products count
SELECT COUNT(*) as total_products FROM products;

-- Show sample products
SELECT id, Product, Variation, price FROM products LIMIT 5;
