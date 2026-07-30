import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../../_lib/supabase';
import { getAuthUser, setCorsHeaders, handleOptions, unauthorized } from '../../../_lib/auth';

/**
 * GET /api/v1/users/me/activity
 *
 * Self-service activity summary for the authenticated user's profile page
 * (UserProfilePage.tsx, loadActivity()). Aggregates counts + the 3 most
 * recent rows from `reviews`, `lists` and `comparisons` (the actual tables
 * behind reviewService.ts / listService.ts / comparisonService.ts).
 *
 * Uses supabaseAdmin (service role) even though this is self-service data —
 * matches the pattern already used by every other _v1 handler, and avoids
 * depending on RLS from the server side. Everything is explicitly filtered
 * by `user_id = user.id` below, so no other user's data can leak.
 *
 * Response shape consumed by ActivityStats.tsx:
 *   { stats: { reviewsCount, listsCount, comparisonsCount },
 *     recentReviews: [{ id, rating, created_at, rackets: { nombre, marca, slug } }],
 *     recentLists: [{ id, name, is_public, created_at }],
 *     recentComparisons: [{ id, racket_ids, is_public, created_at }] }
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

  try {
    const [reviewsCountRes, listsCountRes, comparisonsCountRes, reviewsRes, listsRes, comparisonsRes] =
      await Promise.all([
        supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabaseAdmin.from('lists').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabaseAdmin.from('comparisons').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabaseAdmin
          .from('reviews')
          .select('id, rating, created_at, rackets(name, brand, slug)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabaseAdmin
          .from('lists')
          .select('id, name, is_public, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabaseAdmin
          .from('comparisons')
          .select('id, racket_ids, is_public, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

    for (const r of [reviewsCountRes, listsCountRes, comparisonsCountRes, reviewsRes, listsRes, comparisonsRes]) {
      if (r.error) throw r.error;
    }

    const recentReviews = (reviewsRes.data || []).map((r: any) => ({
      id: r.id,
      rating: r.rating,
      created_at: r.created_at,
      rackets: r.rackets
        ? { nombre: r.rackets.name ?? '', marca: r.rackets.brand ?? '', slug: r.rackets.slug ?? '' }
        : undefined,
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        stats: {
          reviewsCount: reviewsCountRes.count ?? 0,
          listsCount: listsCountRes.count ?? 0,
          comparisonsCount: comparisonsCountRes.count ?? 0,
        },
        recentReviews,
        recentLists: listsRes.data || [],
        recentComparisons: comparisonsRes.data || [],
      },
    }));
  } catch (err: any) {
    console.error('[users/me/activity] error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error fetching activity', details: err?.message }));
  }
}
