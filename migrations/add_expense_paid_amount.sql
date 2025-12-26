-- Migration: Add paid_amount column to expenses table for partial payments
-- Date: 2024-12-26

-- Add paid_amount column for tracking partial payments
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS paid_amount INTEGER DEFAULT 0;

-- Update existing 'pending' status to 'unpaid' for consistency
UPDATE expenses SET status = 'unpaid' WHERE status = 'pending';

-- Add comment for clarity
COMMENT ON COLUMN expenses.paid_amount IS 'Amount paid so far for partially paid expenses';
COMMENT ON COLUMN expenses.status IS 'Payment status: paid, unpaid, or partially_paid';

