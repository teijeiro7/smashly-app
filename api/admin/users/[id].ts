import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../_lib/supabase';
import { getAuthUser, isAdmin, unauthorized, forbidden } from '../../_lib/auth';

function getUserId(url: string): string | null {
  // Vercel passes the dynamic segment via query, or we can parse from URL
  const u = new URL(url, 'http://localhost');
  const pathParts = u.pathname.split('/');
  // /api/admin/users/<id>
  return pathParts[pathParts.length - 1] || null;
}

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);
  if (!(await isAdmin(user.id))) return forbidden(res);

  // Vercel injects dynamic segments into req.query
  const targetUserId = req.query?.id || getUserId(req.url || '');
  if (!targetUserId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'User ID required' }));
    return;
  }

  // GET — fetch single user
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (error) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'User not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data }));
    return;
  }

  // PATCH — update role
  if (req.method === 'PATCH') {
    let body: any;
    try { body = await readBody(req); } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid request body' }));
      return;
    }

    const { role } = body;
    const normalizedRole = role?.toString().charAt(0).toUpperCase() + role?.toString().slice(1).toLowerCase();
    if (!normalizedRole || !['Admin', 'Player', 'Store'].includes(normalizedRole)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "El rol debe ser 'Admin', 'Player' o 'Store'" }));
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({ role: normalizedRole })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user role:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error al actualizar el rol' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data, message: 'Rol actualizado correctamente' }));
    return;
  }

  // DELETE — delete user
  if (req.method === 'DELETE') {
    if (targetUserId === user.id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No puedes eliminar tu propia cuenta' }));
      return;
    }

    // Delete from auth.users via admin (cascades to user_profiles via trigger/FK)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (authError) {
      console.error('Error deleting user:', authError.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error al eliminar el usuario' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Usuario eliminado correctamente' }));
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}
