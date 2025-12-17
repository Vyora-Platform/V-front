-- Migration: Add module_permissions and password_hash columns to users table
-- This migration adds support for employee role-based access control

-- Add password_hash column if it doesn't exist (for JWT auth)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN password_hash text;
        
        COMMENT ON COLUMN users.password_hash IS 'Hashed password for JWT authentication (nullable for Supabase Auth users)';
    END IF;
END $$;

-- Add module_permissions column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'module_permissions'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN module_permissions jsonb DEFAULT '[]'::jsonb NOT NULL;
        
        COMMENT ON COLUMN users.module_permissions IS 'Array of module IDs that employee can access (stored as JSONB array)';
        
        -- Update existing rows to have empty array
        UPDATE users SET module_permissions = '[]'::jsonb WHERE module_permissions IS NULL;
    END IF;
END $$;

