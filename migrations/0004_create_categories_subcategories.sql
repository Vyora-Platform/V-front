-- Migration: Create categories and subcategories tables
-- Created: 2025-11-13

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  icon_url TEXT,
  created_by TEXT NOT NULL,
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category_id VARCHAR NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  icon_url TEXT,
  created_by TEXT NOT NULL,
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);
CREATE INDEX IF NOT EXISTS idx_categories_is_global ON categories(is_global);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_created_by ON subcategories(created_by);
CREATE INDEX IF NOT EXISTS idx_subcategories_is_global ON subcategories(is_global);

-- Insert some default master categories (global)
INSERT INTO categories (id, name, description, icon, created_by, is_global) VALUES
  ('cat-beauty', 'Beauty & Personal Care', 'Beauty salons, spas, and personal care services', '💄', 'admin', true),
  ('cat-health', 'Health & Wellness', 'Healthcare, fitness, and wellness services', '🏥', 'admin', true),
  ('cat-food', 'Food & Beverage', 'Restaurants, cafes, and food services', '🍽️', 'admin', true),
  ('cat-retail', 'Retail', 'Retail stores and shops', '🛍️', 'admin', true),
  ('cat-automotive', 'Automotive', 'Auto repair, maintenance, and services', '🚗', 'admin', true),
  ('cat-home', 'Home Services', 'Home improvement and maintenance', '🏠', 'admin', true),
  ('cat-education', 'Education', 'Training, tutoring, and educational services', '📚', 'admin', true),
  ('cat-professional', 'Professional Services', 'Legal, accounting, and consulting', '💼', 'admin', true)
ON CONFLICT (id) DO NOTHING;

-- Insert some default subcategories
INSERT INTO subcategories (id, category_id, name, description, icon, created_by, is_global) VALUES
  ('sub-haircut', 'cat-beauty', 'Haircut & Styling', 'Hair cutting and styling services', '✂️', 'admin', true),
  ('sub-massage', 'cat-beauty', 'Massage & Spa', 'Massage and spa treatments', '💆', 'admin', true),
  ('sub-nails', 'cat-beauty', 'Nail Services', 'Manicure and pedicure', '💅', 'admin', true),
  ('sub-gym', 'cat-health', 'Gym & Fitness', 'Fitness centers and gyms', '💪', 'admin', true),
  ('sub-yoga', 'cat-health', 'Yoga & Meditation', 'Yoga and meditation classes', '🧘', 'admin', true),
  ('sub-clinic', 'cat-health', 'Medical Clinic', 'Healthcare clinics', '🏥', 'admin', true),
  ('sub-restaurant', 'cat-food', 'Restaurant', 'Dine-in restaurants', '🍽️', 'admin', true),
  ('sub-cafe', 'cat-food', 'Cafe', 'Coffee shops and cafes', '☕', 'admin', true),
  ('sub-bakery', 'cat-food', 'Bakery', 'Bakeries and confectioneries', '🍰', 'admin', true),
  ('sub-clothing', 'cat-retail', 'Clothing & Fashion', 'Apparel and fashion stores', '👕', 'admin', true),
  ('sub-electronics', 'cat-retail', 'Electronics', 'Electronics and gadgets', '📱', 'admin', true),
  ('sub-grocery', 'cat-retail', 'Grocery', 'Grocery stores', '🛒', 'admin', true)
ON CONFLICT (id) DO NOTHING;

-- Add trigger to update updated_at timestamp for categories
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_updated_at_trigger
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_categories_updated_at();

-- Add trigger to update updated_at timestamp for subcategories
CREATE OR REPLACE FUNCTION update_subcategories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subcategories_updated_at_trigger
BEFORE UPDATE ON subcategories
FOR EACH ROW
EXECUTE FUNCTION update_subcategories_updated_at();

