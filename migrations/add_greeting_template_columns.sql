-- Migration: Add missing columns to greeting_templates table
-- These columns are defined in schema.ts but missing from the original migration

-- First, create poster_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS poster_categories (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    icon text NOT NULL,
    description text,
    color text NOT NULL DEFAULT '#3B82F6',
    sort_order integer NOT NULL DEFAULT 0,
    is_upcoming boolean NOT NULL DEFAULT false,
    event_date timestamp,
    status text NOT NULL DEFAULT 'active',
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Add category_id column for poster category reference
ALTER TABLE greeting_templates 
ADD COLUMN IF NOT EXISTS category_id varchar REFERENCES poster_categories(id);

-- Add tags column for search functionality
ALTER TABLE greeting_templates 
ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT ARRAY[]::text[];

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_greeting_templates_category_id ON greeting_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_greeting_templates_tags ON greeting_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_poster_categories_status ON poster_categories(status);
