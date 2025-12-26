-- Migration: Add supplierId to ledger_transactions
-- Purpose: Support supplier ledger transactions in Hisab Kitab module

-- Add supplierId column to ledger_transactions table
ALTER TABLE ledger_transactions 
ADD COLUMN IF NOT EXISTS supplier_id VARCHAR REFERENCES suppliers(id);

-- Create index for faster supplier lookups
CREATE INDEX IF NOT EXISTS idx_ledger_supplier_id 
ON ledger_transactions(supplier_id) 
WHERE supplier_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN ledger_transactions.supplier_id IS 'Optional reference to supplier for supplier-related transactions in Hisab Kitab';



