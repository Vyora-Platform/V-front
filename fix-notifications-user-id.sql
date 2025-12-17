-- Make user_id nullable in notifications table
-- This allows notifications for public mini-website orders (no logged-in user)

ALTER TABLE notifications 
ALTER COLUMN user_id DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
  AND column_name = 'user_id';

