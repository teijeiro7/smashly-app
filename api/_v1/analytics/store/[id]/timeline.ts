import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../../../_lib/supabase';
import {
  getAuthUser, isAdmin, getStoreOwnerId,
  setCorsHeaders, handleOptions, unauthorized, forbidden, badRequest,
} from '../../../../_lib/auth';

interface TimelinePoint {
  date: string;
  views: number;
  clicks: number;
}

interface TimelineResponse {
  period: string;
  current: TimelinePoint[];
  previous: TimelinePoint[];
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const segments = url.pathname.split('/').filter(Boolean);
  const storeId = segments[segments.length - 2];
  if (!storeId) {
    return badRequest(res, 'Store ID requerido');
  }

  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  const ownerId = await getStoreOwnerId(storeId);
  if (!ownerId) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Tienda no encontrada' }));
    return;
  }

  if (user.id !== ownerId && !(await isAdmin(user.id))) {
    return forbidden(res);
  }

  const period = url.searchParams.get('period') || '30d';
  const days = parsePeriod(period);

  const current = await getTimeline(storeId, days);
  const previous = await getTimeline(storeId, days, days);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ period, current, previous } satisfies TimelineResponse));
}

function parsePeriod(period: string): number {
  const match = period.match(/^(\d+)(d|day|days)$/i);
  if (!match) return 30;
  return Math.min(Math.max(parseInt(match[1], 10), 1), 365);
}

async function getTimeline(storeId: string, days: number, offsetDays = 0): Promise<TimelinePoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days - offsetDays);

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - offsetDays);

  const { data, error } = await supabaseAdmin
    .from('store_analytics_events')
    .select('event_type, created_at')
    .eq('store_id', storeId)
    .gte('created_at', startDate.toISOString())
    .lt('created_at', endDate.toISOString());

  if (error || !data) {
    console.error('Timeline query failed:', error?.message);
    return [];
  }

  const daily: Record<string, { views: number; clicks: number }> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - days + i + 1);
    const key = d.toISOString().slice(0, 10);
    daily[key] = { views: 0, clicks: 0 };
  }

  for (const row of data) {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    if (daily[key]) {
      if (row.event_type === 'view') daily[key].views += 1;
      else if (row.event_type === 'click') daily[key].clicks += 1;
    }
  }

  return Object.entries(daily).map(([date, counts]) => ({
    date,
    views: counts.views,
    clicks: counts.clicks,
  }));
}
