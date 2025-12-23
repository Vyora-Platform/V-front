-- Migration: Add MNC-level product fields
-- This migration adds new fields to master_products and vendor_products tables

-- Add new fields to master_products table
ALTER TABLE master_products 
ADD COLUMN IF NOT EXISTS mrp INTEGER,
ADD COLUMN IF NOT EXISTS selling_price INTEGER,
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '{}'::jsonb;

-- Add new fields to vendor_products table
ALTER TABLE vendor_products 
ADD COLUMN IF NOT EXISTS mrp INTEGER,
ADD COLUMN IF NOT EXISTS selling_price INTEGER,
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN master_products.mrp IS 'Maximum Retail Price in rupees';
COMMENT ON COLUMN master_products.selling_price IS 'Selling price including taxes in rupees';
COMMENT ON COLUMN master_products.variants IS 'JSON object with variant options: size, color, material, style, packSize arrays';

COMMENT ON COLUMN vendor_products.mrp IS 'Maximum Retail Price in rupees';
COMMENT ON COLUMN vendor_products.selling_price IS 'Selling price including taxes in rupees';
COMMENT ON COLUMN vendor_products.variants IS 'JSON object with variant options: size, color, material, style, packSize arrays';

-- Create index for faster variant searches (optional, for future use)
CREATE INDEX IF NOT EXISTS idx_master_products_variants ON master_products USING GIN (variants);
CREATE INDEX IF NOT EXISTS idx_vendor_products_variants ON vendor_products USING GIN (variants);




