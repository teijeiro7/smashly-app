import type { IncomingMessage, ServerResponse } from 'http';
import { checkRateLimit, tooManyRequests } from '../_lib/rate-limit';

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

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

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

  const allowed = await checkRateLimit(req, {
    keyPrefix: 'proxy-image',
    limit: 60,
    windowSeconds: 60,
  });
  if (!allowed) {
    tooManyRequests(res);
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

    // Only ever relay actual images: an allow-listed domain can still host
    // user-uploaded files (Shopify CDN, Supabase storage, googleusercontent),
    // and blindly forwarding their content-type would let this endpoint serve
    // text/html — i.e. stored XSS on our own origin — from those hosts.
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Upstream did not return an image' }));
      return;
    }

    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_IMAGE_BYTES) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Image too large' }));
      return;
    }

    if (!response.body) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Empty response from image source' }));
      return;
    }

    // Enforce the cap on the actual bytes read too — a spoofed/absent
    // content-length header must not bypass the limit.
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_IMAGE_BYTES) {
        reader.cancel().catch(() => {});
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Image too large' }));
        return;
      }
      chunks.push(value);
    }
    const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
    });
    res.end(buffer);
  } catch (err: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error while fetching image' }));
  }
}
