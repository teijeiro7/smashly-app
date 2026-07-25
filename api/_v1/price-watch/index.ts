import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../_lib/supabase';
import { getAuthUser, readBody, setCorsHeaders, handleOptions, unauthorized, badRequest } from '../../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (handleOptions(req, res)) return;

  if (req.method === 'GET') {
    await handleList(req, res);
    return;
  }

  if (req.method === 'POST') {
    await handleCreate(req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

async function handleList(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const racketId = url.searchParams.get('racket_id');

  let query = supabaseAdmin
    .from('price_watch')
    .select('id, racket_id, target_price, active, created_at')
    .eq('user_id', user.id);

  if (racketId) {
    query = query.eq('racket_id', parseInt(racketId, 10));
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data || []));
}

async function handleCreate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  let body: any;
  try { body = await readBody(req); } catch {
    return badRequest(res, 'Invalid JSON body');
  }

  const { racket_id, target_price } = body;

  if (!racket_id || target_price == null || target_price <= 0) {
    return badRequest(res, 'racket_id and target_price are required');
  }

  const { data, error } = await supabaseAdmin
    .from('price_watch')
    .insert({
      user_id: user.id,
      racket_id,
      target_price,
    })
    .select('id, racket_id, target_price, active, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Ya tienes una alerta activa para esta pala' }));
      return;
    }
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}
