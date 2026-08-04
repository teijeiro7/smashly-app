import { isIndexable } from './frontend/src/config/seo';

// Never run on /api: the pass-through `fetch(request)` below re-enters the same
// server under `vercel dev`, which loops until the request times out
// (MIDDLEWARE_INVOCATION_FAILED on every API call). API responses never need the
// noindex header anyway.
export const config = {
  matcher: ['/((?!api).*)'],
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
