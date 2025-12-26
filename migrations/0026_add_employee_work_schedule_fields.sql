-- Migration: Add employee work schedule fields
-- Date: 2025-12-24
-- Description: Add shift AM/PM period fields and work days per month

-- Add new columns to employees table
ALTER TABLE employees 
  ADD COLUMN IF NOT EXISTS shift_start_period text,
  ADD COLUMN IF NOT EXISTS shift_end_period text,
  ADD COLUMN IF NOT EXISTS work_days_per_month integer;

-- Add comments for documentation
COMMENT ON COLUMN employees.shift_start_period IS 'AM or PM for shift start time';
COMMENT ON COLUMN employees.shift_end_period IS 'AM or PM for shift end time';
COMMENT ON COLUMN employees.work_days_per_month IS 'Number of working days per month for the employee';


