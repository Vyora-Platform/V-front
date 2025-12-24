-- Migration: Fix missing columns in appointments and bookings tables
-- Run this COMPLETE migration on your Supabase database SQL Editor

-- ============================================
-- FIX BOOKINGS TABLE - ALL MISSING COLUMNS
-- ============================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS time_slot TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS additional_charges JSONB DEFAULT '[]'::jsonb;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS home_collection_charges INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_home_collection BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS collection_address TEXT;

-- ============================================
-- FIX APPOINTMENTS TABLE - ALL MISSING COLUMNS
-- ============================================

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_id VARCHAR;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_address TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_id VARCHAR;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS visit_type TEXT DEFAULT 'first_visit';

-- ============================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email_otp ON password_reset_tokens(email, otp);

