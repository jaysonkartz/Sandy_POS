-- Add customer_code column to customers table
-- Run this in Supabase SQL Editor

-- Check if column already exists and add if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'customer_code'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN customer_code VARCHAR(255) UNIQUE;
        
        -- Add a comment to describe the column
        COMMENT ON COLUMN customers.customer_code IS 'Unique customer code/identifier';
        
        -- Create an index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);
        
        RAISE NOTICE 'Customer code column added successfully';
    ELSE
        RAISE NOTICE 'Customer code column already exists';
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
AND column_name = 'customer_code';

