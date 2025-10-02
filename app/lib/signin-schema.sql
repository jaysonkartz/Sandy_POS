-- Create sign_in_records table to track user sign-ins
CREATE TABLE IF NOT EXISTS sign_in_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  sign_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  session_id TEXT,
  device_info JSONB,
  location_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sign_in_records_user_id ON sign_in_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sign_in_records_email ON sign_in_records(email);
CREATE INDEX IF NOT EXISTS idx_sign_in_records_sign_in_at ON sign_in_records(sign_in_at);
CREATE INDEX IF NOT EXISTS idx_sign_in_records_success ON sign_in_records(success);

-- Enable Row Level Security (RLS)
ALTER TABLE sign_in_records ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can view their own sign-in records
CREATE POLICY "Users can view own sign-in records" ON sign_in_records
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert sign-in records
CREATE POLICY "Service role can insert sign-in records" ON sign_in_records
  FOR INSERT WITH CHECK (true);

-- Service role can update sign-in records
CREATE POLICY "Service role can update sign-in records" ON sign_in_records
  FOR UPDATE USING (true);

-- Admins can view all sign-in records
CREATE POLICY "Admins can view all sign-in records" ON sign_in_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
