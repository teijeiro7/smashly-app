import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin, supabaseAnon } from './supabase';

export interface AuthUser {
  id: string;
  email?: string;
}

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

  const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
  if (error || !user) return null;

  return { id: user.id, email: user.email };
}

/** Verify user is admin by checking user_profiles.role = 'Admin' */
export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'Admin';
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
