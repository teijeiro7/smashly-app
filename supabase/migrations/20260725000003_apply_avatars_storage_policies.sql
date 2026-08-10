-- ============================================================
-- SUPERSEDED — never applied to production (routing/auth audit 2026-07-30
-- found it missing an UPDATE policy, needed for upsert-in-place avatar
-- re-uploads). See 20260730090637_close_rackets_and_avatars_rls.sql for
-- the version that was actually applied. Left in place only as a
-- historical record of intent; do not apply this file.
-- ============================================================
--
-- Apply avatars storage policies (audit S11)
--
-- 20260621000001_enable_rls.sql drafted these as SQL comments, pending
-- "supabase CLI configured" — they were never actually applied, so the
-- avatars bucket has been running on whatever the default Storage
-- configuration is since RLS rollout.
-- ============================================================

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
