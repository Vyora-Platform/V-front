-- Add customerId column to orders table for simple customer-vendor-order relationship

-- Add customerId column to link orders to customers table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id VARCHAR REFERENCES customers(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Add comment
COMMENT ON COLUMN orders.customer_id IS 'Link to customer - simple customer-vendor-order relationship for tracking which customer placed the order';

