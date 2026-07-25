import { createClient } from '@supabase/supabase-js';

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
