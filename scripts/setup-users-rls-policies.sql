-- Setup RLS policies for users table to allow admins to change user roles
-- Run this in Supabase SQL Editor

-- First, check if RLS is enabled on users table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "All authenticated users can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update user roles" ON users;
DROP POLICY IF EXISTS "All authenticated users can update user roles" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to view users" ON users;
DROP POLICY IF EXISTS "Allow admins to update users" ON users;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2: All authenticated users can view all users (for user management)
CREATE POLICY "All authenticated users can view all users" ON users
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy 3: All authenticated users can update user roles (allow customers to change roles too)
CREATE POLICY "All authenticated users can update user roles" ON users
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy 4: (Optional) Allow users to update their own profile fields
-- Note: This is optional if users only update their profile through other tables (like customers)
-- Uncomment if needed:
-- CREATE POLICY "Users can update own profile" ON users
--   FOR UPDATE 
--   USING (auth.uid() = id)
--   WITH CHECK (
--     auth.uid() = id
--     -- This policy allows updates, but Policy 3 above takes precedence for admins
--   );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Test query to verify admin can view users
-- Replace 'your-admin-user-id' with an actual admin user ID for testing
-- SELECT id, email, role FROM users WHERE role = 'ADMIN' LIMIT 1;

