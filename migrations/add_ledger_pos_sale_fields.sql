-- Migration: Add POS sale tracking fields to ledger_transactions
-- Purpose: Track POS sales and exclude paid amounts from balance calculation
-- Only unpaid/credit amounts should affect net balance in Hisab Kitab

-- Add excludeFromBalance field
-- When true, this transaction is shown in ledger but NOT counted in net balance
-- Used for POS paid amounts (product exchange) - only due/credit amounts affect balance
ALTER TABLE ledger_transactions 
ADD COLUMN IF NOT EXISTS exclude_from_balance BOOLEAN DEFAULT FALSE;

-- Add isPOSSale field to mark transactions originating from POS
ALTER TABLE ledger_transactions 
ADD COLUMN IF NOT EXISTS is_pos_sale BOOLEAN DEFAULT FALSE;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_ledger_exclude_balance 
ON ledger_transactions(exclude_from_balance) 
WHERE exclude_from_balance = FALSE;

CREATE INDEX IF NOT EXISTS idx_ledger_pos_sale 
ON ledger_transactions(is_pos_sale) 
WHERE is_pos_sale = TRUE;

-- Update existing POS product_sale transactions to be excluded from balance
-- This is a one-time fix for existing data
UPDATE ledger_transactions 
SET exclude_from_balance = TRUE, is_pos_sale = TRUE 
WHERE category = 'product_sale' 
  AND type = 'in' 
  AND (description LIKE 'POS Sale%' OR description LIKE 'POS Bill%');

-- Mark existing credit/due entries from POS as POS sales but keep them in balance
UPDATE ledger_transactions 
SET is_pos_sale = TRUE, exclude_from_balance = FALSE 
WHERE (description LIKE 'Credit/Due%' OR description LIKE 'Remaining payment%')
  AND type = 'out';

COMMENT ON COLUMN ledger_transactions.exclude_from_balance IS 'When true, transaction is shown in ledger but not counted in net balance calculation. Used for POS paid amounts which are product exchanges, not credit/loans.';
COMMENT ON COLUMN ledger_transactions.is_pos_sale IS 'Marks if this transaction originated from a POS sale.';

