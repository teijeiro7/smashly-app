import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../_lib/supabase';
import { getAuthUser, isAdmin, unauthorized, forbidden, setCorsHeaders, handleOptions } from '../../_lib/auth';

// Only the columns UsersManager.tsx (frontend/src/components/features/) actually
// renders — id, nickname, full_name, email, role, created_at — instead of select('*')
// pulling every profile column (weight, height, limitations, address, ...) for
// every user on every admin page load.
const USER_LIST_FIELDS = 'id, email, nickname, full_name, role, created_at';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (handleOptions(req, res)) return;

  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);
  if (!(await isAdmin(user.id))) return forbidden(res);

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1), 200);
    const from = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('user_profiles')
      .select(USER_LIST_FIELDS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=30, stale-while-revalidate=120',
    });
    res.end(
      JSON.stringify({
        success: true,
        data: data || [],
        pagination: { page, limit, total: count ?? 0 },
      })
    );
  } catch (err: any) {
    console.error('Error fetching users:', err?.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error fetching users' }));
  }
}
