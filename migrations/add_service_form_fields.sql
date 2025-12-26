-- Migration: Add service form fields to vendor_catalogues table
-- Description: Adds duration, pricing, delivery, inventory, and amenity fields to support all service listing form fields

-- Duration Fields
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS duration_type TEXT DEFAULT 'fixed';
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS duration_value TEXT;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS duration_unit TEXT DEFAULT 'minutes';
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS duration_min TEXT;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS duration_max TEXT;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS session_count TEXT;

-- Pricing Type Fields
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS pricing_type TEXT DEFAULT 'per-service';
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS price_min INTEGER;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS price_max INTEGER;
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS package_pricing JSONB DEFAULT '[]'::jsonb;

-- Time Slot Fields
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS time_slot_duration TEXT DEFAULT '30';
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS custom_time_slots TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Delivery Modes
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS delivery_modes TEXT[] DEFAULT ARRAY['business-location']::TEXT[];
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS home_service_charge_type TEXT DEFAULT 'free';
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS home_service_charges JSONB DEFAULT '[]'::jsonb;

-- Inventory Type
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS inventory_type TEXT DEFAULT 'unlimited';
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS inventory_items JSONB DEFAULT '[]'::jsonb;

-- Amenities & Policies
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS custom_amenities TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE vendor_catalogues ADD COLUMN IF NOT EXISTS policies JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN vendor_catalogues.duration_type IS 'Type of duration: fixed, variable, long, session, project';
COMMENT ON COLUMN vendor_catalogues.duration_value IS 'Duration value (number)';
COMMENT ON COLUMN vendor_catalogues.duration_unit IS 'Unit of duration: minutes, hours, days, weeks, months';
COMMENT ON COLUMN vendor_catalogues.duration_min IS 'Minimum duration for variable/project types';
COMMENT ON COLUMN vendor_catalogues.duration_max IS 'Maximum duration for variable/project types';
COMMENT ON COLUMN vendor_catalogues.session_count IS 'Number of sessions for session type';
COMMENT ON COLUMN vendor_catalogues.pricing_type IS 'Type of pricing: per-service, price-range, hourly, daily, weekly, monthly, per-session, per-person, package';
COMMENT ON COLUMN vendor_catalogues.price_min IS 'Minimum price for price-range type';
COMMENT ON COLUMN vendor_catalogues.price_max IS 'Maximum price for price-range type';
COMMENT ON COLUMN vendor_catalogues.package_pricing IS 'Package pricing options as JSON array';
COMMENT ON COLUMN vendor_catalogues.time_slot_duration IS 'Duration of each time slot in minutes';
COMMENT ON COLUMN vendor_catalogues.custom_time_slots IS 'Custom time slots array';
COMMENT ON COLUMN vendor_catalogues.delivery_modes IS 'Array of delivery modes: business-location, home-service';
COMMENT ON COLUMN vendor_catalogues.home_service_charge_type IS 'Type of home service charge: free, paid';
COMMENT ON COLUMN vendor_catalogues.home_service_charges IS 'Home service charges as JSON array';
COMMENT ON COLUMN vendor_catalogues.inventory_type IS 'Type of inventory: limited, unlimited';
COMMENT ON COLUMN vendor_catalogues.inventory_items IS 'Inventory items as JSON array';
COMMENT ON COLUMN vendor_catalogues.amenities IS 'Array of amenity IDs';
COMMENT ON COLUMN vendor_catalogues.custom_amenities IS 'Array of custom amenity names';
COMMENT ON COLUMN vendor_catalogues.policies IS 'Policies as JSON array with title and content';

