import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from './supabase';

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

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
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

/** Set CORS headers for store endpoints */
export function setCorsHeaders(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
}

/** Handle OPTIONS preflight, returns true if request was OPTIONS */
export function handleOptions(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
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
