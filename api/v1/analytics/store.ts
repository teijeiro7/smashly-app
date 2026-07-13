import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../_lib/supabase';
import { getAuthUser, readBody, setCorsHeaders, handleOptions, badRequest } from '../../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  await handleTrack(req, res);
}

async function handleTrack(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  let body: any;
  try { body = await readBody(req); } catch {
    return badRequest(res, 'Invalid JSON body');
  }

  const { store_id, event } = body;

  if (!store_id || !event) {
    return badRequest(res, 'store_id and event are required');
  }

  if (!['view', 'click'].includes(event)) {
    return badRequest(res, 'event must be "view" or "click"');
  }

  const column = event === 'view' ? 'views_count' : 'clicks_count';

  const { error } = await supabaseAdmin.rpc('increment_store_counter', {
    store_id,
    col: column,
  });

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true }));
}
