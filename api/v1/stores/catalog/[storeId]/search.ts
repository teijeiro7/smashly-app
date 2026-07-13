import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../../../_lib/supabase';
import { getAuthUser, readBody, setCorsHeaders, handleOptions, unauthorized, badRequest } from '../../../../_lib/auth';
import { normalizeName, normalizeForComparison } from '../../../../_lib/normalizer';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  await handleSearch(req, res);
}

async function handleSearch(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  let body: any;
  try { body = await readBody(req); } catch {
    return badRequest(res, 'Invalid JSON body');
  }

  const { query, page = 1, limit = 20 } = body;

  if (!query || typeof query !== 'string') {
    return badRequest(res, 'query is required');
  }

  const offset = (page - 1) * limit;

  // Search by name, brand, or model using text search
  const searchTerm = `%${query}%`;
  const { data: rackets, error, count } = await supabaseAdmin
    .from('rackets')
    .select('*', { count: 'exact' })
    .or(`name.ilike.${searchTerm},brand.ilike.${searchTerm},model.ilike.${searchTerm}`)
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  // Score results by relevance (exact match > starts with > contains)
  const normalizedQuery = normalizeForComparison(query).toLowerCase();
  const scored = (rackets || []).map(r => {
    const normalizedName = normalizeForComparison(r.name || '').toLowerCase();
    const normalizedBrand = normalizeForComparison(r.brand || '').toLowerCase();
    const normalizedModel = normalizeForComparison(r.model || '').toLowerCase();

    let score = 0;
    if (normalizedName === normalizedQuery) score = 100;
    else if (normalizedName.startsWith(normalizedQuery)) score = 80;
    else if (normalizedName.includes(normalizedQuery)) score = 60;
    else if (normalizedModel === normalizedQuery) score = 90;
    else if (normalizedModel.startsWith(normalizedQuery)) score = 70;
    else if (normalizedBrand === normalizedQuery) score = 50;
    else if (normalizedBrand.startsWith(normalizedQuery)) score = 40;

    return { ...r, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ data: scored, total: count, page, limit }));
}
