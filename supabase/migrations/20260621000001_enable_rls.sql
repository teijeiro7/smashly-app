-- ============================================================
-- Phase 1: Row-Level Security foundation
-- Mirrors the authorization logic in:
--   backend/api/src/middleware/auth.ts
--   backend/api/src/middleware/requireAdmin.ts
--   backend/api/src/middleware/requireRacketOwner.ts
-- ============================================================

-- ============================================================
-- 1. Helper: is_admin()
-- SECURITY DEFINER so policies can call it without recursion
-- ============================================================
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
      AND lower(role) = 'admin'
  );
$$;

-- ============================================================
-- 2. Profile bootstrap trigger
-- Replaces service-role profile creation in:
--   authController.ts:553 / googleAuthController.ts:164
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'player')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. user_profiles
-- - Anyone can read public profile info (nickname, avatar, etc.)
-- - Only the owner can update/delete their own profile
-- - Admin can read/update/delete any profile
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select_public"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "user_profiles_insert_self"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_update_self_or_admin"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "user_profiles_delete_self_or_admin"
  ON user_profiles FOR DELETE
  USING (id = auth.uid() OR public.is_admin());

-- ============================================================
-- 4. rackets
-- - Anyone (anon + authenticated) can read
-- - Insert/Update/Delete: store owner (via stores.admin_user_id) or admin
-- ============================================================
ALTER TABLE rackets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rackets_select_public"
  ON rackets FOR SELECT
  USING (true);

CREATE POLICY "rackets_insert_store_owner_or_admin"
  ON rackets FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR store_id IN (
      SELECT id FROM stores WHERE admin_user_id = auth.uid()
    )
    OR store_id IS NULL -- scrapers insert without a store (admin-only rows)
  );

CREATE POLICY "rackets_update_store_owner_or_admin"
  ON rackets FOR UPDATE
  USING (
    public.is_admin()
    OR store_id IN (
      SELECT id FROM stores WHERE admin_user_id = auth.uid()
    )
  );

CREATE POLICY "rackets_delete_store_owner_or_admin"
  ON rackets FOR DELETE
  USING (
    public.is_admin()
    OR store_id IN (
      SELECT id FROM stores WHERE admin_user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. stores
-- - Public: anyone can read
-- - Insert: authenticated users (store creation request)
-- - Update/Delete: store owner (admin_user_id) or admin
-- ============================================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stores_select_public"
  ON stores FOR SELECT
  USING (true);

CREATE POLICY "stores_insert_authenticated"
  ON stores FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "stores_update_owner_or_admin"
  ON stores FOR UPDATE
  USING (admin_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "stores_delete_owner_or_admin"
  ON stores FOR DELETE
  USING (admin_user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- 6. price_history
-- - Fully public reads
-- - Writes: service-role only (Python scrapers bypass RLS)
-- ============================================================
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_history_select_public"
  ON price_history FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies → only service-role key (scrapers) can write

-- ============================================================
-- 7. reviews
-- - Public reads
-- - Insert/Update/Delete: owner (user_id) or admin
-- ============================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_public"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "reviews_insert_authenticated"
  ON reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_update_owner_or_admin"
  ON reviews FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "reviews_delete_owner_or_admin"
  ON reviews FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- 8. review_comments
-- - Public reads
-- - Insert: authenticated (user_id = auth.uid())
-- - Delete: owner or admin
-- ============================================================
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_comments_select_public"
  ON review_comments FOR SELECT
  USING (true);

CREATE POLICY "review_comments_insert_authenticated"
  ON review_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "review_comments_delete_owner_or_admin"
  ON review_comments FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- 9. review_likes (toggle like on review)
-- - Owner-scoped: each user sees/manages only their likes
-- ============================================================
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_likes_select_own"
  ON review_likes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "review_likes_insert_own"
  ON review_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "review_likes_delete_own"
  ON review_likes FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 10. lists
-- - Owner-scoped CRUD
-- ============================================================
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lists_all_own"
  ON lists
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 11. list_rackets
-- - Access via list ownership (owner can manage their list's rackets)
-- ============================================================
ALTER TABLE list_rackets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "list_rackets_select_own"
  ON list_rackets FOR SELECT
  USING (
    list_id IN (SELECT id FROM lists WHERE user_id = auth.uid())
  );

CREATE POLICY "list_rackets_insert_own"
  ON list_rackets FOR INSERT
  WITH CHECK (
    list_id IN (SELECT id FROM lists WHERE user_id = auth.uid())
  );

CREATE POLICY "list_rackets_delete_own"
  ON list_rackets FOR DELETE
  USING (
    list_id IN (SELECT id FROM lists WHERE user_id = auth.uid())
  );

-- ============================================================
-- 12. notifications
-- - Owner-scoped CRUD
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_all_own"
  ON notifications
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 13. racket_views (recently viewed history)
-- - Owner-scoped CRUD
-- ============================================================
ALTER TABLE racket_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "racket_views_all_own"
  ON racket_views
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 14. comparisons
-- - Owner-scoped CRUD
-- ============================================================
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comparisons_all_own"
  ON comparisons
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 15. recommendations
-- - Owner-scoped reads (server writes via service-role)
-- ============================================================
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recommendations_select_own"
  ON recommendations FOR SELECT
  USING (user_id = auth.uid());

-- INSERT/UPDATE by Vercel function (service-role bypasses RLS)

-- ============================================================
-- 16. knowledge_embeddings / racket_embeddings / review_embeddings
-- - Admin reads; all writes via service-role (RAG pipeline)
-- ============================================================
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_embeddings_select_admin"
  ON knowledge_embeddings FOR SELECT
  USING (public.is_admin());

ALTER TABLE racket_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "racket_embeddings_select_admin"
  ON racket_embeddings FOR SELECT
  USING (public.is_admin());

ALTER TABLE review_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_embeddings_select_admin"
  ON review_embeddings FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- 17. Storage: avatars bucket
-- - Public reads (profile pictures are public)
-- - Upload/Delete: owner only (path starts with user's uid)
-- ============================================================
-- Run these via Supabase dashboard Storage policies or supabase CLI:
-- INSERT INTO storage.policies ...
-- Stored here as comments until supabase CLI is configured.
--
-- CREATE POLICY "avatars_public_read"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');
--
-- CREATE POLICY "avatars_owner_insert"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'avatars'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- CREATE POLICY "avatars_owner_delete"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'avatars'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
