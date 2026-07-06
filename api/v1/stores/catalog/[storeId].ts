import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../../_lib/supabase';
import { getAuthUser, isAdmin, readBody, setCorsHeaders, handleOptions, unauthorized, forbidden, badRequest, getStoreOwnerId } from '../../../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(res);

  if (handleOptions(req, res)) return;

  const storeId = (req.url || '').split('/').filter(Boolean).pop() || '';

  if (req.method === 'GET') {
    await handleList(storeId, req, res);
    return;
  }

  if (req.method === 'POST') {
    await handleAdd(storeId, req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

async function handleList(storeId: string, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  const ownerId = await getStoreOwnerId(storeId);
  const admin = await isAdmin(user.id);

  if (ownerId !== user.id && !admin) return forbidden(res);

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const offset = (page - 1) * limit;

  const { data: prices, error, count } = await supabaseAdmin
    .from('store_prices')
    .select('*, racket:rackets(*)', { count: 'exact' })
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ data: prices, total: count, page, limit }));
}

async function handleAdd(storeId: string, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  const ownerId = await getStoreOwnerId(storeId);
  const admin = await isAdmin(user.id);

  if (ownerId !== user.id && !admin) return forbidden(res);

  let body: any;
  try { body = await readBody(req); } catch {
    return badRequest(res, 'Invalid JSON body');
  }

  const { racket_id, price, original_price, link, currency, in_stock } = body;

  if (!racket_id) return badRequest(res, 'racket_id is required');

  // Verify racket exists
  const { data: racket } = await supabaseAdmin
    .from('rackets')
    .select('id')
    .eq('id', racket_id)
    .single();

  if (!racket) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Racket not found' }));
    return;
  }

  // Upsert to prevent duplicate (racket_id, store_id)
  const { data, error } = await supabaseAdmin
    .from('store_prices')
    .upsert({
      racket_id,
      store_id: storeId,
      price: price || null,
      original_price: original_price || null,
      link: link || null,
      currency: currency || 'EUR',
      in_stock: in_stock !== undefined ? in_stock : true,
      is_auto_match: false,
    })
    .select()
    .single();

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}


