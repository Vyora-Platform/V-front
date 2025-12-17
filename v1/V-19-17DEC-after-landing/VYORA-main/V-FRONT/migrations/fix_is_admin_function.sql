-- Migration: Fix is_admin() function to check app.role session variable
-- This allows RLS policies to work correctly with our security context system

-- Update is_admin() function to check app.role session variable instead of current_role()
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT COALESCE(current_setting('app.role', true), '') = 'admin';
$$ LANGUAGE SQL STABLE;

