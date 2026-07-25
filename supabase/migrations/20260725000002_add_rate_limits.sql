-- ============================================================
-- Rate limiting store (audit §2.3)
--
-- api/recommendations/generate.ts, generate-rag.ts, comparison.ts and
-- proxy/image.ts call paid LLM/embedding APIs (or proxy arbitrary bytes)
-- with no authentication and no rate limit. An in-memory counter would not
-- help here: Vercel functions are stateless per-instance and get recycled
-- constantly, so every cold start resets the count. This table gives a
-- durable, atomic counter shared across all instances via the existing
-- Supabase connection (service-role only — no new external service needed).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (which bypasses RLS) may touch this table.

-- Atomic fixed-window counter. INSERT ... ON CONFLICT takes a row lock,
-- so concurrent requests for the same key can't race past the limit.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO rate_limits (key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
                  WHEN rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
                    THEN 1
                  ELSE rate_limits.count + 1
                END,
        window_start = CASE
                  WHEN rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
                    THEN now()
                  ELSE rate_limits.window_start
                END
  RETURNING count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, int, int) TO service_role;
