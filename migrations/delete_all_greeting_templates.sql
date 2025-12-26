-- Migration: Delete all existing greeting templates
-- This migration clears all templates so admin can create fresh ones

-- First delete template usage records
DELETE FROM greeting_template_usage;

-- Then delete all greeting templates
DELETE FROM greeting_templates;

-- Reset download and share counts (for any future templates)
-- Confirmation message
SELECT 'All greeting templates have been deleted successfully' as status;

