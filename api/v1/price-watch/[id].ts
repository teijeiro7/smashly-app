import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../_lib/supabase';
import { getAuthUser, setCorsHeaders, handleOptions, unauthorized, forbidden } from '../../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(res);

  if (handleOptions(req, res)) return;

  if (req.method === 'DELETE') {
    await handleDelete(req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

async function handleDelete(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const id = url.pathname.split('/').filter(Boolean).pop();

  if (!id) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Watch ID is required' }));
    return;
  }

  const { data: watch } = await supabaseAdmin
    .from('price_watch')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!watch) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  if (watch.user_id !== user.id) {
    return forbidden(res);
  }

  const { error } = await supabaseAdmin
    .from('price_watch')
    .delete()
    .eq('id', id);

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true }));
}
