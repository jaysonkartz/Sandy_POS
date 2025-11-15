-- Add whatsapp_notifications column to customers table
-- Run this in Supabase SQL Editor

-- Check if column already exists and add if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'whatsapp_notifications'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN whatsapp_notifications BOOLEAN DEFAULT true NOT NULL;
        
        -- Add a comment to describe the column
        COMMENT ON COLUMN customers.whatsapp_notifications IS 'Customer preference for receiving WhatsApp notifications about orders and updates';
        
        -- Set default value for existing records (opt-in by default)
        UPDATE customers 
        SET whatsapp_notifications = true 
        WHERE whatsapp_notifications IS NULL;
        
        RAISE NOTICE 'WhatsApp notifications column added successfully';
    ELSE
        RAISE NOTICE 'WhatsApp notifications column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name = 'whatsapp_notifications';

