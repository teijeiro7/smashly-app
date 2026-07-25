import { supabaseAdmin } from './supabase';

// Columns actually read by the recommendation pipeline (racket-filter.ts,
// testea-metrics.ts, prompt-compression.ts, and the enrich* functions in
// generate.ts/generate-rag.ts). getAllRackets() is only used for that
// pipeline — comparison.ts fetches its own (≤3 row) set via
// getRacketsByIds() and needs the full row, which is untouched here.
const RECOMMENDATION_COLUMNS = [
  'id',
  'nombre',
  'marca',
  'precio_actual',
  'imagenes',
  'peso',
  'caracteristicas_forma',
  'caracteristicas_balance',
  'caracteristicas_dureza',
  'caracteristicas_nivel_de_juego',
  'testea_certificado',
  'testea_potencia',
  'testea_control',
  'testea_manejabilidad',
  'testea_confort',
  'testea_iniciacion',
  'tiene_antivibracion',
  'valoracion_usuarios',
  'es_bestseller',
  'relacion_calidad_precio',
].join(', ');

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
      .select(RECOMMENDATION_COLUMNS)
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
