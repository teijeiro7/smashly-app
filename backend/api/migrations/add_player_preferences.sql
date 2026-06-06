ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS physical_condition TEXT,
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS frequency TEXT,
  ADD COLUMN IF NOT EXISTS touch_preference TEXT,
  ADD COLUMN IF NOT EXISTS balance_preference TEXT,
  ADD COLUMN IF NOT EXISTS shape_preference TEXT,
  ADD COLUMN IF NOT EXISTS weight_preference TEXT;
