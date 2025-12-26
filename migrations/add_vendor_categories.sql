-- Add selected categories and subcategories columns to vendors table
-- These store the IDs of categories/subcategories selected during onboarding

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS selected_categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS selected_subcategories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS referred_by VARCHAR;

-- Add index for referral lookups
CREATE INDEX IF NOT EXISTS idx_vendors_referred_by ON vendors(referred_by);

-- Comment on columns
COMMENT ON COLUMN vendors.selected_categories IS 'Array of category IDs selected during onboarding - used to filter product form options';
COMMENT ON COLUMN vendors.selected_subcategories IS 'Array of subcategory IDs selected during onboarding - used to filter product form options';
COMMENT ON COLUMN vendors.referred_by IS 'Vendor ID who referred this vendor during signup';


