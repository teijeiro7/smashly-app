import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../_lib/supabase';
import { getAuthUser, isAdmin, unauthorized, forbidden, setCorsHeaders, handleOptions } from '../_lib/auth';

async function getTableCount(table: string): Promise<number> {
  const { count } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
  return count || 0;
}

async function getActiveUsersCount(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { count } = await supabaseAdmin
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .gte('updated_at', thirtyDaysAgo.toISOString());
  return count || 0;
}

async function getVerifiedStoresCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from('stores')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'verified');
  return count || 0;
}

async function getPendingStoresCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from('stores')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  return count || 0;
}

async function getFavoritesCount(): Promise<number> {
  const { data: favLists } = await supabaseAdmin
    .from('lists')
    .select('id')
    .eq('name', 'Favoritas');
  if (!favLists?.length) return 0;
  const listIds = favLists.map((l: any) => l.id);
  const { count } = await supabaseAdmin
    .from('list_rackets')
    .select('*', { count: 'exact', head: true })
    .in('list_id', listIds);
  return count || 0;
}

let metricsCache: { data: any; expiresAt: number } | null = null;

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
    const now = Date.now();
    if (metricsCache && metricsCache.expiresAt > now) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60, s-maxage=60, stale-while-revalidate=300',
      });
      res.end(JSON.stringify({ success: true, data: metricsCache.data }));
      return;
    }

    const [
      totalUsers,
      totalRackets,
      totalReviews,
      activeUsers,
      totalStores,
      pendingRequests,
      totalFavorites,
    ] = await Promise.all([
      getTableCount('user_profiles'),
      getTableCount('rackets'),
      getTableCount('reviews'),
      getActiveUsersCount(),
      getVerifiedStoresCount(),
      getPendingStoresCount(),
      getFavoritesCount(),
    ]);

    const metricsData = {
      totalUsers,
      totalRackets,
      totalStores,
      totalReviews,
      pendingRequests,
      activeUsers,
      totalFavorites,
      usersChange: 0,
      racketsChange: 0,
      reviewsChange: 0,
      activeUsersChange: 0,
    };

    metricsCache = { data: metricsData, expiresAt: now + 60 * 1000 };

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=60, s-maxage=60, stale-while-revalidate=300',
    });
    res.end(
      JSON.stringify({
        success: true,
        data: metricsData,
      })
    );
  } catch (err: any) {
    console.error('Error fetching metrics:', err?.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error fetching metrics' }));
  }
}
