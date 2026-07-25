const KNOWN_ROUTES = new Set([
  '/',
  '/catalog',
  '/best-racket',
  '/faq',
  '/compare',
  '/terms-and-conditions',
  '/privacy-policy',
]);

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Only process HTML page requests
  if (!request.headers.get('accept')?.includes('text/html')) {
    return fetch(request);
  }

  const response = await fetch(request);

  if (!KNOWN_ROUTES.has(path)) {
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
