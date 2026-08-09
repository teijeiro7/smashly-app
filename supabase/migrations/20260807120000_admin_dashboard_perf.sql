-- ============================================================
-- Phase 4 (admin dashboard perf): admin_dashboard_metrics() RPC
--
-- Problem: api/admin/metrics.ts computes 7 admin dashboard metrics as 7
-- separate network round-trips to Postgres, and getFavoritesCount() does
-- it in TWO sequential round-trips (lists.select('id') for every list
-- named 'Favoritas' → list_rackets.select(count).in('list_id', [...ids]),
-- an IN() list that grows linearly with the number of users). This
-- migration replaces all of that with a single RPC that computes every
-- metric in one query using subqueries, and does the favorites count with
-- a single JOIN instead of the two-hop IN() pattern.
--
-- NOTE: this migration is written for review only — it is NOT applied by
-- this session (production project, real data). The coordinator applies it.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Guard against privilege escalation: this function runs SECURITY DEFINER
  -- (it must, to read across every user's rows regardless of RLS), so
  -- without an explicit check here ANY caller holding just the public anon
  -- key could invoke this RPC directly via PostgREST and read aggregate
  -- counts of every user/store in the system — bypassing the isAdmin()
  -- check that api/admin/metrics.ts performs before it ever gets here.
  --
  -- is_admin() (supabase/migrations/20260728000001_fix_role_privilege_escalation.sql)
  -- checks user_profiles.role for auth.uid(), i.e. it only ever returns true
  -- for a genuinely authenticated Admin's own JWT. The `auth.role() =
  -- 'service_role'` branch additionally allows our own backend
  -- (api/admin/metrics.ts calls this via supabaseAdmin, the service-role
  -- client — see api/_lib/supabase.ts) to invoke it: a service-role request
  -- carries no user JWT, so auth.uid() is NULL and is_admin() alone would
  -- always raise, which would make this RPC uncallable from the one place
  -- that is actually supposed to call it. The service-role key is never
  -- exposed to the browser, so allowing it here does not reopen the hole
  -- is_admin() exists to close.
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'totalUsers', (SELECT count(*) FROM user_profiles),
    'totalRackets', (SELECT count(*) FROM rackets),
    'totalReviews', (SELECT count(*) FROM reviews),
    'activeUsers', (
      SELECT count(*) FROM user_profiles
      WHERE updated_at >= now() - interval '30 days'
    ),
    -- Matches the field naming already in api/admin/metrics.ts: "totalStores"
    -- is verified stores, "pendingRequests" is pending stores.
    'totalStores', (SELECT count(*) FROM stores WHERE status = 'verified'),
    'pendingRequests', (SELECT count(*) FROM stores WHERE status = 'pending'),
    -- Single JOIN instead of the app-level two-hop
    -- lists.select('id') → list_rackets.select(count).in('list_id', ids).
    'totalFavorites', (
      SELECT count(*)
      FROM list_rackets lr
      JOIN lists l ON l.id = lr.list_id
      WHERE l.name = 'Favoritas'
    )
  ) INTO result;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.admin_dashboard_metrics() IS
  'Admin dashboard aggregate metrics in a single round-trip. SECURITY DEFINER + is_admin()/service_role guard — see function body comment. Consumed by api/admin/metrics.ts via supabaseAdmin.rpc().';

-- Explicit REVOKE+GRANT (defense in depth alongside the in-function guard,
-- and consistent with the existing check_rate_limit() pattern in
-- supabase/migrations/20260725000002_add_rate_limits.sql): PostgreSQL grants
-- EXECUTE on new functions to PUBLIC by default, which includes the anon
-- role. `authenticated` is granted so a genuine Admin's own JWT can call it
-- (is_admin() still gates the actual logic); `service_role` is granted for
-- the backend's supabaseAdmin client.
REVOKE ALL ON FUNCTION public.admin_dashboard_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_metrics() TO authenticated, service_role;

-- ============================================================
-- Racket conflict-detection port to SQL: NOT implemented in this migration.
--
-- api/_v1/admin/rackets/conflicts.ts::detectConflicts() groups rackets by a
-- normalized (brand, model) key, but the normalization is not a pure string
-- transform: normalizeNameBase() strips accents, parenthetical noise,
-- "by <player>" suffixes and a multi-language country-name map, and
-- detectConflicts() then buckets each pre-group by extracted model year and
-- picks the LARGEST year-bucket (merging no-year entries into it) before
-- deciding which rows actually conflict. That bucket-selection step is
-- control flow, not a GROUP BY key — porting it to SQL as a naive
-- "GROUP BY normalized_key HAVING count(*) > 1" would silently disagree
-- with the JS result whenever a normalized name spans multiple model years
-- (common: e.g. a 2023 and 2024 reissue of the same shape/balance base name
-- that the JS logic does NOT flag as a conflict because they land in
-- different year buckets, but a naive SQL GROUP BY on the year-stripped key
-- would). Getting the admin-facing conflict count wrong is worse than not
-- computing it in SQL, so this migration intentionally leaves
-- conflicts.ts's JS detection untouched (task instructions explicitly allow
-- this escape hatch). If this becomes worth revisiting, the year-bucket
-- selection needs to be ported faithfully (e.g. a LATERAL subquery per
-- pre-group), not just the normalization helper.
-- ============================================================
