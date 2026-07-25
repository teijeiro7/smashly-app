import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../../../_lib/supabase';
import { getAuthUser, isAdmin, readBody, setCorsHeaders, handleOptions, unauthorized, forbidden, badRequest, getStoreOwnerId } from '../../../../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (handleOptions(req, res)) return;

  const segments = (req.url || '').split('/').filter(Boolean);
  const priceId = segments.pop() || '';
  const storeId = segments.pop() || '';

  if (req.method === 'PUT') {
    await handleUpdate(storeId, priceId, req, res);
    return;
  }

  if (req.method === 'DELETE') {
    await handleDelete(storeId, priceId, req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

async function verifyOwnership(storeId: string, req: IncomingMessage): Promise<{ userId: string; authorized: boolean }> {
  const user = await getAuthUser(req);
  if (!user) return { userId: '', authorized: false };
  const ownerId = await getStoreOwnerId(storeId);
  const admin = await isAdmin(user.id);
  return { userId: user.id, authorized: ownerId === user.id || admin };
}

async function handleUpdate(storeId: string, priceId: string, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const { userId, authorized } = await verifyOwnership(storeId, req);
  if (!authorized) {
    if (!userId) return unauthorized(res);
    return forbidden(res);
  }

  let body: any;
  try { body = await readBody(req); } catch {
    return badRequest(res, 'Invalid JSON body');
  }

  const updates: Record<string, any> = {};
  if (body.price !== undefined) updates.price = body.price;
  if (body.original_price !== undefined) updates.original_price = body.original_price;
  if (body.link !== undefined) updates.link = body.link;
  if (body.currency !== undefined) updates.currency = body.currency;
  if (body.in_stock !== undefined) updates.in_stock = body.in_stock;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('store_prices')
    .update(updates)
    .eq('id', priceId)
    .eq('store_id', storeId)
    .select()
    .single();

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  if (!data) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Price entry not found' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function handleDelete(storeId: string, priceId: string, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const { userId, authorized } = await verifyOwnership(storeId, req);
  if (!authorized) {
    if (!userId) return unauthorized(res);
    return forbidden(res);
  }

  const { error } = await supabaseAdmin
    .from('store_prices')
    .delete()
    .eq('id', priceId)
    .eq('store_id', storeId);

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  res.writeHead(204);
  res.end();
}
