-- Add store ownership to rackets
-- Nullable: existing rackets have no owner store
-- ON DELETE SET NULL: deleting a store orphans its rackets (does not cascade-delete them)
ALTER TABLE rackets
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;
