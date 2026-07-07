import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../_lib/supabase';
import {
  getAuthUser, isAdmin, getStoreOwnerId, readBody,
  setCorsHeaders, handleOptions, unauthorized, forbidden, badRequest,
} from '../../_lib/auth';
import { generateStoreSlug } from '../../_lib/slug';

export default async function handler(req: IncomingMessage & { query?: any }, res: ServerResponse): Promise<void> {
  setCorsHeaders(res);

  if (handleOptions(req, res)) return;

  const storeId = req.query?.id;
  if (!storeId) {
    return badRequest(res, 'Store ID requerido');
  }

  if (req.method === 'GET') {
    await handleGet(req, res, storeId);
    return;
  }

  if (req.method === 'PUT') {
    await handleUpdate(req, res, storeId);
    return;
  }

  if (req.method === 'DELETE') {
    await handleDelete(req, res, storeId);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

async function handleGet(req: IncomingMessage, res: ServerResponse, storeId: string): Promise<void> {
  const { data: store, error } = await supabaseAdmin
    .from('stores')
    .select('*')
    .or(`id.eq.${storeId},slug.eq.${storeId}`)
    .maybeSingle();

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  if (!store) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Tienda no encontrada' }));
    return;
  }

  // Pending/rejected stores: only owner or admin can see
  if (store.status !== 'verified') {
    const user = await getAuthUser(req);
    if (!user || (user.id !== store.admin_user_id && !(await isAdmin(user.id)))) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Tienda no encontrada' }));
      return;
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(store));
}

async function handleUpdate(req: IncomingMessage, res: ServerResponse, storeId: string): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  const ownerId = await getStoreOwnerId(storeId);
  if (!ownerId) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Tienda no encontrada' }));
    return;
  }

  if (user.id !== ownerId && !(await isAdmin(user.id))) {
    return forbidden(res);
  }

  let body: any;
  try { body = await readBody(req); } catch {
    return badRequest(res, 'Cuerpo JSON inválido');
  }

  const allowedFields = [
    'store_name', 'legal_name', 'cif_nif', 'contact_email', 'phone_number',
    'website_url', 'logo_url', 'cover_image_url', 'short_description', 'description',
    'location', 'specialties', 'gallery_images',
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field] ?? null;
    }
  }

  // If owner is updating and store was rejected, reset to pending
  if (user.id === ownerId) {
    const { data: current } = await supabaseAdmin
      .from('stores')
      .select('status')
      .eq('id', storeId)
      .single();

    if (current?.status === 'rejected') {
      updates.status = 'pending';
      updates.rejection_reason = null;
    }
  }

  // Regenerate slug if store_name changed
  if (updates.store_name && typeof updates.store_name === 'string') {
    updates.slug = await generateStoreSlug(updates.store_name);
  }

  if (Object.keys(updates).length === 0) {
    return badRequest(res, 'No hay campos para actualizar');
  }

  const { data: store, error } = await supabaseAdmin
    .from('stores')
    .update(updates)
    .eq('id', storeId)
    .select()
    .single();

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(store));
}

async function handleDelete(req: IncomingMessage, res: ServerResponse, storeId: string): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  const ownerId = await getStoreOwnerId(storeId);
  if (!ownerId) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Tienda no encontrada' }));
    return;
  }

  if (user.id !== ownerId && !(await isAdmin(user.id))) {
    return forbidden(res);
  }

  const { error } = await supabaseAdmin.from('stores').delete().eq('id', storeId);

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  // Keep user role as Store (confirmed by user)
  res.writeHead(204);
  res.end();
}
