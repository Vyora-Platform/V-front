-- Migration: Add missing payment columns to appointments table
-- Run this on your Supabase database SQL Editor

-- ============================================
-- ADD MISSING PAYMENT COLUMNS TO APPOINTMENTS
-- ============================================

-- Payment status tracking
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Base consultation fee
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_fee INTEGER;

-- Additional charges as JSON array (e.g., [{name: 'X-Ray', amount: 500}])
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS additional_charges JSONB DEFAULT '[]'::jsonb;

-- Total amount including all charges
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_amount INTEGER;

-- Source of appointment (manual, miniwebsite, pos, app)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify columns were added:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'appointments';





