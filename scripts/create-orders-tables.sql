-- Create orders and order_items tables for Sandy POS
-- Run this in Supabase SQL Editor

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  customer_id TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  remarks TEXT,
  purchase_order TEXT,
  uploaded_files TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  product_name TEXT NOT NULL,
  product_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for orders table
-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders
CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Admins can update all orders
CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policies for order_items table
-- Users can view order items for their own orders
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Users can insert order items for their own orders
CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Admins can insert order items
CREATE POLICY "Admins can insert order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert test data across multiple months (only if tables are empty)
INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_amount, status, created_at)
SELECT 
  (SELECT id FROM auth.users LIMIT 1), -- Use first available user
  'John Doe',
  '+65 9123 4567',
  '123 Main Street, Singapore',
  150.00,
  'completed',
  NOW() - INTERVAL '7 days'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customer_name = 'John Doe');

INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_amount, status, created_at)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Jane Smith',
  '+65 9876 5432',
  '456 Orchard Road, Singapore',
  200.50,
  'completed',
  NOW() - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customer_name = 'Jane Smith');

INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_amount, status, created_at)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Bob Johnson',
  '+65 8765 4321',
  '789 Marina Bay, Singapore',
  75.25,
  'pending',
  NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customer_name = 'Bob Johnson');

-- Add orders from previous months
INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_amount, status, created_at)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Alice Wong',
  '+65 9123 1111',
  '100 Orchard Road, Singapore',
  120.00,
  'completed',
  NOW() - INTERVAL '30 days'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customer_name = 'Alice Wong');

INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_amount, status, created_at)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Charlie Brown',
  '+65 9123 2222',
  '200 Marina Bay, Singapore',
  180.75,
  'completed',
  NOW() - INTERVAL '60 days'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customer_name = 'Charlie Brown');

INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_amount, status, created_at)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'David Lee',
  '+65 9123 3333',
  '300 Sentosa, Singapore',
  95.50,
  'completed',
  NOW() - INTERVAL '90 days'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customer_name = 'David Lee');

INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_amount, status, created_at)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Emma Tan',
  '+65 9123 4444',
  '400 Chinatown, Singapore',
  160.25,
  'completed',
  NOW() - INTERVAL '120 days'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customer_name = 'Emma Tan');

-- Insert test order items for all orders
INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 1, 1, 2, 50.00, 100.00, 'Dried Chilli', 'CH001'
WHERE EXISTS (SELECT 1 FROM orders WHERE id = 1) AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 1);

INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 1, 2, 1, 50.00, 50.00, 'Dried Mushrooms', 'MU001'
WHERE EXISTS (SELECT 1 FROM orders WHERE id = 1) AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 1 AND product_id = 2);

INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 2, 1, 3, 45.00, 135.00, 'Dried Chilli', 'CH001'
WHERE EXISTS (SELECT 1 FROM orders WHERE id = 2) AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 2);

INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 2, 3, 2, 32.75, 65.50, 'Dried Fruits', 'FR001'
WHERE EXISTS (SELECT 1 FROM orders WHERE id = 2) AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 2 AND product_id = 3);

INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 3, 2, 1, 50.00, 50.00, 'Dried Mushrooms', 'MU001'
WHERE EXISTS (SELECT 1 FROM orders WHERE id = 3) AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 3);

INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 3, 4, 1, 25.25, 25.25, 'Herbs & Spices', 'HS001'
WHERE EXISTS (SELECT 1 FROM orders WHERE id = 3) AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 3 AND product_id = 4);

-- Add order items for the additional orders
INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 4, 1, 2, 60.00, 120.00, 'Dried Chilli', 'CH001'
WHERE EXISTS (SELECT 1 FROM orders WHERE id = 4) AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 4);

INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 5, 2, 3, 60.25, 180.75, 'Dried Mushrooms', 'MU001'
WHERE EXISTS (SELECT 1 FROM orders WHERE id = 5) AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 5);

INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 6, 3, 2, 47.75, 95.50, 'Dried Fruits', 'FR001'
WHERE EXISTS (SELECT 1 FROM orders WHERE id = 6) AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 6);

INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name, product_code)
SELECT 7, 4, 4, 40.06, 160.25, 'Herbs & Spices', 'HS001'
WHERE EXISTS (SELECT 1 FROM orders WHERE id = 7) AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = 7);

-- Verify the data was inserted
SELECT 'Orders created:' as info, COUNT(*) as count FROM orders;
SELECT 'Order items created:' as info, COUNT(*) as count FROM order_items;
