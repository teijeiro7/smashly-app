import type { IncomingMessage, ServerResponse } from 'http';

const ALLOWED_IMAGE_DOMAINS: string[] = [
  'www.padelnuestro.es',
  'padelnuestro.es',
  'static.padelnuestro.es',
  'cdn.padelnuestro.es',
  'www.padelnuestro.com',
  'padelnuestro.com',
  'static.padelnuestro.com',
  'cdn.padelnuestro.com',
  'm.media-amazon.com',
  'images-na.ssl-images-amazon.com',
  'images-eu.ssl-images-amazon.com',
  'i5.walmartimages.com',
  'www.decathlon.es',
  'contents.mediadecathlon.com',
  'www.jdsports.es',
  'static.jdsports.es',
  'www.totalpadel.es',
  'www.padelzoom.es',
  'www.padelmarket.com',
  'padelmarket.com',
  'cdn.padelmarket.com',
  'www.padelproshop.com',
  'padelproshop.com',
  'www.padelproshop.es',
  'padelproshop.es',
  'cdn.shopify.com',
  'cdn.shopify.es',
  'lh3.googleusercontent.com',
  'supabase.co',
  'lrdgyfmkkboyhoycrnov.supabase.co',
];

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const url = new URL(req.url!, `http://${req.headers.host}`);
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'URL parameter is required' }));
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid URL provided' }));
    return;
  }

  if (parsedUrl.protocol !== 'https:') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Only HTTPS URLs are allowed' }));
    return;
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (!ALLOWED_IMAGE_DOMAINS.includes(hostname)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Domain '${hostname}' is not in the allowed list` }));
    return;
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch image from source' }));
      return;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
    });
    res.end(Buffer.from(buffer));
  } catch (err: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error while fetching image' }));
  }
}
