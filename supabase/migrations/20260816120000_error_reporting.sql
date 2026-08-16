-- ============================================================================
-- Sistema de reporte de errores → ticket automático en Notion
--
-- Dos tablas de captura, sin dependencia de ningún servicio externo:
--
--   error_incidents   — una fila por `fingerprint` (agrupa ocurrencias del
--                       mismo bug). Es la unidad que se convierte en Ticket
--                       de Notion. `fingerprint` se calcula server-side en
--                       api/_v1/errors.ts — nunca se confía en el del cliente.
--   error_occurrences — una fila por evento real; permite reconstruir cuándo
--                       y desde dónde ocurrió cada instancia sin inflar
--                       error_incidents.
--
-- El triaje (GitHub Actions + Mistral + Notion, cron */15) lee/escribe esta
-- tabla vía supabaseAdmin (service_role) — igual que api/_v1/errors.ts.
-- Ningún rol de cliente (anon/authenticated) tiene acceso: es un canal de
-- ingesta de escritura server-side, no datos de usuario consultables.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.error_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL UNIQUE,

  source text NOT NULL CHECK (source IN ('web', 'api', 'manual')),
  error_type text,
  message text NOT NULL,
  normalized_message text NOT NULL,

  first_frame_file text,
  first_frame_line int,
  stack text,
  component_stack text,

  url_path text,
  -- Entorno de la PRIMERA ocurrencia vista, solo informativo. La misma
  -- fingerprint puede reaparecer más tarde en el otro entorno (ese es el
  -- punto: un bug visto en local reaparece en prod) — el campo que decide
  -- de verdad si el cron puede ticketear es is_ticketable, no este.
  environment text NOT NULL CHECK (environment IN ('production', 'local')),
  commit_sha text,

  is_own_origin boolean NOT NULL DEFAULT true,
  -- Se pone a true la primera vez que llega una ocurrencia "ticketable"
  -- (producción, o local con VITE_REPORT_LOCAL_ERRORS=true) y nunca vuelve
  -- a false — evita que una incidencia vista primero en local y luego en
  -- prod se quede huérfana de ticket.
  is_ticketable boolean NOT NULL DEFAULT false,

  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  occurrence_count int NOT NULL DEFAULT 1,
  affected_users int NOT NULL DEFAULT 0,

  -- pending: aún no triada. ticketed: tiene página en Notion.
  -- ignored: filtro suave del cron (ruido conocido, no bug propio).
  -- ai_failed: Mistral falló tras reintentos; el cron crea igualmente un
  -- ticket degradado con plantilla determinista y marca status='ticketed'
  -- (ai_failed queda reservado por si en el futuro se decide reintentar
  -- el enriquecimiento en un pase posterior sin recrear el ticket).
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ticketed', 'ignored', 'ai_failed')),

  -- Puesto a true por upsert_error_incident() cuando llega una nueva
  -- ocurrencia para una incidencia que ya estaba 'ticketed'. Es la señal
  -- que le dice al cron "vuelve a mirar esta, aunque no esté en pending" —
  -- así decide si el ticket de Notion sigue abierto (solo bumpea el
  -- contador) o si estaba Done (crea el ticket de 🔁 regresión). El cron
  -- la pone a false otra vez tras procesarla.
  needs_retriage boolean NOT NULL DEFAULT false,

  notion_page_id text,
  notion_created_at timestamptz,
  ai_attempts int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_error_incidents_status_last_seen
  ON public.error_incidents (status, last_seen_at);

-- El cron selecciona por este patrón exacto (pending nuevas + ticketed que
-- acaban de recibir una ocurrencia) — índice parcial porque ambos son
-- siempre un subconjunto pequeño de la tabla.
CREATE INDEX IF NOT EXISTS idx_error_incidents_needs_triage
  ON public.error_incidents (last_seen_at)
  WHERE status = 'pending' OR needs_retriage = true;

CREATE TABLE IF NOT EXISTS public.error_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.error_incidents(id) ON DELETE CASCADE,

  occurred_at timestamptz NOT NULL DEFAULT now(),
  url_path text,
  user_id uuid,
  user_agent text,
  environment text NOT NULL CHECK (environment IN ('production', 'local')),
  commit_sha text,
  extra jsonb
);

CREATE INDEX IF NOT EXISTS idx_error_occurrences_incident_occurred
  ON public.error_occurrences (incident_id, occurred_at DESC);

ALTER TABLE public.error_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_occurrences ENABLE ROW LEVEL SECURITY;
-- No policies on either table: only service_role (which bypasses RLS) may
-- read or write. anon/authenticated get zero rows, zero access.

-- ============================================================================
-- Atomic upsert-or-increment, mismo patrón que check_rate_limit() en
-- 20260725000002_add_rate_limits.sql (INSERT ... ON CONFLICT toma un lock de
-- fila, así que peticiones concurrentes con la misma fingerprint no compiten
-- por leer-modificar-escribir occurrence_count).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.upsert_error_incident(
  p_fingerprint text,
  p_source text,
  p_error_type text,
  p_message text,
  p_normalized_message text,
  p_first_frame_file text,
  p_first_frame_line int,
  p_stack text,
  p_component_stack text,
  p_url_path text,
  p_environment text,
  p_commit_sha text,
  p_is_own_origin boolean,
  p_is_ticketable boolean
)
RETURNS TABLE (out_id uuid, out_occurrence_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO error_incidents AS ei (
    fingerprint, source, error_type, message, normalized_message,
    first_frame_file, first_frame_line, stack, component_stack,
    url_path, environment, commit_sha, is_own_origin, is_ticketable
  )
  VALUES (
    p_fingerprint, p_source, p_error_type, p_message, p_normalized_message,
    p_first_frame_file, p_first_frame_line, p_stack, p_component_stack,
    p_url_path, p_environment, p_commit_sha, p_is_own_origin, p_is_ticketable
  )
  ON CONFLICT (fingerprint) DO UPDATE
    SET last_seen_at = now(),
        occurrence_count = ei.occurrence_count + 1,
        is_own_origin = ei.is_own_origin OR EXCLUDED.is_own_origin,
        is_ticketable = ei.is_ticketable OR EXCLUDED.is_ticketable,
        needs_retriage = (ei.status = 'ticketed')
  RETURNING ei.id, ei.occurrence_count;
END;
$$;

-- REVOKE ... FROM PUBLIC alone is not enough on this project: Supabase's
-- ALTER DEFAULT PRIVILEGES grants EXECUTE on every new public-schema function
-- directly to anon/authenticated at CREATE time (a separate ACL entry from
-- PUBLIC's), so both roles must be revoked explicitly or they can call this
-- straight via /rest/v1/rpc/upsert_error_incident — bypassing every
-- protection that only lives in api/_v1/errors.ts (rate limit, size cap,
-- origin check). Confirmed missing by get_advisors() right after the first
-- apply of this migration; anon/authenticated added here as the fix.
REVOKE ALL ON FUNCTION public.upsert_error_incident(
  text, text, text, text, text, text, int, text, text, text, text, text, boolean, boolean
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_error_incident(
  text, text, text, text, text, text, int, text, text, text, text, text, boolean, boolean
) TO service_role;
