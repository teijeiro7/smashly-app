import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../_lib/supabase';
import { getAuthUser, isAdmin, readBody, setCorsHeaders, handleOptions, unauthorized, forbidden, badRequest } from '../../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (handleOptions(req, res)) return;

  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);
  if (!(await isAdmin(user.id))) return forbidden(res);

  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const segments = url.pathname.split('/').filter(Boolean);
  const storeId = segments[segments.length - 1];
  if (!storeId) {
    return badRequest(res, 'Store ID required');
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
      return badRequest(res, 'Invalid request body');
    }

    const updates: Record<string, unknown> = {};
    if ('status' in body) {
      if (!['pending', 'verified', 'rejected'].includes(body.status)) {
        return badRequest(res, 'Invalid status value');
      }
      updates.status = body.status;
    }
    if ('rejection_reason' in body) {
      updates.rejection_reason = body.rejection_reason;
    }

    if (Object.keys(updates).length === 0) {
      return badRequest(res, 'No fields to update');
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

    // Notify store owner when status changes
    if (updates.status && store) {
      const title = updates.status === 'verified'
        ? 'Tienda verificada'
        : updates.status === 'rejected'
          ? 'Solicitud de tienda rechazada'
          : 'Estado de tienda actualizado';

      const message = updates.status === 'verified'
        ? 'Tu tienda ha sido verificada. Ya puedes gestionar tu perfil y catálogo.'
        : updates.status === 'rejected'
          ? `Tu solicitud de tienda ha sido rechazada. Motivo: ${body.rejection_reason || 'No especificado'}`
          : 'El estado de tu tienda ha sido actualizado.';

      const { data: owner } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: store.admin_user_id,
          type: 'store_status',
          title,
          message,
          data: { store_id: store.id, status: updates.status, rejection_reason: updates.rejection_reason || null },
        })
        .select()
        .single();
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: store }));
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}
