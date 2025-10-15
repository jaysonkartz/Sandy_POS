-- Fix RLS policies for products table to allow variant management
-- Run this in Supabase SQL Editor

-- First, let's check what policies currently exist on the products table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'products';

-- Drop existing restrictive policies (if any)
DROP POLICY IF EXISTS "Users can view products" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Users can delete products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to read products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON products;

-- Create new, permissive policies for products table
-- Allow all authenticated users to read products
CREATE POLICY "Allow authenticated users to read products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to insert products (for variants)
CREATE POLICY "Allow authenticated users to insert products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to update products
CREATE POLICY "Allow authenticated users to update products" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow all authenticated users to delete products
CREATE POLICY "Allow authenticated users to delete products" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Test the policies
SELECT 'RLS policies updated successfully for products table' as status;

-- Test that we can read products
SELECT COUNT(*) as total_products FROM products;

-- Show a few sample products
SELECT id, Product, Variation, price FROM products LIMIT 5;
