import crypto from 'crypto';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// In-memory cache — shared within a warm Vercel instance, not across instances
const store = new Map<string, CacheEntry<unknown>>();
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function cacheSet<T>(key: string, value: T): void {
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

export function generateProfileHash(data: Record<string, unknown>): string {
  const str = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('md5').update(str).digest('hex');
}
