-- Migration: Add missing columns to mini_websites table
-- Date: 2025-12-22
-- Description: Adds social_media and trust_numbers columns that were missing from the database

-- Add social_media column (JSON for social media links)
ALTER TABLE mini_websites 
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT NULL;

-- Add trust_numbers column (JSON for trust numbers display)
ALTER TABLE mini_websites 
ADD COLUMN IF NOT EXISTS trust_numbers JSONB DEFAULT NULL;

-- Add any other potentially missing columns
ALTER TABLE mini_websites 
ADD COLUMN IF NOT EXISTS ecommerce JSONB DEFAULT NULL;

ALTER TABLE mini_websites 
ADD COLUMN IF NOT EXISTS lead_form JSONB DEFAULT NULL;

ALTER TABLE mini_websites 
ADD COLUMN IF NOT EXISTS seo JSONB DEFAULT NULL;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mini_websites' 
AND column_name IN ('social_media', 'trust_numbers', 'ecommerce', 'lead_form', 'seo');

