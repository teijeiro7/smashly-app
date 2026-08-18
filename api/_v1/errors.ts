import type { IncomingMessage, ServerResponse } from 'http';
import { getAllowedOrigins, getAuthUser, setCorsHeaders, handleOptions, badRequest } from '../_lib/auth';
import { checkRateLimit, tooManyRequests } from '../_lib/rate-limit';
import { supabaseAdmin } from '../_lib/supabase';
import { computeFingerprint, normalizeMessage, type ErrorSource } from '../_lib/fingerprint';

const MAX_BODY_BYTES = 32 * 1024;
const OCCURRENCES_PER_HOUR_CAP = 10;
const VALID_SOURCES: ErrorSource[] = ['web', 'manual'];
const VALID_ENVIRONMENTS = ['production', 'local'];

interface ErrorReportBody {
  source: ErrorSource;
  message: string;
  error_type?: string;
  stack?: string;
  component_stack?: string;
  first_frame_file?: string;
  first_frame_line?: number;
  url_path?: string;
  environment: 'production' | 'local';
  commit_sha?: string;
  ticketable?: boolean;
  user_id?: string;
}

/** Reads the body with a hard size cap — this endpoint is public and unauthenticated. */
async function readBodyLimited(req: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytes = 0;
    req.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

// This is the only trust boundary for first_frame_file: error-triage.mjs later
// does `git show <sha>:<first_frame_file>` on it. Without this, an anonymous
// caller (source: 'manual') could point it at any tracked repo file and get
// its content forwarded to Mistral. Real client-supplied values only ever
// look like this (frontend/src, no sourcemaps in prod means non-matching
// values are useless anyway — see resolveSnippet's comment in error-triage.mjs).
const SAFE_FRAME_FILE_RE = /^frontend\/src\/[\w./-]+\.(?:tsx?|jsx?)$/;

function sanitizeFrameFile(v: string): string | undefined {
  if (v.includes('..') || !SAFE_FRAME_FILE_RE.test(v)) return undefined;
  return v;
}

function validate(body: any): ErrorReportBody | null {
  if (!body || typeof body !== 'object') return null;
  if (!VALID_SOURCES.includes(body.source)) return null;
  if (!isNonEmptyString(body.message)) return null;
  if (!VALID_ENVIRONMENTS.includes(body.environment)) return null;

  return {
    source: body.source,
    message: String(body.message).slice(0, 2000),
    error_type: isNonEmptyString(body.error_type) ? body.error_type.slice(0, 200) : undefined,
    stack: isNonEmptyString(body.stack) ? body.stack.slice(0, 8000) : undefined,
    component_stack: isNonEmptyString(body.component_stack) ? body.component_stack.slice(0, 4000) : undefined,
    first_frame_file: isNonEmptyString(body.first_frame_file)
      ? sanitizeFrameFile(body.first_frame_file.slice(0, 500))
      : undefined,
    first_frame_line: typeof body.first_frame_line === 'number' ? body.first_frame_line : undefined,
    url_path: isNonEmptyString(body.url_path) ? body.url_path.slice(0, 500) : undefined,
    environment: body.environment,
    commit_sha: isNonEmptyString(body.commit_sha) ? body.commit_sha.slice(0, 60) : undefined,
    ticketable: body.ticketable === true,
    user_id: isNonEmptyString(body.user_id) ? body.user_id : undefined,
  };
}

function isOwnOrigin(req: IncomingMessage): boolean {
  const allowed = getAllowedOrigins();
  const origin = (req.headers.origin as string | undefined) ?? '';
  const referer = (req.headers.referer as string | undefined) ?? '';
  if (origin && allowed.includes(origin)) return true;
  return allowed.some((o) => referer.startsWith(o));
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const allowed = await checkRateLimit(req, { limit: 20, windowSeconds: 60, keyPrefix: 'error-report' });
  if (!allowed) return tooManyRequests(res);

  let raw: string;
  try {
    raw = await readBodyLimited(req, MAX_BODY_BYTES);
  } catch (err: any) {
    if (err?.statusCode === 413) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Payload too large' }));
      return;
    }
    return badRequest(res, 'Failed to read request body');
  }

  let parsed: any;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return badRequest(res, 'Invalid JSON body');
  }

  const body = validate(parsed);
  if (!body) return badRequest(res, 'Invalid error report payload');

  // Optional: an authenticated caller's user_id is trusted over whatever the
  // client claimed, since the client-supplied one can't be verified.
  const authUser = await getAuthUser(req);
  const userId = authUser?.id ?? body.user_id ?? null;

  const fingerprint = computeFingerprint({
    source: body.source,
    message: body.message,
    firstFrameFile: body.first_frame_file,
  });

  const isTicketable = body.environment === 'production' || body.ticketable === true;

  const { data, error } = await supabaseAdmin.rpc('upsert_error_incident', {
    p_fingerprint: fingerprint,
    p_source: body.source,
    p_error_type: body.error_type ?? null,
    p_message: body.message,
    p_normalized_message: normalizeMessage(body.message),
    p_first_frame_file: body.first_frame_file ?? null,
    p_first_frame_line: body.first_frame_line ?? null,
    p_stack: body.stack ?? null,
    p_component_stack: body.component_stack ?? null,
    p_url_path: body.url_path ?? null,
    p_environment: body.environment,
    p_commit_sha: body.commit_sha ?? null,
    p_is_own_origin: isOwnOrigin(req),
    p_is_ticketable: isTicketable,
  });

  if (error) {
    console.error('upsert_error_incident failed:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
    return;
  }

  const row = Array.isArray(data) ? data[0] : data;
  const incidentId: string | undefined = row?.out_id;

  if (incidentId) {
    // Soft cap: only keep storing raw occurrence rows up to
    // OCCURRENCES_PER_HOUR_CAP per incident per hour. occurrence_count on
    // error_incidents (bumped atomically above) stays the source of truth
    // for "how many times has this actually happened" regardless of the cap.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabaseAdmin
      .from('error_occurrences')
      .select('id', { count: 'exact', head: true })
      .eq('incident_id', incidentId)
      .gte('occurred_at', oneHourAgo);

    if (!countError && (count ?? 0) < OCCURRENCES_PER_HOUR_CAP) {
      const { error: occError } = await supabaseAdmin.from('error_occurrences').insert({
        incident_id: incidentId,
        url_path: body.url_path ?? null,
        user_id: userId,
        user_agent: (req.headers['user-agent'] as string | undefined)?.slice(0, 500) ?? null,
        environment: body.environment,
        commit_sha: body.commit_sha ?? null,
      });
      if (occError) {
        console.error('Failed to insert error_occurrence:', occError.message);
      }
    }
  }

  res.writeHead(202, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
}
