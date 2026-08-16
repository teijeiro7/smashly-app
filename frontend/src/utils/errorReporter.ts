import { API_ENDPOINTS, buildApiUrl } from '../config/api';

export interface ReportErrorContext {
  componentStack?: string;
  /** Overrides message-based error type detection (e.g. 'UnhandledRejection'). */
  errorType?: string;
  /** Defaults to 'web'; pass 'manual' when reporting a hand-detected invariant violation rather than a caught exception. */
  source?: 'web' | 'manual';
}

// ---------------------------------------------------------------------------
// Denylist — discarded before anything is sent. These are never "our" bug:
// cross-origin script errors carry no usable stack, ResizeObserver's loop
// warning is a known browser quirk, extension frames come from code we don't
// ship, and AbortError almost always means "user navigated away" / "request
// was cancelled on purpose".
// ---------------------------------------------------------------------------
const EXTENSION_FRAME_RE = /(chrome|moz|safari)-extension:\/\//;

function isDenylisted(message: string, stack?: string, errorName?: string): boolean {
  if (message === 'Script error.' && !stack) return true;
  if (/ResizeObserver loop/i.test(message)) return true;
  if (errorName === 'AbortError' || /AbortError|The user aborted a request/i.test(message))
    return true;
  if (stack && EXTENSION_FRAME_RE.test(stack)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Scrubbing — nothing below survives to leave the browser. Defense in depth:
// what never leaves the client can't leak from Supabase, Mistral, or Notion.
// ---------------------------------------------------------------------------

// Query params explicitly allowed to survive scrubbing. Empty today — add a
// name here only when a specific param is confirmed non-sensitive and useful
// for triage (e.g. a feature-flag name), never speculatively.
const ALLOWED_QUERY_PARAMS: string[] = [];

/** Reduces a full URL (or pathname) to just the path — no hash, no query unless allowlisted. */
export function scrubUrl(href: string): string {
  try {
    const url = new URL(href, 'http://placeholder.local');
    const kept = new URLSearchParams();
    for (const name of ALLOWED_QUERY_PARAMS) {
      const value = url.searchParams.get(name);
      if (value !== null) kept.set(name, value);
    }
    const query = kept.toString();
    return query ? `${url.pathname}?${query}` : url.pathname;
  } catch {
    return href.split(/[?#]/)[0] || href;
  }
}

// JWTs (three base64url segments, header always starts with the b64 of '{"'),
// Bearer tokens, common API key shapes, and emails — each replaced wholesale.
const JWT_RE = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const BEARER_RE = /Bearer\s+[A-Za-z0-9\-_.~+/=]+/gi;
const API_KEY_RE = /\b(sk-[A-Za-z0-9]{10,}|api[_-]?key["'=:\s]+[A-Za-z0-9\-_]{10,})/gi;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/** Redacts tokens/keys/emails from freeform text (error messages, stacks). */
export function redactSecrets(text: string): string {
  return text
    .replace(JWT_RE, '[REDACTED]')
    .replace(BEARER_RE, 'Bearer [REDACTED]')
    .replace(API_KEY_RE, '[REDACTED]')
    .replace(EMAIL_RE, '[REDACTED]');
}

// ---------------------------------------------------------------------------
// First-own-frame extraction — used server-side too (fingerprint grouping),
// computed here so the payload doesn't force the server to re-parse a raw
// stack whose format varies by browser.
// ---------------------------------------------------------------------------
const FRAME_RE = /(?:at\s+(?:.*?\s+)?\(?|@)([^\s()]+):(\d+):(\d+)\)?/;
const VENDOR_FRAME_RE = /node_modules|vendor-/;

interface StackFrame {
  file: string;
  line: number;
}

function parseFrames(stack: string): StackFrame[] {
  return stack
    .split('\n')
    .map(line => {
      const m = FRAME_RE.exec(line);
      return m ? { file: m[1], line: Number(m[2]) } : null;
    })
    .filter((f): f is StackFrame => f !== null);
}

/** First stack frame that looks like our own code, skipping vendor/node_modules frames. */
export function firstOwnFrame(stack: string): StackFrame | null {
  const frames = parseFrames(stack);
  return frames.find(f => !VENDOR_FRAME_RE.test(f.file)) ?? frames[0] ?? null;
}

// ---------------------------------------------------------------------------
// Session-local throttle — the same approximate error firing in a tight loop
// (e.g. a render loop) shouldn't hammer the endpoint from a single tab.
// ---------------------------------------------------------------------------
const THROTTLE_WINDOW_MS = 60_000;
const THROTTLE_MAX_PER_WINDOW = 3;
const recentSends = new Map<string, number[]>();

function isThrottled(key: string): boolean {
  const now = Date.now();
  const timestamps = (recentSends.get(key) ?? []).filter(t => now - t < THROTTLE_WINDOW_MS);
  timestamps.push(now);
  recentSends.set(key, timestamps);
  return timestamps.length > THROTTLE_MAX_PER_WINDOW;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------
function send(payload: Record<string, unknown>): void {
  const url = buildApiUrl(API_ENDPOINTS.ERRORS);
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    // fall through to fetch
  }

  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Reporting a bug must never itself throw.
  }
}

/**
 * Reports an unexpected error so it turns into a Notion ticket. Never throws,
 * never awaits — safe to call from a catch block, an ErrorBoundary, or a
 * global window listener without risking a second failure.
 */
export function reportError(error: unknown, context: ReportErrorContext = {}): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = redactSecrets(err.message || 'Unknown error');
  const stack = err.stack ? redactSecrets(err.stack) : undefined;

  if (isDenylisted(message, stack, err.name)) return;

  const throttleKey = `${message}:${stack?.split('\n')[1] ?? ''}`;
  if (isThrottled(throttleKey)) return;

  const frame = stack ? firstOwnFrame(stack) : null;
  const environment = import.meta.env.PROD ? 'production' : 'local';
  const reportLocal = import.meta.env.VITE_REPORT_LOCAL_ERRORS === 'true';

  send({
    source: context.source ?? 'web',
    message,
    error_type: context.errorType ?? err.name,
    stack,
    component_stack: context.componentStack ? redactSecrets(context.componentStack) : undefined,
    first_frame_file: frame?.file,
    first_frame_line: frame?.line,
    url_path: typeof window !== 'undefined' ? scrubUrl(window.location.href) : undefined,
    environment,
    commit_sha: import.meta.env.VITE_COMMIT_SHA,
    ticketable: environment === 'local' ? reportLocal : undefined,
  });
}
