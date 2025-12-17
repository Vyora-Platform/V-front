-- Simple SQL to disable RLS on vendors table
-- Run this directly in your Supabase SQL editor or psql

-- Disable RLS (this automatically drops all policies)
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'vendors';

-- Should show: rowsecurity = false

