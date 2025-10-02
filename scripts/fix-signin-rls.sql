-- Fix RLS policies for sign_in_records table
-- Run this in Supabase SQL Editor

-- First, let's check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'sign_in_records';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own sign-in records" ON sign_in_records;
DROP POLICY IF EXISTS "Service role can insert sign-in records" ON sign_in_records;
DROP POLICY IF EXISTS "Service role can update sign-in records" ON sign_in_records;
DROP POLICY IF EXISTS "Admins can view all sign-in records" ON sign_in_records;

-- Create more permissive policies for testing
-- Allow all authenticated users to view all records (for admin dashboard)
CREATE POLICY "Allow authenticated users to view all sign-in records" ON sign_in_records
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to insert records
CREATE POLICY "Allow authenticated users to insert sign-in records" ON sign_in_records
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to update records
CREATE POLICY "Allow authenticated users to update sign-in records" ON sign_in_records
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Test the policies
SELECT 'RLS policies updated successfully' as status;
