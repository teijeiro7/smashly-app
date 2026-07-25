import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../../_lib/supabase';
import { getAuthUser, isAdmin, setCorsHeaders, handleOptions, unauthorized, forbidden } from '../../../_lib/auth';

/**
 * GET /api/v1/admin/rackets/conflicts
 *
 * Detects duplicate rackets in the catalog and returns them as conflict
 * groups for the admin review UI. A conflict is a set of rackets that share
 * a normalized (brand, model) signature — stripped of year, accents, "(pala)"
 * noise and country-name variants.
 *
 * Frontend shape (consumed by AdminRacketReviewPage + AdminDashboard counter):
 *   {
 *     id: string,            // synthetic group id
 *     created_at: string,    // ISO date of the newest entry in the group
 *     related_racket: {...}, // the older/existing racket
 *     new_racket: {...}      // the newer/proposed duplicate
 *   }
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

  try {
    const conflicts = await detectConflicts();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: conflicts }));
  } catch (err: any) {
    console.error('[rackets/conflicts] error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error detecting conflicts', details: err?.message }));
  }
}

const VARIANT_SUFFIXES = ['fdb', 'woman', 'w', 'light', 'lite', 'junior', 'jr', 'xtra', 'ctrl', 'motion'];

const BRAND_ALIASES: Record<string, string> = {
  'vibor-a': 'vibor-a',
  vibora: 'vibor-a',
  víbora: 'vibor-a',
  starvie: 'starvie',
  'star vie': 'starvie',
  dropshot: 'drop shot',
  'drop shot': 'drop shot',
  blackcrown: 'black crown',
  'black crown': 'black crown',
  'royal padel': 'royal padel',
  royalpadel: 'royal padel',
};

const COUNTRY_MAP: Record<string, string> = {
  'españa': 'spain',
  espana: 'spain',
  italia: 'italy',
  mexico: 'mexico',
  'méxico': 'mexico',
  holanda: 'netherlands',
  alemania: 'germany',
  francia: 'france',
  belgica: 'belgium',
  'bélgica': 'belgium',
  inglaterra: 'england',
  eeuu: 'usa',
};

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeNameBase(s: string): string {
  if (!s) return '';
  let n = s.toLowerCase().trim();
  n = stripAccents(n);
  n = n.replace(/\s*\([^)]*\)\s*/g, ' '); // (pala), (padel), etc.
  n = n.replace(/\bpala\b/g, '');
  n = n.replace(/(?<=\w)-(?=\w)/g, ''); // carb-on → carbon
  n = n.replace(/\s+by\s+[a-z]+(?:\s+[a-z]+)*/g, ''); // "by agustin tapia"
  n = n.replace(/\b(alum|aluminio)\b/g, '');
  for (const [local, canonical] of Object.entries(COUNTRY_MAP)) {
    const re = new RegExp(`\\b${local.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    n = n.replace(re, canonical);
  }
  n = n.replace(/\s+/g, ' ').trim();
  return n;
}

function normalizeBrand(brand: string): string {
  const key = stripAccents(brand.toLowerCase().trim());
  return BRAND_ALIASES[key] ?? key;
}

function extractYear(s: string): string | null {
  const m = s.match(/\b(20[12]\d)\b/);
  return m ? m[1] : null;
}

function getVariantSuffix(name: string): string {
  const base = normalizeNameBase(name);
  for (const v of VARIANT_SUFFIXES) {
    const re = new RegExp(`\\b${v}\\b`);
    if (re.test(base)) return v;
  }
  return '';
}

interface RacketLite {
  id: number;
  brand: string;
  model: string;
  name: string;
  slug: string;
  created_at: string;
  padelproshop_actual_price?: number | null;
  padelnuestro_actual_price?: number | null;
  padelmarket_actual_price?: number | null;
  [k: string]: any;
}

async function fetchAllRacketsLite(): Promise<RacketLite[]> {
  const PAGE = 1000;
  const cols =
    'id, brand, model, name, slug, created_at, ' +
    'padelproshop_actual_price, padelnuestro_actual_price, padelmarket_actual_price';
  const all: RacketLite[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from('rackets')
      .select(cols)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`fetch rackets: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as unknown as RacketLite[]));
    if (data.length < PAGE) break;
  }
  return all;
}

interface ConflictGroup {
  id: string;
  created_at: string;
  related_racket: RacketLite;
  new_racket: RacketLite;
  duplicate_count: number;
}

async function detectConflicts(): Promise<ConflictGroup[]> {
  const rows = await fetchAllRacketsLite();
  if (rows.length === 0) return [];

  // 1st pass: pre-group by (brand, name-base-without-year, variant)
  const preGroups = new Map<string, RacketLite[]>();
  for (const r of rows) {
    const rawName = r.model || r.name || '';
    const base = normalizeNameBase(rawName);
    const baseNoYear = base.replace(/\b20[12]\d\b/g, '').trim();
    const variant = getVariantSuffix(rawName);
    const brand = normalizeBrand(r.brand || '');
    const key = `${brand}__${baseNoYear}__${variant}`;
    if (!preGroups.has(key)) preGroups.set(key, []);
    preGroups.get(key)!.push(r);
  }

  // 2nd pass: within each pre-group, split by year compatibility
  const conflicts: ConflictGroup[] = [];
  for (const [, entries] of preGroups) {
    if (entries.length < 2) continue;

    const yearBuckets = new Map<string, RacketLite[]>();
    const noYear: RacketLite[] = [];

    for (const e of entries) {
      const yr = extractYear(e.model || e.name || '');
      if (yr) {
        if (!yearBuckets.has(yr)) yearBuckets.set(yr, []);
        yearBuckets.get(yr)!.push(e);
      } else {
        noYear.push(e);
      }
    }

    let bucket: RacketLite[] = [];
    if (yearBuckets.size === 0) {
      bucket = noYear;
    } else if (yearBuckets.size === 1) {
      bucket = [...yearBuckets.values()][0].concat(noYear);
    } else {
      // Multiple years present — pick the bucket with the most entries
      let best: RacketLite[] = [];
      for (const v of yearBuckets.values()) if (v.length > best.length) best = v;
      bucket = best.concat(noYear);
    }

    if (bucket.length < 2) continue;

    bucket.sort((a, b) => (a.id < b.id ? -1 : 1));
    const [related, ...rest] = bucket;
    const newest = rest.reduce((acc, cur) => (cur.id > acc.id ? cur : acc), rest[0]);

    conflicts.push({
      id: `conflict-${related.id}-${newest.id}`,
      created_at: newest.created_at || new Date().toISOString(),
      related_racket: related,
      new_racket: newest,
      duplicate_count: bucket.length,
    });
  }

  conflicts.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return conflicts;
}
