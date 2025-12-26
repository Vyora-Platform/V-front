-- Migration: Add missing fields to vendor_catalogues table
-- This migration adds all the new fields defined in the schema

-- Duration Fields
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS duration_type text DEFAULT 'fixed';
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS duration_value text;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS duration_unit text DEFAULT 'minutes';
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS duration_min text;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS duration_max text;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS session_count text;

-- Description Fields
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS detailed_description text;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS benefits text[] DEFAULT ARRAY[]::text[];
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS features text[] DEFAULT ARRAY[]::text[];
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS highlights text[] DEFAULT ARRAY[]::text[];

-- Pricing Fields
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS pricing_type text DEFAULT 'per-service';
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS price_min integer;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS price_max integer;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS package_pricing jsonb DEFAULT '[]'::jsonb;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS time_slot_duration text DEFAULT '30';
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS custom_time_slots text[] DEFAULT ARRAY[]::text[];
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS gst_included boolean DEFAULT false;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS booking_required boolean DEFAULT false;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS free_trial_available boolean DEFAULT false;

-- Delivery Modes
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS delivery_modes text[] DEFAULT ARRAY['business-location']::text[];
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS home_service_charge_type text DEFAULT 'free';
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS home_service_charges jsonb DEFAULT '[]'::jsonb;

-- Inventory Type
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS inventory_type text DEFAULT 'unlimited';
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS inventory_items jsonb DEFAULT '[]'::jsonb;

-- Package Details
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS package_name text;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS package_type text;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS package_duration text;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS package_sessions integer;

-- Media Fields
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS thumbnail_image text;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS banner_image text;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS promotional_caption text;

-- Amenities & Policies
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT ARRAY[]::text[];
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS custom_amenities text[] DEFAULT ARRAY[]::text[];
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS policies jsonb DEFAULT '[]'::jsonb;

-- Linked Modules
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS linked_offers text[] DEFAULT ARRAY[]::text[];
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS linked_products text[] DEFAULT ARRAY[]::text[];
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS linked_packages text[] DEFAULT ARRAY[]::text[];

-- Service Type and Custom Unit (if not exists)
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS service_type text DEFAULT 'one-time';
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS custom_unit text;

-- Category and Subcategory IDs (if not exists)
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS category_id varchar;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS subcategory_id varchar;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS subcategory text;

-- Available Days and Time Slots (if not exists)
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS available_days text[] DEFAULT ARRAY[]::text[];
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS available_time_slots text[] DEFAULT ARRAY[]::text[];

-- Offer Price (if not exists)
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS offer_price integer;

-- Tax Percentage (if not exists)
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS tax_percentage integer DEFAULT 0;

-- Images (if not exists)
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS images text[] DEFAULT ARRAY[]::text[];

-- Confirmation message
SELECT 'Vendor catalogues table updated with all new fields' as status;

