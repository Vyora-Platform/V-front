-- Migration: Fix POS credit/due transactions type
-- Purpose: Credit/due amounts from POS sales should be type='in' (receivable) not type='out'
-- This ensures positive balance = "You will GET" when customer owes money
-- 
-- Balance Logic:
-- - balance = totalIn - totalOut (where excludeFromBalance = false)
-- - balance > 0 = "You will GET" (customer owes you)
-- - balance < 0 = "You will GIVE" (you owe customer)
-- 
-- Credit Sale Logic:
-- - When customer buys on credit, they OWE us money → should show "You will GET"
-- - For positive balance, we need more "in" than "out"
-- - Therefore, credit/due amounts should be type='in' (as receivables)
-- 
-- Transaction Types:
-- - POS Paid Amount: type='in', excludeFromBalance=true (product exchange - not a debt)
-- - POS Due Amount: type='in', excludeFromBalance=false (receivable - customer owes this)

-- Fix existing POS credit/due transactions that were incorrectly recorded as 'out'
-- These should be 'in' (receivable - money to be received from customer)
UPDATE ledger_transactions 
SET type = 'in',
    category = 'product_sale',
    description = REPLACE(description, 'Credit/Due', 'Credit Due')
WHERE is_pos_sale = TRUE 
  AND type = 'out'
  AND (description LIKE 'Credit/Due%' OR description LIKE 'Credit Due%' OR description LIKE 'Remaining payment%')
  AND payment_method = 'credit'
  AND exclude_from_balance = FALSE;

-- Also update any similar entries that might have been created with category='other'
UPDATE ledger_transactions 
SET type = 'in',
    category = 'product_sale'
WHERE category = 'other'
  AND type = 'out'
  AND payment_method = 'credit'
  AND (description LIKE '%Bill%' AND (description LIKE '%Credit%' OR description LIKE '%Due%'))
  AND exclude_from_balance = FALSE;

-- Add comment explaining the logic
COMMENT ON TABLE ledger_transactions IS 'Ledger transactions for Hisab Kitab module. 
type=in: Money received OR receivable (customer owes us - shown as "You will GET")
type=out: Money paid OR payable (we owe someone - shown as "You will GIVE")
excludeFromBalance: When true, shown in ledger but not counted in net balance (e.g., POS paid amounts are product exchange)
isPOSSale: Marks transactions from POS module';

