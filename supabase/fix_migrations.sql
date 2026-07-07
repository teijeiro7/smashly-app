-- ============================================================
-- Fix script: run BEFORE the 3 migration files
-- Resolves:
--   1. is_admin() function does not exist
--   2. Policy "Tiendas verificadas son visibles para todos"
--      depends on `verified` column → drop before DROP COLUMN
-- ============================================================

-- 1. Create is_admin() helper (idempotent)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = auth.uid()
      AND role::text = 'Admin'
  );
$$;

-- 2. Drop the policy that references `verified`
DROP POLICY IF EXISTS "Tiendas verificadas son visibles para todos" ON stores;

-- 3. Ensure a public read policy exists (replaces the dropped one)
DROP POLICY IF EXISTS "stores_select_public" ON stores;
CREATE POLICY "stores_select_public"
  ON stores FOR SELECT
  USING (true);
