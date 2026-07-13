import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../_lib/supabase';
import { getAuthUser, isAdmin, readBody, setCorsHeaders, handleOptions, unauthorized, forbidden, badRequest } from '../../_lib/auth';
import { generateStoreSlug } from '../../_lib/slug';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (handleOptions(req, res)) return;

  if (req.method === 'GET') {
    await handleGetAll(req, res);
    return;
  }

  if (req.method === 'POST') {
    await handleCreate(req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

async function handleGetAll(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const verified = url.searchParams.get('verified');

  if (verified !== 'true') {
    const user = await getAuthUser(req);
    if (!user) return unauthorized(res);
    if (!(await isAdmin(user.id))) return forbidden(res);
  }

  const query = supabaseAdmin.from('stores').select('*');

  if (verified === 'true') {
    query.eq('status', 'verified');
  } else if (verified === 'false') {
    query.eq('status', 'pending');
  }

  const { data, error } = await query;

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function handleCreate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  let body: any;
  try { body = await readBody(req); } catch {
    return badRequest(res, 'Cuerpo JSON inválido');
  }

  const { store_name, legal_name, cif_nif, contact_email, phone_number, location } = body;

  if (!store_name || !legal_name || !cif_nif || !contact_email || !phone_number || !location) {
    return badRequest(res, 'Faltan campos obligatorios: store_name, legal_name, cif_nif, contact_email, phone_number, location');
  }

  const { data: existing } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('admin_user_id', user.id)
    .maybeSingle();

  if (existing) {
    res.writeHead(409, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Ya tienes una tienda registrada' }));
    return;
  }

  const slug = await generateStoreSlug(store_name);

  const { data: store, error } = await supabaseAdmin
    .from('stores')
    .insert({
      store_name,
      legal_name,
      cif_nif,
      contact_email,
      phone_number,
      website_url: body.website_url || null,
      logo_url: body.logo_url || null,
      short_description: body.short_description || null,
      location,
      admin_user_id: user.id,
      slug,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  // Notify all admins
  const { data: admins } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('role', 'Admin');

  if (admins?.length) {
    const notifications = admins.map(a => ({
      user_id: a.id,
      type: 'new_store',
      title: 'Nueva solicitud de tienda',
      message: `${store_name} ha solicitado registrarse como tienda.`,
      data: { store_id: store.id, store_name },
    }));
    await supabaseAdmin.from('notifications').insert(notifications);
  }

  // Update user role to Store
  await supabaseAdmin.from('user_profiles').update({ role: 'Store' }).eq('id', user.id);

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(store));
}
