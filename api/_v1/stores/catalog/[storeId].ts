import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../../_lib/supabase';
import { getAuthUser, isAdmin, readBody, setCorsHeaders, handleOptions, unauthorized, forbidden, badRequest, getStoreOwnerId } from '../../../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (handleOptions(req, res)) return;

  const rawId = (req.url || '').split('/').filter(Boolean).pop() || '';

  if (req.method === 'GET') {
    await handleList(rawId, req, res);
    return;
  }

  if (req.method === 'POST') {
    const resolvedId = await resolveStoreId(rawId);
    if (!resolvedId) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Tienda no encontrada' }));
      return;
    }
    await handleAdd(resolvedId, req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

async function resolveStoreId(idOrSlug: string): Promise<string | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  if (isUuid) return idOrSlug;

  const { data } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('slug', idOrSlug)
    .maybeSingle();
  return data?.id || null;
}

async function handleList(rawId: string, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const storeId = await resolveStoreId(rawId);
  if (!storeId) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Tienda no encontrada' }));
    return;
  }

  const user = await getAuthUser(req);
  const ownerId = await getStoreOwnerId(storeId);
  const admin = user ? await isAdmin(user.id) : false;
  const isOwner = user && ownerId === user.id;

  if (!isOwner && !admin) {
    const { data: store } = await supabaseAdmin
      .from('stores')
      .select('status')
      .eq('id', storeId)
      .maybeSingle();

    if (!store || store.status !== 'verified') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Tienda no encontrada' }));
      return;
    }
  }

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const offset = (page - 1) * limit;

  const { data: prices, error, count } = await supabaseAdmin
    .from('store_prices')
    .select('*, racket:rackets(id, name, brand, model, images, specs)', { count: 'exact' })
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


