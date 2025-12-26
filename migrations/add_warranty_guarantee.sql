-- Add warranty and guarantee fields to vendor_products table

ALTER TABLE vendor_products 
ADD COLUMN IF NOT EXISTS has_warranty BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS warranty_duration INTEGER,
ADD COLUMN IF NOT EXISTS warranty_unit TEXT,
ADD COLUMN IF NOT EXISTS has_guarantee BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS guarantee_duration INTEGER,
ADD COLUMN IF NOT EXISTS guarantee_unit TEXT;

-- Add comments
COMMENT ON COLUMN vendor_products.has_warranty IS 'Whether the product has warranty';
COMMENT ON COLUMN vendor_products.warranty_duration IS 'Warranty duration number';
COMMENT ON COLUMN vendor_products.warranty_unit IS 'Warranty duration unit: days, months, years';
COMMENT ON COLUMN vendor_products.has_guarantee IS 'Whether the product has guarantee';
COMMENT ON COLUMN vendor_products.guarantee_duration IS 'Guarantee duration number';
COMMENT ON COLUMN vendor_products.guarantee_unit IS 'Guarantee duration unit: days, months, years';


