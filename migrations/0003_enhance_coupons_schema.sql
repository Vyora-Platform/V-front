-- Migration: Enhance Coupons Schema for POS/Online Order Segregation
-- Date: 2025-11-13
-- Description: Add new fields to support coupon segregation by order source (POS, Online, Mini-Website)
--              and additional criteria like payment methods, time slots, day of week restrictions, etc.

-- Add new columns to coupons table
ALTER TABLE coupons 
  ADD COLUMN IF NOT EXISTS max_discount integer,
  ADD COLUMN IF NOT EXISTS max_usage_per_customer integer,
  ADD COLUMN IF NOT EXISTS applicable_on text DEFAULT 'all' NOT NULL,
  ADD COLUMN IF NOT EXISTS minimum_quantity integer,
  ADD COLUMN IF NOT EXISTS applicable_payment_methods text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS first_order_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS applicable_days_of_week text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS applicable_time_slots json,
  ADD COLUMN IF NOT EXISTS terms_and_conditions text;

-- Add check constraint for applicable_on
ALTER TABLE coupons 
  ADD CONSTRAINT coupons_applicable_on_check 
  CHECK (applicable_on IN ('all', 'pos_only', 'online_only', 'miniwebsite_only'));

-- Add check constraint for applicable_days_of_week values
ALTER TABLE coupons 
  ADD CONSTRAINT coupons_days_of_week_check 
  CHECK (
    applicable_days_of_week <@ ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']::text[]
  );

-- Add check constraint for applicable_payment_methods values
ALTER TABLE coupons 
  ADD CONSTRAINT coupons_payment_methods_check 
  CHECK (
    applicable_payment_methods <@ ARRAY['cash', 'upi', 'card', 'wallet', 'bank_transfer']::text[]
  );

-- Add index for faster filtering by applicable_on
CREATE INDEX IF NOT EXISTS idx_coupons_applicable_on ON coupons(applicable_on);

-- Add index for faster filtering by first_order_only
CREATE INDEX IF NOT EXISTS idx_coupons_first_order_only ON coupons(first_order_only) WHERE first_order_only = true;

-- Add index for faster filtering by status and expiry
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(status, expiry_date) WHERE status = 'active';

-- Add comment for documentation
COMMENT ON COLUMN coupons.applicable_on IS 'Defines where the coupon can be used: all, pos_only, online_only, miniwebsite_only';
COMMENT ON COLUMN coupons.max_discount IS 'Maximum discount amount for percentage-based discounts';
COMMENT ON COLUMN coupons.max_usage_per_customer IS 'Maximum number of times a single customer can use this coupon';
COMMENT ON COLUMN coupons.minimum_quantity IS 'Minimum number of items required in order to apply coupon';
COMMENT ON COLUMN coupons.applicable_payment_methods IS 'Array of allowed payment methods: cash, upi, card, wallet, bank_transfer';
COMMENT ON COLUMN coupons.first_order_only IS 'Whether this coupon is only valid for first-time customers';
COMMENT ON COLUMN coupons.applicable_days_of_week IS 'Array of days when coupon is valid: monday, tuesday, etc.';
COMMENT ON COLUMN coupons.applicable_time_slots IS 'JSON object defining time range: {"start": "09:00", "end": "18:00"}';
COMMENT ON COLUMN coupons.terms_and_conditions IS 'Detailed terms and conditions for the coupon';

