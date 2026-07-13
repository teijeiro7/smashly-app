import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../_lib/supabase';
import { getAuthUser, isAdmin, setCorsHeaders, handleOptions, unauthorized, forbidden } from '../../_lib/auth';

/**
 * GET /api/v1/admin/recent-activity?limit=N
 *
 * Aggregates the most recent system events for the admin dashboard feed.
 * Frontend `Activity` shape: { id, type, title, time, icon } where
 *   type ∈ 'user' | 'racket' | 'review' | 'store'
 *
 * Source of truth is the `notifications` table (service role bypasses RLS,
 * so we can read every row regardless of the original user_id). For
 * notification types that the system has not yet started writing (e.g.
 * new_user) we fall back to direct table scans of the same age window so
 * the dashboard is never empty on a fresh install.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);
  if (!(await isAdmin(user.id))) return forbidden(res);

  const limit = Math.min(
    Math.max(parseInt((new URL(req.url || '', `http://${req.headers.host}`)).searchParams.get('limit') || '20', 10) || 20, 1),
    100,
  );

  try {
    const activities = await loadRecentActivity(limit);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: activities }));
  } catch (err: any) {
    console.error('[recent-activity] error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error fetching recent activity', details: err?.message }));
  }
}

type ActivityType = 'user' | 'racket' | 'review' | 'store';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  time: string;
  icon: string;
}

const NOTIF_TYPE_MAP: Record<string, { type: ActivityType; icon: string }> = {
  new_store: { type: 'store', icon: '🏪' },
  store_status: { type: 'store', icon: '🏪' },
  new_user: { type: 'user', icon: '👤' },
  new_message: { type: 'store', icon: '💬' },
  review: { type: 'review', icon: '⭐' },
  review_reply: { type: 'review', icon: '⭐' },
  price_drop: { type: 'racket', icon: '💸' },
  comparison_complete: { type: 'racket', icon: '🔄' },
  recommendation_complete: { type: 'racket', icon: '🤖' },
  admin_update: { type: 'store', icon: '🛠' },
};

async function loadRecentActivity(limit: number): Promise<Activity[]> {
  // 1) Notifications (preferred — already system-generated, semantically typed)
  const { data: notifs, error: notifsErr } = await supabaseAdmin
    .from('notifications')
    .select('id, type, title, message, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (notifsErr) {
    console.warn('[recent-activity] notifications query failed:', notifsErr.message);
  }

  const fromNotifs: Activity[] = (notifs || []).map((n: any) => {
    const mapping = NOTIF_TYPE_MAP[n.type] ?? { type: 'store' as ActivityType, icon: '🔔' };
    return {
      id: `notif-${n.id}`,
      type: mapping.type,
      title: n.title || n.message || n.type,
      time: n.created_at,
      icon: mapping.icon,
    };
  });

  if (fromNotifs.length >= limit) return fromNotifs;

  // 2) Fallback: synthesize from raw tables so the dashboard isn't empty
  //    when the notifications pipeline hasn't yet been wired for a row type.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const remaining = limit - fromNotifs.length;
  const fallback: Activity[] = [];

  const [{ data: recentUsers }, { data: recentReviews }, { data: recentStores }] = await Promise.all([
    supabaseAdmin
      .from('user_profiles')
      .select('id, nickname, full_name, email, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(remaining),
    supabaseAdmin
      .from('reviews')
      .select('id, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(remaining),
    supabaseAdmin
      .from('stores')
      .select('id, store_name, status, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(remaining),
  ]);

  for (const u of recentUsers || []) {
    fallback.push({
      id: `user-${u.id}`,
      type: 'user',
      title: `Nuevo usuario: ${u.nickname || u.full_name || u.email || 'Anónimo'}`,
      time: u.created_at,
      icon: '👤',
    });
  }
  for (const r of recentReviews || []) {
    fallback.push({
      id: `review-${r.id}`,
      type: 'review',
      title: 'Nueva reseña publicada',
      time: r.created_at,
      icon: '⭐',
    });
  }
  for (const s of recentStores || []) {
    fallback.push({
      id: `store-fb-${s.id}`,
      type: 'store',
      title: `Tienda "${s.store_name}" (${s.status})`,
      time: s.created_at,
      icon: '🏪',
    });
  }

  return [...fromNotifs, ...fallback]
    .sort((a, b) => (a.time < b.time ? 1 : -1))
    .slice(0, limit);
}
