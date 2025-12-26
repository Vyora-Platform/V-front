-- Migration: Add warranty and guaranty columns to vendor_products table
-- Date: 2025-12-24
-- Description: Add warranty and guaranty tracking fields for products

-- Add warranty fields
ALTER TABLE vendor_products 
  ADD COLUMN IF NOT EXISTS has_warranty BOOLEAN DEFAULT false;

ALTER TABLE vendor_products 
  ADD COLUMN IF NOT EXISTS warranty_duration INTEGER;

ALTER TABLE vendor_products 
  ADD COLUMN IF NOT EXISTS warranty_unit TEXT;

-- Add guaranty fields  
ALTER TABLE vendor_products 
  ADD COLUMN IF NOT EXISTS has_guarantee BOOLEAN DEFAULT false;

ALTER TABLE vendor_products 
  ADD COLUMN IF NOT EXISTS guarantee_duration INTEGER;

ALTER TABLE vendor_products 
  ADD COLUMN IF NOT EXISTS guarantee_unit TEXT;

-- Add comments for documentation
COMMENT ON COLUMN vendor_products.has_warranty IS 'Whether this product has a warranty';
COMMENT ON COLUMN vendor_products.warranty_duration IS 'Duration of warranty (number)';
COMMENT ON COLUMN vendor_products.warranty_unit IS 'Unit of warranty duration: days, months, years';
COMMENT ON COLUMN vendor_products.has_guarantee IS 'Whether this product has a guarantee';
COMMENT ON COLUMN vendor_products.guarantee_duration IS 'Duration of guarantee (number)';
COMMENT ON COLUMN vendor_products.guarantee_unit IS 'Unit of guarantee duration: days, months, years';


