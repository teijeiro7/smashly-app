-- ============================================================
-- Close rackets write RLS + apply avatars storage policies
-- (routing/auth audit 2026-07-30)
--
-- rackets currently has the Supabase-dashboard default policies —
-- "Enable insert/update/delete for authenticated users only" — which allow
-- ANY authenticated user to write to the catalog (no admin/store-owner
-- check at all). 20260621000001_enable_rls.sql already designed the
-- correct replacement (store_owner_or_admin, mirroring the pattern already
-- live on store_prices) but was never applied to production — verified via
-- list_migrations (gap between 20260512102056 and 20260728124617) and by
-- reading pg_policies directly. This drops the permissive defaults and
-- applies that design.
--
-- storage.objects has RLS enabled with ZERO policies on the avatars
-- bucket — 20260725000003_apply_avatars_storage_policies.sql drafted read
-- +insert+delete but was likewise never applied, and never had an UPDATE
-- policy (needed for upsert-in-place re-uploads). This supersedes it.
--
-- NOTE (merged 2026-08-04): after merging into main, the earlier migrations
-- 20260621000001_enable_rls.sql and 20260725000003_apply_avatars_storage_
-- policies.sql already CREATE the same rackets/avatars policies on a fresh
-- database. Every CREATE below is therefore preceded by DROP POLICY IF
-- EXISTS so this migration is idempotent — it runs cleanly whether those
-- earlier migrations were applied (fresh DB / CI) or skipped (production's
-- migration gap), and on production it is still what closes the
-- "authenticated user can write to rackets" hole and adds the missing
-- avatars_owner_update policy.
-- ============================================================

-- ---- rackets: replace permissive defaults with store_owner_or_admin ----

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON rackets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON rackets;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON rackets;

DROP POLICY IF EXISTS "rackets_insert_store_owner_or_admin" ON rackets;
DROP POLICY IF EXISTS "rackets_update_store_owner_or_admin" ON rackets;
DROP POLICY IF EXISTS "rackets_delete_store_owner_or_admin" ON rackets;

CREATE POLICY "rackets_insert_store_owner_or_admin"
  ON rackets FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR store_id IN (SELECT id FROM stores WHERE admin_user_id = auth.uid())
    OR store_id IS NULL -- scrapers insert without a store (admin-only rows)
  );

CREATE POLICY "rackets_update_store_owner_or_admin"
  ON rackets FOR UPDATE
  USING (
    public.is_admin()
    OR store_id IN (SELECT id FROM stores WHERE admin_user_id = auth.uid())
  );

CREATE POLICY "rackets_delete_store_owner_or_admin"
  ON rackets FOR DELETE
  USING (
    public.is_admin()
    OR store_id IN (SELECT id FROM stores WHERE admin_user_id = auth.uid())
  );

-- ---- storage.objects: avatars bucket, owner-scoped by uid folder ----

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
