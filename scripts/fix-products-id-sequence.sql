-- Fix products table ID sequence issue
-- Run this in Supabase SQL Editor

-- First, let's check the current state of the products table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Check if there's a sequence for the products table
SELECT sequence_name, last_value 
FROM information_schema.sequences 
WHERE sequence_name LIKE '%products%';

-- Check the current maximum ID in the products table
SELECT MAX(id) as max_id FROM products;

-- If the sequence doesn't exist or is not properly linked, fix it
-- Step 1: Create the sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS products_id_seq;

-- Step 2: Set the sequence to start from the current max ID + 1
SELECT setval('products_id_seq', COALESCE(MAX(id), 0) + 1) FROM products;

-- Step 3: Set the default value for the id column
ALTER TABLE products ALTER COLUMN id SET DEFAULT nextval('products_id_seq');

-- Step 4: Make sure the id column is NOT NULL (it should be already)
ALTER TABLE products ALTER COLUMN id SET NOT NULL;

-- Test the sequence by checking what the next value would be
SELECT nextval('products_id_seq') as next_id;

-- Test inserting a sample product (this will be rolled back)
BEGIN;
INSERT INTO products (Product, Variation, price, stock_quantity, UOM, Category, Country) 
VALUES ('Test Product', 'Test Variation', 10.00, 100, 'kg', 1, 1)
RETURNING id, Product, Variation;
ROLLBACK;

-- Show current products count and sample data
SELECT COUNT(*) as total_products FROM products;
SELECT id, Product, Variation, price FROM products ORDER BY id DESC LIMIT 5;
