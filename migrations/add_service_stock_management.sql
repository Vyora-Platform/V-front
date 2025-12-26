-- Add stock management fields to vendor_catalogues (services)
ALTER TABLE vendor_catalogues 
ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_unit TEXT DEFAULT 'slots',
ADD COLUMN IF NOT EXISTS track_stock BOOLEAN NOT NULL DEFAULT false;

-- Create service_stock_movements table
CREATE TABLE IF NOT EXISTS service_stock_movements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id VARCHAR NOT NULL REFERENCES vendors(id),
  vendor_catalogue_id VARCHAR NOT NULL REFERENCES vendor_catalogues(id),
  
  -- Movement details
  movement_type TEXT NOT NULL, -- 'in', 'out', 'adjustment', 'booking', 'cancellation'
  quantity INTEGER NOT NULL, -- Positive for in, negative for out
  previous_stock INTEGER NOT NULL, -- Stock before movement
  new_stock INTEGER NOT NULL, -- Stock after movement
  
  -- Reference and reason
  reference_type TEXT, -- 'booking', 'manual', 'adjustment'
  reference_id VARCHAR, -- ID of related booking, etc.
  reason TEXT, -- Booked, Cancelled, Added slots, etc.
  notes TEXT,
  
  -- Tracking
  performed_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create service_stock_configs table
CREATE TABLE IF NOT EXISTS service_stock_configs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_catalogue_id VARCHAR NOT NULL REFERENCES vendor_catalogues(id) UNIQUE,
  
  -- Alert thresholds
  minimum_stock INTEGER NOT NULL DEFAULT 5, -- Low stock alert threshold
  reorder_point INTEGER NOT NULL DEFAULT 10, -- Suggested reorder point
  
  -- Notification preferences
  enable_low_stock_alerts BOOLEAN NOT NULL DEFAULT true,
  notification_channels TEXT[] DEFAULT ARRAY['dashboard']::text[],
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_stock_movements_vendor_id ON service_stock_movements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_service_stock_movements_catalogue_id ON service_stock_movements(vendor_catalogue_id);
CREATE INDEX IF NOT EXISTS idx_service_stock_movements_created_at ON service_stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_stock_configs_catalogue_id ON service_stock_configs(vendor_catalogue_id);

-- Add index on vendor_catalogues stock for filtering
CREATE INDEX IF NOT EXISTS idx_vendor_catalogues_stock ON vendor_catalogues(stock) WHERE track_stock = true;

