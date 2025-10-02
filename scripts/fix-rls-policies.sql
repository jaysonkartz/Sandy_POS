-- Fix RLS policies to allow frontend access to sign_in_records
-- Run this in Supabase SQL Editor

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'sign_in_records';

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own sign-in records" ON sign_in_records;
DROP POLICY IF EXISTS "Service role can insert sign-in records" ON sign_in_records;
DROP POLICY IF EXISTS "Service role can update sign-in records" ON sign_in_records;
DROP POLICY IF EXISTS "Admins can view all sign-in records" ON sign_in_records;
DROP POLICY IF EXISTS "Allow authenticated users to view all sign-in records" ON sign_in_records;
DROP POLICY IF EXISTS "Allow authenticated users to insert sign-in records" ON sign_in_records;
DROP POLICY IF EXISTS "Allow authenticated users to update sign-in records" ON sign_in_records;

-- Create new, more permissive policies for testing
-- Allow all authenticated users to view all records
CREATE POLICY "Allow all authenticated users to view sign-in records" ON sign_in_records
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to insert records
CREATE POLICY "Allow all authenticated users to insert sign-in records" ON sign_in_records
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to update records
CREATE POLICY "Allow all authenticated users to update sign-in records" ON sign_in_records
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Test the policies by trying to select data
SELECT 'RLS policies updated successfully' as status;
SELECT COUNT(*) as total_records FROM sign_in_records;
SELECT email, sign_in_at, success FROM sign_in_records ORDER BY sign_in_at DESC LIMIT 5;
