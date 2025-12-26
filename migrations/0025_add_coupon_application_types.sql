-- Migration: Add new coupon application types
-- Date: 2025-12-24
-- Description: Add 'all_products' and 'all_services' as new valid application type values for coupons

-- Update the comment on the application_type column to reflect new valid values
COMMENT ON COLUMN coupons.application_type IS 'Defines what the coupon applies to: all, all_products, all_services, specific_services, specific_products, specific_category';

-- Note: The application_type column is a text field without constraints, so no schema changes are needed.
-- This migration is for documentation purposes and to ensure consistency.

-- If there was a check constraint on application_type, we would update it here:
-- ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_application_type_check;
-- ALTER TABLE coupons ADD CONSTRAINT coupons_application_type_check 
--   CHECK (application_type IN ('all', 'all_products', 'all_services', 'specific_services', 'specific_products', 'specific_category'));


