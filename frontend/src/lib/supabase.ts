import { createClient } from '@supabase/supabase-js';
import { processLock } from '@supabase/auth-js';

const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY env var');
}

// In dev, use same-origin so Vite's proxy handles Supabase calls.
// This avoids CORS preflight issues in Safari (the REST API OPTIONS
// is silently swallowed by Safari otherwise). In production, use
// the real Supabase URL directly.
const supabaseUrl = (import.meta as any).env.DEV
  ? window.location.origin
  : (import.meta as any).env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL env var (or DEV mode without window.location.origin)');
}

// Session storage: there is no backend auth endpoint in this app (see
// AGENTS.md) — the access + refresh token live in the browser's
// localStorage, managed entirely by this client. `storageKey` is fixed
// explicitly so it doesn't drift with `supabaseUrl` (which is
// `window.location.origin` in dev vs the real project URL in prod, and
// would otherwise derive a different key per environment).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'smashly-auth-token',
    // PKCE keeps the access/refresh token out of the redirect URL fragment
    // for the Google OAuth flow (the implicit-flow default puts them there).
    flowType: 'pkce',
    // supabase-js defaults to serializing session operations (getSession,
    // refreshSession, ...) via the browser's navigator.locks API. Reproduced
    // that lock hanging indefinitely on a hard reload of any authenticated
    // route (e.g. /profile) — getSession() never resolves, past its own
    // 5s internal timeout, leaving the whole app stuck on a blank screen.
    // processLock serializes the same way but with a plain in-process
    // promise queue, sidestepping navigator.locks entirely. Trade-off: it
    // only coordinates within a single tab, not across tabs — acceptable
    // here since cross-tab refresh races are rare and merely cause an
    // extra refresh call, not a hang.
    lock: processLock,
  },
});
