-- ============================================================
-- Migration: store_prices
-- Normalized table for store-specific racket prices/links.
-- Replaces denormalized {store}_actual_price columns on rackets.
-- ============================================================

-- 1. Create store_prices table
CREATE TABLE IF NOT EXISTS store_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  racket_id INT NOT NULL REFERENCES rackets(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  discount_percentage INT,
  link TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  in_stock BOOLEAN DEFAULT true,
  is_auto_match BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(racket_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_store_prices_racket_id ON store_prices(racket_id);
CREATE INDEX IF NOT EXISTS idx_store_prices_store_id ON store_prices(store_id);

-- 2. Enable RLS
ALTER TABLE store_prices ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
-- Anyone can read prices
CREATE POLICY "store_prices_select_public"
  ON store_prices FOR SELECT
  USING (true);

-- Store owner can insert/update/delete their own prices
CREATE POLICY "store_prices_insert_owner"
  ON store_prices FOR INSERT
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE admin_user_id = auth.uid())
  );

CREATE POLICY "store_prices_update_owner"
  ON store_prices FOR UPDATE
  USING (
    store_id IN (SELECT id FROM stores WHERE admin_user_id = auth.uid())
  );

CREATE POLICY "store_prices_delete_owner"
  ON store_prices FOR DELETE
  USING (
    store_id IN (SELECT id FROM stores WHERE admin_user_id = auth.uid())
  );

-- Admin can manage all prices
CREATE POLICY "store_prices_insert_admin"
  ON store_prices FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "store_prices_update_admin"
  ON store_prices FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "store_prices_delete_admin"
  ON store_prices FOR DELETE
  USING (public.is_admin());
