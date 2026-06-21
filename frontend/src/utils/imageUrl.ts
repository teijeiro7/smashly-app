// In production, route external images through /api/proxy/image to avoid hotlink blocks.
// In dev, use direct URLs (no Vercel functions running locally).
export function racketImageUrl(url: string | undefined | null, fallback = '/placeholder-racket.svg'): string {
  if (!url) return fallback;
  if (!url.startsWith('http') || import.meta.env.DEV) return url;
  return `/api/proxy/image?url=${encodeURIComponent(url)}`;
}
