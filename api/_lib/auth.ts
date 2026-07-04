import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from './supabase';

export interface AuthUser {
  id: string;
  email?: string;
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

/** Verify user is admin by checking user_profiles.role = 'admin' */
export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}

export function unauthorized(res: ServerResponse, msg = 'Unauthorized'): void {
  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: msg }));
}

export function forbidden(res: ServerResponse, msg = 'Forbidden'): void {
  res.writeHead(403, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: msg }));
}
