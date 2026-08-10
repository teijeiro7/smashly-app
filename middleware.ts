import { isIndexable } from './frontend/src/config/seo';

// Never run on /api: the pass-through `fetch(request)` below re-enters the same
// server under `vercel dev`, which loops until the request times out
// (MIDDLEWARE_INVOCATION_FAILED on every API call). API responses never need the
// noindex header anyway. Also exclude /assets (Vite's hashed JS/CSS output) and
// any path ending in a file extension (public/ images, robots.txt, manifest.json,
// sw.js, icons, ...) — none of those are HTML pages, but without this exclusion
// the middleware still invokes and does an extra network hop per asset on every
// page load before the `accept` check even gets a chance to short-circuit it.
export const config = {
  matcher: ['/((?!api|assets|.*\\.[\\w]+$).*)'],
};

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Only process HTML page requests
  if (!request.headers.get('accept')?.includes('text/html')) {
    return fetch(request);
  }

  const response = await fetch(request);

  if (!isIndexable(path)) {
    const headers = new Headers(response.headers);
    headers.set('x-robots-tag', 'noindex');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}
