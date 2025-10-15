-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variation_name VARCHAR(255) NOT NULL,
  variation_name_ch VARCHAR(255),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  weight VARCHAR(100),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_default ON product_variants(is_default);

-- Create RLS policies for product_variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read variants
CREATE POLICY "Allow authenticated users to read product variants" ON product_variants
  FOR SELECT TO authenticated
  USING (true);

-- Policy to allow authenticated users to insert variants
CREATE POLICY "Allow authenticated users to insert product variants" ON product_variants
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Policy to allow authenticated users to update variants
CREATE POLICY "Allow authenticated users to update product variants" ON product_variants
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy to allow authenticated users to delete variants
CREATE POLICY "Allow authenticated users to delete product variants" ON product_variants
  FOR DELETE TO authenticated
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_variants_updated_at 
  BEFORE UPDATE ON product_variants 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraint to ensure only one default variant per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_default_variant_per_product 
  ON product_variants(product_id) 
  WHERE is_default = TRUE;
