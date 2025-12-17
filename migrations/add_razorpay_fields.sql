-- Add Razorpay integration fields to vendor_subscriptions table
DO $$
BEGIN
    -- Add razorpay_order_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vendor_subscriptions'
        AND column_name = 'razorpay_order_id'
    ) THEN
        ALTER TABLE vendor_subscriptions
        ADD COLUMN razorpay_order_id text;

        COMMENT ON COLUMN vendor_subscriptions.razorpay_order_id IS 'Razorpay order ID for payment tracking';
    END IF;

    -- Add razorpay_payment_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vendor_subscriptions'
        AND column_name = 'razorpay_payment_id'
    ) THEN
        ALTER TABLE vendor_subscriptions
        ADD COLUMN razorpay_payment_id text;

        COMMENT ON COLUMN vendor_subscriptions.razorpay_payment_id IS 'Razorpay payment ID after successful payment';
    END IF;

    -- Add payment_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vendor_subscriptions'
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE vendor_subscriptions
        ADD COLUMN payment_status text DEFAULT 'pending';

        COMMENT ON COLUMN vendor_subscriptions.payment_status IS 'Payment status: pending, completed, failed';
    END IF;
END $$;
