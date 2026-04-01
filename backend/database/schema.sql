-- Inventory Management App – PostgreSQL Schema
-- Run: psql -U postgres -d inventorydb -f schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  phone       VARCHAR(20),
  address     TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  category     VARCHAR(100),
  quantity     INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  price        DECIMAL(10, 2) NOT NULL DEFAULT 0,
  threshold    INTEGER NOT NULL DEFAULT 10,
  supplier_id  UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  location     VARCHAR(100),
  status       VARCHAR(20) NOT NULL DEFAULT 'available'
                 CHECK (status IN ('available', 'out_of_stock', 'needed', 'not_needed')),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_category    ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_status      ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_supplier    ON items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_items_low_stock   ON items(quantity, threshold);

-- ============================================================
-- INVENTORY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id    UUID REFERENCES items(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(50) NOT NULL,
  metadata   JSONB,
  timestamp  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_item      ON inventory_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_logs_user      ON inventory_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON inventory_logs(timestamp DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  type       VARCHAR(30) NOT NULL DEFAULT 'info'
               CHECK (type IN ('low_stock', 'info', 'warning', 'error')),
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(user_id, is_read);

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO settings (key, value)
VALUES
  ('email_user', ''),
  ('email_pass', ''),
  ('low_stock_email_time', '09:00'),
  ('low_stock_email_timezone', 'Asia/Kolkata')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Auto-update updated_at trigger for items
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_items_updated_at ON items;
CREATE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
