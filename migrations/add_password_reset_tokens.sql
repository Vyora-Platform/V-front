-- Migration: Add password_reset_tokens table for forgot password feature
-- Run this migration on your Supabase database

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email_otp ON password_reset_tokens(email, otp);

-- Optional: Add a function to auto-cleanup expired tokens (run periodically)
-- You can schedule this using Supabase's pg_cron extension or a scheduled job

-- COMMENT: This table stores OTP tokens for password reset functionality
-- Tokens expire after 10 minutes and are marked as 'used' after successful password reset

