-- ============================================================
-- Migration: stores_dashboard
-- Adds columns for store dashboard, public profile, analytics
-- Migrates verified boolean → status enum
-- ============================================================

-- 1. Add new columns
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS views_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(2,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0;

-- 2. Migrate boolean verified → status
UPDATE stores SET status = 'verified' WHERE verified = true AND status = 'pending';
UPDATE stores SET status = 'pending'  WHERE verified = false AND status = 'pending';

-- 3. Drop old column (after migration verified)
ALTER TABLE stores DROP COLUMN IF EXISTS verified;

-- 4. Add notification type for store status changes
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'price_drop', 'comparison_complete', 'recommendation_complete',
    'review', 'review_reply', 'admin_update', 'new_user',
    'new_store', 'store_status'
  ));
