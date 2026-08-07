// In production, route external images through /api/proxy/image to avoid hotlink blocks.
// In dev, use direct URLs (no Vercel functions running locally).
//
// `width` chains the result through Vercel's native image optimizer
// (`/_vercel/image`), which resizes/re-encodes — the proxy alone only
// relays bytes at full resolution. It always targets the *proxied* URL
// (same-origin), never the raw external one: /api/proxy/image is what
// validates the source domain against its allowlist, so pointing the
// optimizer straight at an arbitrary external URL would reopen the SSRF
// surface the proxy exists to close.
export function racketImageUrl(
  url: string | undefined | null,
  fallback = '/placeholder-racket.svg',
  width?: number
): string {
  if (!url) return fallback;
  if (!url.startsWith('http') || import.meta.env.DEV) return url;
  const proxied = `/api/proxy/image?url=${encodeURIComponent(url)}`;
  if (!width) return proxied;
  return `/_vercel/image?url=${encodeURIComponent(proxied)}&w=${width}&q=75`;
}
