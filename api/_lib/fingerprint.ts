import { createHash } from 'node:crypto';

export type ErrorSource = 'web' | 'api' | 'manual';

interface FingerprintInput {
  source: ErrorSource;
  message: string;
  firstFrameFile?: string | null;
}

// Regexes that strip volatile tokens from a message before hashing, so two
// occurrences of "the same" error — differing only by a UUID, a numeric id,
// a URL, or quoted user data — collapse into one incident instead of each
// spawning its own Notion ticket.
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const URL_RE = /https?:\/\/\S+/gi;
const QUOTED_RE = /(['"`]).*?\1/g;
const NUMBER_RE = /\d+/g;

export function normalizeMessage(message: string): string {
  return message
    .toLowerCase()
    .replace(UUID_RE, '<uuid>')
    .replace(URL_RE, '<url>')
    .replace(QUOTED_RE, '<quoted>')
    .replace(NUMBER_RE, '<num>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Vite stamps a build hash into the chunk filename (index-a3f9c1.js), so the
// same source file gets a different name on every deploy. Strip the hash so
// the fingerprint survives across releases instead of opening a fresh
// incident — and a fresh Notion ticket — on every single deploy.
const CHUNK_HASH_RE = /-[0-9a-zA-Z]{6,12}(?=\.(?:m?js|cjs)(?:[:?]|$))/;

export function normalizeFrameFile(file: string): string {
  return file.replace(CHUNK_HASH_RE, '');
}

export function computeFingerprint(input: FingerprintInput): string {
  const normalizedMessage = normalizeMessage(input.message);
  const normalizedFrame = input.firstFrameFile ? normalizeFrameFile(input.firstFrameFile) : '';
  const raw = `${input.source}::${normalizedMessage}::${normalizedFrame}`;
  return createHash('sha256').update(raw).digest('hex');
}
