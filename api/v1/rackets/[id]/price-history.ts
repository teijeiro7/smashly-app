import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../../_lib/supabase';
import { setCorsHeaders, handleOptions } from '../../../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(res);

  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const id = url.pathname.split('/').filter(Boolean).at(-2);
  const days = parseInt(url.searchParams.get('days') || '90', 10);
  const storeId = url.searchParams.get('store');

  if (!id) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Racket ID is required' }));
    return;
  }

  let query = supabaseAdmin
    .from('price_history')
    .select('id, price, created_at, store:store_id(id, store_name)')
    .eq('racket_id', id)
    .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });

  if (storeId) {
    query = query.eq('store_id', storeId);
  }

  const { data, error } = await query;

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data || []));
}
