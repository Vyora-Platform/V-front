-- Update stock_alerts table to support both products and services

-- First drop the NOT NULL constraint on vendor_product_id
ALTER TABLE stock_alerts 
ALTER COLUMN vendor_product_id DROP NOT NULL;

-- Add vendor_catalogue_id column for services
ALTER TABLE stock_alerts 
ADD COLUMN IF NOT EXISTS vendor_catalogue_id VARCHAR REFERENCES vendor_catalogues(id);

-- Add item_type column to distinguish between product and service alerts
ALTER TABLE stock_alerts 
ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'product';

-- Add index for service alerts
CREATE INDEX IF NOT EXISTS idx_stock_alerts_catalogue_id ON stock_alerts(vendor_catalogue_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_item_type ON stock_alerts(item_type);

