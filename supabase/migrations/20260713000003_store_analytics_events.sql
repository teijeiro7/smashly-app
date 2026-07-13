CREATE TABLE IF NOT EXISTS store_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_analytics_events_store_id ON store_analytics_events(store_id);
CREATE INDEX IF NOT EXISTS idx_store_analytics_events_created_at ON store_analytics_events(created_at);
