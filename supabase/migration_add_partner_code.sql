-- =====================================================
-- Migration: Add partner_code column to existing users
-- =====================================================
-- This migration adds the partner_code column and generates
-- unique codes for existing users who don't have one.
-- Run this ONLY if you already have the users table created
-- =====================================================

-- Step 1: Add partner_code column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'partner_code'
  ) THEN
    ALTER TABLE users ADD COLUMN partner_code TEXT UNIQUE;
  END IF;
END $$;

-- Step 2: Create index for partner_code
CREATE INDEX IF NOT EXISTS idx_users_partner_code ON users(partner_code);

-- Step 3: Function to generate random partner code
CREATE OR REPLACE FUNCTION generate_random_partner_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..10 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update existing users without partner_code
DO $$
DECLARE
  user_record RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR user_record IN SELECT id FROM users WHERE partner_code IS NULL OR partner_code = '' LOOP
    LOOP
      new_code := generate_random_partner_code();
      
      -- Check if code already exists
      SELECT EXISTS(SELECT 1 FROM users WHERE partner_code = new_code) INTO code_exists;
      
      -- If code is unique, use it
      IF NOT code_exists THEN
        UPDATE users SET partner_code = new_code WHERE id = user_record.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Verify the migration
SELECT id, username, name, partner_code FROM users;
