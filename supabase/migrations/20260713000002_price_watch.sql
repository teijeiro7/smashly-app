-- ============================================================
-- Migration: price_watch
-- Users subscribe to price drop alerts for specific rackets
-- ============================================================

CREATE TABLE IF NOT EXISTS price_watch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  racket_id INTEGER NOT NULL REFERENCES rackets(id) ON DELETE CASCADE,
  target_price NUMERIC NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, racket_id)
);

CREATE INDEX IF NOT EXISTS idx_price_watch_active ON price_watch(active);
CREATE INDEX IF NOT EXISTS idx_price_watch_user ON price_watch(user_id);
CREATE INDEX IF NOT EXISTS idx_price_watch_racket ON price_watch(racket_id);

ALTER TABLE price_watch ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_watch_all_own"
  ON price_watch
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
