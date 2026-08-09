import type { IncomingMessage, ServerResponse } from 'http';
import { jwtVerify } from 'jose';
import { supabaseAdmin, supabaseAnon } from './supabase';
import { cacheGet, cacheSet } from './cache';

export interface AuthUser {
  id: string;
  email?: string;
}

// This project's Supabase instance signs JWTs with the legacy HS256 shared
// secret (confirmed by decoding the anon key header: {"alg":"HS256"} — there
// is no "sb_publishable_..." key, i.e. no asymmetric JWT signing keys /
// JWKS in use here). Verifying locally with that secret avoids the network
// round-trip that supabaseAnon.auth.getUser(token) makes on every request.
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const jwtSecretKey = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null;
if (!jwtSecretKey) {
  // Logged once at module load (cold start) so it shows up clearly in
  // Vercel logs — every request will otherwise silently pay for the
  // auth.getUser() network round-trip without anyone noticing why.
  console.warn(
    '[auth] SUPABASE_JWT_SECRET no está definida — usando supabaseAnon.auth.getUser() ' +
      '(round-trip de red) en lugar de verificación local del JWT. Configura ' +
      'SUPABASE_JWT_SECRET (Project Settings > API > JWT Secret en Supabase) para evitarlo.'
  );
}

const ADMIN_ROLE_CACHE_TTL_MS = 60 * 1000;

/** Parse JSON body from request */
export async function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

/** Extract and verify Bearer token from Authorization header. Returns null on failure. */
export async function getAuthUser(req: IncomingMessage): Promise<AuthUser | null> {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  // Fallback: no JWT secret configured, verify via Supabase's Auth API
  // (network round-trip) exactly like before.
  if (!jwtSecretKey) {
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    if (error || !user) return null;
    return { id: user.id, email: user.email };
  }

  // Local verification: same failure behavior as the network path above
  // (invalid signature, expired, wrong audience → null → caller returns 401).
  try {
    const { payload } = await jwtVerify(token, jwtSecretKey, {
      algorithms: ['HS256'],
      audience: 'authenticated',
    });
    if (typeof payload.sub !== 'string') return null;
    return { id: payload.sub, email: typeof payload.email === 'string' ? payload.email : undefined };
  } catch {
    return null;
  }
}

/**
 * Verify user is admin by checking user_profiles.role = 'Admin'.
 *
 * The role is ALWAYS read from the database, never from the JWT payload —
 * user_metadata/app_metadata in a Supabase JWT can be influenced by the
 * user themselves (see supabase/migrations/20260728000001_fix_role_privilege_escalation.sql,
 * a real privilege-escalation bug that existed for exactly this reason).
 * Trusting a "role" claim on the token instead of this query would reopen
 * that hole. The DB lookup result is cached per user id for 60s (in-memory,
 * per warm Vercel instance — see api/_lib/cache.ts) since /admin fires this
 * check on every one of several parallel requests.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const cacheKey = `admin-role:${userId}`;
  const cached = cacheGet<boolean>(cacheKey);
  if (cached !== null) return cached;

  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();
  const result = data?.role === 'Admin';
  cacheSet(cacheKey, result, ADMIN_ROLE_CACHE_TTL_MS);
  return result;
}

/**
 * Allowed CORS origins. Read from FRONTEND_URL (comma-separated).
 * Default: local dev ports.
 */
function getAllowedOrigins(): string[] {
  const raw = process.env.FRONTEND_URL;
  if (!raw) {
    return ['http://localhost:4000', 'http://localhost:5173', 'http://localhost:3000'];
  }
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * Emit CORS headers. If the request Origin matches an allowed origin, that
 * origin is echoed back (required when the request uses Authorization /
 * credentials). Otherwise `*` is sent (sufficient for same-origin / public reads).
 *
 * NOTE: `Access-Control-Allow-Origin` MUST be a single origin string or `*`.
 * A comma-separated list is invalid and browsers will reject the preflight,
 * which is what the previous implementation was doing.
 */
export function setCorsHeaders(req: IncomingMessage, res: ServerResponse): void {
  const allowed = getAllowedOrigins();
  const origin = (req.headers.origin as string | undefined) ?? '';
  const allowOrigin = origin && allowed.includes(origin) ? origin : '*';

  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  if (allowOrigin !== '*') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

/** Handle OPTIONS preflight, returns true if request was OPTIONS */
export function handleOptions(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res);
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

/** Return admin_user_id for a store, or null if not found */
export async function getStoreOwnerId(storeId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('stores')
    .select('admin_user_id')
    .eq('id', storeId)
    .single();
  return data?.admin_user_id ?? null;
}

export function unauthorized(res: ServerResponse, msg = 'Unauthorized'): void {
  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: msg }));
}

export function forbidden(res: ServerResponse, msg = 'Forbidden'): void {
  res.writeHead(403, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: msg }));
}

export function badRequest(res: ServerResponse, msg = 'Bad request'): void {
  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: msg }));
}
