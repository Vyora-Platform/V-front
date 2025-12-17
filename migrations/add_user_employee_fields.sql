-- Migration: Add employee detail fields to users table
-- This migration adds name, phone, department, and job_role columns for admin-created employees

-- Add name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN name text;
        
        COMMENT ON COLUMN users.name IS 'Full name of the user (used for employees)';
    END IF;
END $$;

-- Add phone column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN phone text;
        
        COMMENT ON COLUMN users.phone IS 'Phone number of the user (used for employees)';
    END IF;
END $$;

-- Add department column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'department'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN department text;
        
        COMMENT ON COLUMN users.department IS 'Department/team name (used for employees)';
    END IF;
END $$;

-- Add job_role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'job_role'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN job_role text;
        
        COMMENT ON COLUMN users.job_role IS 'Job title/role (used for employees)';
    END IF;
END $$;

