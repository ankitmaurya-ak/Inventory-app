-- Migration: Add stores table and invite_code support
-- Run AFTER existing schema is in place

-- Step 1: Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(150) NOT NULL,
  invite_code  VARCHAR(20) UNIQUE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_invite_code ON stores(invite_code);

-- Step 2: Add store_id to users (nullable first so existing rows don't fail)
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- Step 3: Create a default store for any existing users without a store
DO $$
DECLARE
  default_store_id UUID;
BEGIN
  -- Only run if there are users without a store
  IF EXISTS (SELECT 1 FROM users WHERE store_id IS NULL) THEN
    INSERT INTO stores (name, invite_code)
    VALUES ('Default Store', 'STORE-DEFAULT')
    ON CONFLICT (invite_code) DO NOTHING;

    SELECT id INTO default_store_id FROM stores WHERE invite_code = 'STORE-DEFAULT';

    UPDATE users SET store_id = default_store_id WHERE store_id IS NULL;
  END IF;
END $$;
