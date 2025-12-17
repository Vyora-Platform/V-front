-- Migration: Disable RLS on vendors table for performance
-- Purpose: Allow direct queries without RLS overhead
-- Note: Service role queries should bypass RLS, but disabling ensures no evaluation
-- IMPORTANT: Run this when there are no active queries on vendors table

-- ============================================================================
-- STEP 1: DISABLE RLS ON VENDORS TABLE (policies will be automatically dropped)
-- ============================================================================

-- Disable RLS - this will automatically drop all policies
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: DROP ANY REMAINING POLICIES (if they weren't auto-dropped)
-- ============================================================================

DROP POLICY IF EXISTS vendor_isolation_policy ON vendors;
DROP POLICY IF EXISTS vendors_read_own ON vendors;
DROP POLICY IF EXISTS vendors_update_own ON vendors;
DROP POLICY IF EXISTS vendors_insert ON vendors;

-- ============================================================================
-- STEP 3: VERIFY RLS IS DISABLED
-- ============================================================================

-- This query should return false after running the migration
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'vendors';

COMMENT ON TABLE vendors IS 'RLS disabled for performance - service role access only';

