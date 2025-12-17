-- Migration: Auto-Approve All Vendors
-- Description: Update vendor status from "pending" to "approved"
-- Date: 2025-11-10
-- Reason: Enable auto-approval for vendors after onboarding

-- 1. Check current status distribution
SELECT 
  status,
  COUNT(*) as vendor_count
FROM vendors 
GROUP BY status
ORDER BY vendor_count DESC;

-- 2. Update all pending vendors to approved
UPDATE vendors 
SET 
  status = 'approved',
  updated_at = NOW()
WHERE status = 'pending';

-- 3. Verify the update
SELECT 
  id,
  business_name,
  status,
  onboarding_complete,
  created_at,
  updated_at
FROM vendors 
WHERE status = 'approved'
ORDER BY updated_at DESC;

-- 4. Final status count
SELECT 
  status,
  COUNT(*) as vendor_count
FROM vendors 
GROUP BY status;

-- Expected result: All vendors should have status = 'approved'

