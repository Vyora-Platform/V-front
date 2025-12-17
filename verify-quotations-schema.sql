-- Verify and add missing columns to quotations and quotation_items tables

-- Check quotations table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quotations' 
ORDER BY ordinal_position;

-- Check quotation_items table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quotation_items' 
ORDER BY ordinal_position;

-- Add missing columns to quotations table if they don't exist
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS mini_website_subdomain TEXT;

-- Add missing columns to quotation_items if they don't exist
ALTER TABLE quotation_items 
ADD COLUMN IF NOT EXISTS item_type TEXT;

ALTER TABLE quotation_items 
ADD COLUMN IF NOT EXISTS item_id VARCHAR;

-- Verify the columns were added
SELECT 'Quotations columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quotations' 
  AND column_name IN ('source', 'mini_website_subdomain')
ORDER BY column_name;

SELECT 'Quotation Items columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quotation_items' 
  AND column_name IN ('item_type', 'item_id')
ORDER BY column_name;

