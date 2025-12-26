-- Migration: Fix ledger balance calculation logic
-- Purpose: Align ledger transactions with Khatabook-style accounting
-- 
-- NEW Balance Logic (Khatabook style):
-- For CUSTOMERS:
--   - "You Gave" (type=out) = Credit given to customer = Customer owes you MORE
--   - "You Got" (type=in) = Payment received from customer = Customer owes you LESS
--   - Balance = totalOut - totalIn (what customer owes you)
--   - balance > 0 = "You will GET" (customer owes you)
--   - balance < 0 = "You will GIVE" (you owe customer, e.g., advance taken)
--
-- For SUPPLIERS:
--   - "You Paid" (type=out) = Payment to supplier = Reduces what you owe
--   - "You Got" (type=in) = Goods/credit received = Increases what you owe
--   - Balance = totalIn - totalOut (what you owe supplier)
--   - balance > 0 = "You will GIVE" (you owe supplier)
--   - balance < 0 = "You will GET" (supplier owes you, e.g., advance paid)
--
-- POS Credit Sale Transactions:
--   - Credit/due amount should be type='out' (You Gave credit to customer)
--   - This makes balance positive = "You will GET" = correct!
--   - Paid amount stays as type='in' with excludeFromBalance=true (product exchange)
--
-- This migration fixes POS credit transactions that were incorrectly recorded as type='in'
-- They should be type='out' to correctly show "You will GET"

-- Fix POS credit/due transactions that were recorded as 'in' to 'out'
-- These represent credit given to customer, so they should be type='out'
UPDATE ledger_transactions 
SET type = 'out',
    updated_at = NOW()
WHERE customer_id IS NOT NULL
  AND is_pos_sale = TRUE 
  AND type = 'in'
  AND payment_method = 'credit'
  AND exclude_from_balance = FALSE
  AND (description LIKE 'Credit Due%' OR description LIKE 'Credit/Due%' OR description LIKE '%Pending payment%');

-- Update table comment with new logic
COMMENT ON TABLE ledger_transactions IS 'Ledger transactions for Hisab Kitab module (Khatabook style).

CUSTOMER LEDGER:
  type=out ("You Gave"): Credit given, customer owes MORE → positive balance = "You will GET"
  type=in ("You Got"): Payment received, customer owes LESS → reduces balance
  Balance = totalOut - totalIn

SUPPLIER LEDGER:
  type=in ("You Got"): Goods/credit received, you owe MORE → positive balance = "You will GIVE"
  type=out ("You Paid"): Payment made, you owe LESS → reduces balance
  Balance = totalIn - totalOut

excludeFromBalance: When true, shown in ledger but not counted in net balance
  - Used for POS paid amounts (product exchange - money received for goods, no debt created)
  
isPOSSale: Marks transactions from POS module for tracking';

