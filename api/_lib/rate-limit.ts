import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from './supabase';

interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number;
  windowSeconds: number;
  /** Namespaces the counter per endpoint so limits don't bleed into each other. */
  keyPrefix: string;
}

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = first?.split(',')[0]?.trim();
  return ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * Atomic, durable rate limit backed by Postgres (see check_rate_limit()).
 * Fails open on infra errors — a DB hiccup logs a warning rather than
 * taking down the endpoint — but that failure is loud in server logs.
 */
export async function checkRateLimit(req: IncomingMessage, options: RateLimitOptions): Promise<boolean> {
  const key = `${options.keyPrefix}:${getClientIp(req)}`;

  const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
    p_key: key,
    p_limit: options.limit,
    p_window_seconds: options.windowSeconds,
  });

  if (error) {
    console.error(`Rate limit check failed for ${options.keyPrefix}:`, error.message);
    return true;
  }

  return data === true;
}

export function tooManyRequests(res: ServerResponse, msg = 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.'): void {
  res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '3600' });
  res.end(JSON.stringify({ error: msg }));
}
