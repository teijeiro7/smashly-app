-- ============================================================
-- Fix live privilege-escalation to Admin (auth audit 2026-07-28)
--
-- supabase/migrations/20260725000001_fix_privilege_escalation.sql already
-- contains the correct fix, but NONE of the migrations after
-- 20260512102056 were ever applied to production — verified read-only
-- against the live project: is_admin() still compared role::text = 'admin'
-- (lowercase; the user_role enum only contains 'Player'/'Store'/'Admin', so
-- that comparison can never match anything), handle_new_user() never wrote
-- `role` at all, and `authenticated` still had blanket UPDATE on every
-- column of user_profiles including `role`.
--
-- That last point is a live, confirmed exploit: any authenticated user can
-- run `supabase.from('user_profiles').update({ role: 'Admin' }).eq('id', me)`
-- today and pass every is_admin()-gated check in api/_lib/auth.ts and every
-- admin RLS policy. This migration is idempotent (CREATE OR REPLACE /
-- REVOKE+GRANT) so it is safe to run regardless of exactly which of the
-- pending migrations were or weren't hand-applied before it.
-- ============================================================

-- ------------------------------------------------------------
-- 1) is_admin() — compare against the real enum casing ('Admin').
--    Matches supabase/migrations/20260621000001_enable_rls.sql:13-26.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = auth.uid()
      AND role::text = 'Admin'
  );
$$;

-- ------------------------------------------------------------
-- 2) handle_new_user() — role is always 'Player' server-side, never taken
--    from client-controlled raw_user_meta_data. Keeps the existing
--    nickname/full_name defaulting from metadata (registration UX), which
--    is not a privilege-relevant field.
--    Store-role promotion already happens server-side via service-role in
--    api/_v1/stores/index.ts when a store registration is approved — this
--    trigger never needs to grant anything above 'Player'.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, nickname, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'Player'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- 3) Column-level UPDATE split on user_profiles — the actual fix for the
--    live exploit. RLS is row-scoped (auth.uid() = id), not column-scoped,
--    so the policy alone can't stop a user updating their own `role`.
--    Only identity/audit/security columns are excluded; every
--    already-existing self-editable profile field stays writable so this
--    doesn't regress account settings / profile editing.
-- ------------------------------------------------------------
REVOKE UPDATE ON public.user_profiles FROM authenticated;

GRANT UPDATE (
  nickname,
  full_name,
  avatar_url,
  current_racket,
  current_racket_id,
  current_racket_name,
  current_racket_satisfaction,
  weight,
  height,
  birthdate,
  game_level,
  limitations,
  gender,
  physical_condition,
  position,
  frequency,
  touch_preference,
  balance_preference,
  shape_preference,
  weight_preference,
  address,
  city,
  latitude,
  length,
  active
) ON public.user_profiles TO authenticated;

-- Columns intentionally left out of the GRANT (server/service-role only):
--   id, email, role, oauth_provider, created_at, updated_at

-- ------------------------------------------------------------
-- 4) Data repair — profiles that predate this fix.
--    a) 4 existing profiles have role = NULL (created before any version
--       of handle_new_user() wrote a role). Default them to 'Player', the
--       same default every other signup gets.
--    b) 2 auth.users rows have no user_profiles row at all (their signup
--       predates the trigger, or an earlier failure dropped the insert).
--       Backfill from auth.users using the same metadata the trigger uses.
-- ------------------------------------------------------------
UPDATE public.user_profiles
SET role = 'Player'
WHERE role IS NULL;

INSERT INTO public.user_profiles (id, email, nickname, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'nickname', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  'Player'
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
