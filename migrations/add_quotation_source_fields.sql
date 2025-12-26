-- Add source tracking fields to quotations table for mini-website integration
-- These fields track where the quotation request came from

-- Add source column to track origin of quotation
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'manual';

-- Add mini_website_subdomain column to track which mini-website the quotation came from
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "mini_website_subdomain" text;

-- Create an index for faster filtering by source
CREATE INDEX IF NOT EXISTS "idx_quotations_source" ON "quotations" ("source");

-- Create an index for faster filtering by vendor_id and source
CREATE INDEX IF NOT EXISTS "idx_quotations_vendor_source" ON "quotations" ("vendor_id", "source");

