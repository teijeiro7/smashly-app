-- ============================================================
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
