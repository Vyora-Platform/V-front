-- Migration: Ensure all ledger_transactions columns exist
-- This migration adds any missing columns to the ledger_transactions table

-- Add supplier_id column if not exists
ALTER TABLE ledger_transactions 
ADD COLUMN IF NOT EXISTS supplier_id VARCHAR REFERENCES suppliers(id);

-- Add exclude_from_balance column if not exists
ALTER TABLE ledger_transactions 
ADD COLUMN IF NOT EXISTS exclude_from_balance BOOLEAN DEFAULT FALSE;

-- Add is_pos_sale column if not exists
ALTER TABLE ledger_transactions 
ADD COLUMN IF NOT EXISTS is_pos_sale BOOLEAN DEFAULT FALSE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_ledger_supplier_id 
ON ledger_transactions(supplier_id) 
WHERE supplier_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ledger_exclude_balance 
ON ledger_transactions(exclude_from_balance) 
WHERE exclude_from_balance = FALSE;

CREATE INDEX IF NOT EXISTS idx_ledger_pos_sale 
ON ledger_transactions(is_pos_sale) 
WHERE is_pos_sale = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN ledger_transactions.supplier_id IS 'Optional reference to supplier for supplier-related transactions in Hisab Kitab';
COMMENT ON COLUMN ledger_transactions.exclude_from_balance IS 'When true, transaction is shown in ledger but not counted in net balance. Used for POS paid amounts which are product exchanges, not credit/loans.';
COMMENT ON COLUMN ledger_transactions.is_pos_sale IS 'Marks if this transaction originated from a POS sale.';

