import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../_lib/supabase';
import { getAuthUser, isAdmin, unauthorized, forbidden, setCorsHeaders, handleOptions } from '../_lib/auth';

interface DashboardMetrics {
  totalUsers: number;
  totalRackets: number;
  totalStores: number;
  totalReviews: number;
  pendingRequests: number;
  activeUsers: number;
  totalFavorites: number;
}

let metricsCache: { data: DashboardMetrics; expiresAt: number } | null = null;

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

    // Single RPC round-trip instead of 7 separate queries (and, for
    // favorites, a 2-hop lists→list_rackets IN() query that grew linearly
    // with the number of users). See
    // supabase/migrations/20260807120000_admin_dashboard_perf.sql for the
    // admin_dashboard_metrics() definition — it is guarded by is_admin()
    // (or the service_role this client authenticates as), so it can't be
    // called directly with a bare anon key.
    const { data, error } = await supabaseAdmin.rpc('admin_dashboard_metrics');
    if (error) throw error;

    const metricsData = data as DashboardMetrics;

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
