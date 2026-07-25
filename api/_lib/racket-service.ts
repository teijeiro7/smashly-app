import { supabaseAdmin } from './supabase';

export async function getAllRackets(): Promise<any[]> {
  // Supabase caps a single select at 1000 rows by default. The catalog is
  // larger, so page through with .range() until exhausted to feed the funnel
  // the FULL catalog (otherwise the deterministic filter silently ignores the
  // tail of the table).
  const PAGE = 1000;
  const all: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from('rackets')
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`Error fetching rackets: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return all;
}

/**
 * Cheap signal for "has the catalog changed" — the most recent
 * rackets.updated_at, which the weekly price sync bumps on every write.
 * Used to key the recommendation cache so a sync invalidates it instead of
 * serving last week's prices/ranking for the rest of the 7-day TTL.
 */
export async function getCatalogVersion(): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('rackets')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error || !data?.length) return 'unknown';
  return String(data[0].updated_at);
}

export async function getRacketsByIds(ids: number[]): Promise<any[]> {
  const { data, error } = await supabaseAdmin
    .from('rackets')
    .select('*')
    .in('id', ids);

  if (error) throw new Error(`Error fetching rackets by ids: ${error.message}`);
  return data ?? [];
}
