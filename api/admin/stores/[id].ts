import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../_lib/supabase';
import { getAuthUser, isAdmin, unauthorized, forbidden } from '../../_lib/auth';

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage & { query?: any }, res: ServerResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);
  if (!(await isAdmin(user.id))) return forbidden(res);

  const storeId = req.query?.id;
  if (!storeId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Store ID required' }));
    return;
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (error) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Store not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data }));
    return;
  }

  if (req.method === 'PATCH') {
    let body: any;
    try { body = await readBody(req); } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid request body' }));
      return;
    }

    const updates: Record<string, unknown> = {};
    if ('verified' in body) updates.verified = Boolean(body.verified);
    if ('name' in body) updates.name = body.name;

    if (Object.keys(updates).length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No fields to update' }));
      return;
    }

    const { data, error } = await supabaseAdmin
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
    res.end(JSON.stringify({ success: true, data }));
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}
