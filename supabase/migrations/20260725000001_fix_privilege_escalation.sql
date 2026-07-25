-- ============================================================
-- Security fix: privilege escalation to admin (audit §2.2)
--
-- Two independently exploitable vectors with only the public anon key:
--
--   A) handle_new_user() trusted client-controlled `raw_user_meta_data->>'role'`
--      (the exact object supabase.auth.signUp({ options: { data } }) lets any
--      caller set), so `signUp({ options: { data: { role: 'admin' } } })`
--      created an admin account with zero authentication.
--
--   B) user_profiles_update_self_or_admin had no column-level restriction, so
--      any authenticated user could run
--      `supabase.from('user_profiles').update({ role: 'admin' }).eq('id', me)`
--      and promote themselves — RLS is row-scoped, not column-scoped.
-- ============================================================

-- ------------------------------------------------------------
-- A) Bootstrap trigger always creates 'player' accounts.
-- Admin promotion must go through the service-role-only admin API
-- (api/admin/users/[id].ts PATCH), never client-supplied signup metadata.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'player')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- B) Column-level privilege split on user_profiles.
-- Revoke blanket UPDATE from `authenticated`, then grant back only the
-- columns a user may edit on their own profile. `role` (and identity/audit
-- columns) can only be changed by service_role, which is unaffected by
-- these grants/revokes and is what the admin API uses.
-- ------------------------------------------------------------
REVOKE UPDATE ON public.user_profiles FROM authenticated;

GRANT UPDATE (
  nickname,
  full_name,
  avatar_url,
  current_racket,
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
  weight_preference
) ON public.user_profiles TO authenticated;
