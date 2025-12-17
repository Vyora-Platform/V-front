-- Migration: Add Additional Services tables
-- This migration creates tables for premium services that vendors can purchase

-- Additional Services table
CREATE TABLE IF NOT EXISTS additional_services (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  short_description text,
  icon text NOT NULL DEFAULT '💼',
  category text,
  price integer,
  features text[] DEFAULT ARRAY[]::text[],
  benefits text[] DEFAULT ARRAY[]::text[],
  images text[] DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_by varchar REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Additional Service Inquiries table
CREATE TABLE IF NOT EXISTS additional_service_inquiries (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  service_id varchar NOT NULL REFERENCES additional_services(id),
  vendor_id varchar NOT NULL REFERENCES vendors(id),
  vendor_name text NOT NULL,
  vendor_email text NOT NULL,
  vendor_phone text NOT NULL,
  vendor_whatsapp text,
  business_name text,
  requirement text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  contacted_at timestamp,
  completed_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_additional_services_active ON additional_services(is_active);
CREATE INDEX IF NOT EXISTS idx_additional_service_inquiries_service ON additional_service_inquiries(service_id);
CREATE INDEX IF NOT EXISTS idx_additional_service_inquiries_vendor ON additional_service_inquiries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_additional_service_inquiries_status ON additional_service_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_additional_service_inquiries_created ON additional_service_inquiries(created_at DESC);

-- Add comments
COMMENT ON TABLE additional_services IS 'Premium services created by admin for vendors to purchase';
COMMENT ON TABLE additional_service_inquiries IS 'Vendor inquiries for additional services';

