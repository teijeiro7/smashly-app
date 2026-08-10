import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../../../_lib/supabase';
import {
  getAuthUser, isAdmin, readBody,
  setCorsHeaders, handleOptions, unauthorized, forbidden, badRequest,
} from '../../../../_lib/auth';

/**
 * POST /api/v1/admin/rackets/:id/resolve
 *
 * Resolves a conflict group produced by GET /api/v1/admin/rackets/conflicts
 * (api/_v1/admin/rackets/conflicts.ts, detectConflicts()). The synthetic :id
 * there has the shape `conflict-{relatedId}-{newId}`, where related_racket
 * is the older/existing catalog entry and new_racket is the newer detected
 * duplicate.
 *
 * Body: { action: 'replace' | 'reject' | 'keep_both' }
 *   - replace:  the new (incoming) racket supersedes the existing one —
 *               delete related_racket, keep new_racket.
 *   - reject:   the detected duplicate is discarded — delete new_racket,
 *               keep related_racket.
 *   - keep_both: no destructive action. There is no "resolved conflicts"
 *               table/column in the schema (verified: rackets has no such
 *               flag), so this is an intentional no-op — detectConflicts()
 *               re-derives conflicts from `rackets` on every call, meaning
 *               the pair will simply be re-detected next time the admin
 *               opens the review page. The frontend already removes it from
 *               its local list optimistically after a successful call.
 */
export default async function handler(req: IncomingMessage & { query?: any }, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);
  if (!(await isAdmin(user.id))) return forbidden(res);

  const conflictId = req.query?.id;
  const match = typeof conflictId === 'string' ? conflictId.match(/^conflict-(\d+)-(\d+)$/) : null;
  if (!match) return badRequest(res, 'ID de conflicto inválido');

  const relatedId = Number(match[1]);
  const newId = Number(match[2]);

  let body: any;
  try { body = await readBody(req); } catch {
    return badRequest(res, 'Cuerpo JSON inválido');
  }

  const { action } = body ?? {};
  if (!['replace', 'reject', 'keep_both'].includes(action)) {
    return badRequest(res, "action debe ser 'replace', 'reject' o 'keep_both'");
  }

  try {
    if (action === 'replace') {
      const { error } = await supabaseAdmin.from('rackets').delete().eq('id', relatedId);
      if (error) throw error;
    } else if (action === 'reject') {
      const { error } = await supabaseAdmin.from('rackets').delete().eq('id', newId);
      if (error) throw error;
    }
    // keep_both: intentional no-op, see comment above.

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (err: any) {
    console.error('[rackets/resolve] error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error resolving conflict', details: err?.message }));
  }
}
