import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../_lib/supabase';
import { getAuthUser, isAdmin, unauthorized, forbidden } from '../_lib/auth';

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
    .eq('verified', true);
  return count || 0;
}

async function getPendingStoresCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from('stores')
    .select('*', { count: 'exact', head: true })
    .eq('verified', false);
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

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);
  if (!(await isAdmin(user.id))) return forbidden(res);

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
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

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
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
    }));
  } catch (err: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error fetching metrics', details: err?.message }));
  }
}
