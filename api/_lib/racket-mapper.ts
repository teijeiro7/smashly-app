/**
 * Maps a raw `rackets` row (English DB columns, e.g. `name`, `brand`,
 * `characteristics_shape`, `radar_potencia`) to the Spanish-keyed shape
 * racket-filter.ts, testea-metrics.ts, prompt-compression.ts and
 * comparison.ts are written against (`nombre`, `marca`,
 * `caracteristicas_forma`, `testea_potencia`, ...).
 *
 * Without this, every Spanish-keyed field read against a raw row is
 * `undefined` — Supabase doesn't error on `select('*')` returning
 * differently-named columns, so this was failing completely silently:
 * the deterministic filter's weight/hardness/balance safety checks
 * (racket-filter.ts) treat `undefined` as "no data, skip the check" rather
 * than throwing, so biomechanical safety filtering has been running with
 * every racket's weight and hardness effectively untested.
 *
 * Mirrors frontend/src/services/racketService.ts's mapDbToFrontend(), which
 * already does this same translation for the client-side catalog — kept as
 * a separate implementation because that mapper produces the full frontend
 * `Racket` type (many more fields, e.g. per-store price breakdowns) and
 * runs in a different module (browser bundle) than this server-only one.
 */

function parseImages(imgs: unknown): string[] {
  if (!imgs) return [];
  if (typeof imgs === 'string') {
    try {
      return parseImages(JSON.parse(imgs));
    } catch {
      return imgs.startsWith('http') ? [imgs.trim()] : [];
    }
  }
  if (Array.isArray(imgs)) return imgs.flatMap(parseImages);
  return [];
}

/** specs.Peso is a free-text range like "355-370 gr" — average the numbers found. */
function parseWeight(pesoRaw: unknown): number | undefined {
  if (typeof pesoRaw !== 'string') return undefined;
  const nums = pesoRaw.match(/\d+(\.\d+)?/g);
  if (!nums || nums.length === 0) return undefined;
  const values = nums.map(Number);
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateBestPrice(raw: any): number {
  const prices = [raw.padelnuestro_actual_price, raw.padelmarket_actual_price, raw.padelproshop_actual_price].filter(
    (p): p is number => typeof p === 'number' && p > 0
  );
  return prices.length ? Math.min(...prices) : 0;
}

/** No `radar_confort`/comfort column exists — estimate from hardness, same heuristic as the deterministic fallback. */
function estimateConfort(dureza: string | null): number | undefined {
  if (!dureza) return undefined;
  const d = dureza.toLowerCase();
  let confort = 5;
  if (d.includes('blanda') || d.includes('soft')) confort += 2;
  else if (d.includes('media')) confort += 1;
  return Math.min(10, confort);
}

export function mapRacketRow(raw: any): any {
  const specs = raw.specs ?? {};
  const dureza = raw.characteristics_hardness ?? specs.Dureza ?? null;

  return {
    id: raw.id,
    nombre: raw.name ?? '',
    marca: raw.brand ?? '',
    modelo: raw.model ?? '',
    imagenes: parseImages(raw.images),
    precio_actual: calculateBestPrice(raw),
    peso: parseWeight(specs.Peso),
    caracteristicas_forma: raw.characteristics_shape ?? specs.Forma ?? null,
    caracteristicas_balance: raw.characteristics_balance ?? specs.Balance ?? null,
    caracteristicas_dureza: dureza,
    caracteristicas_nivel_de_juego: raw.characteristics_game_level ?? specs.Nivel ?? null,
    caracteristicas_nucleo: specs['Núcleo'] ?? null,
    caracteristicas_cara: specs.Cara ?? null,
    testea_potencia: raw.radar_potencia ?? undefined,
    testea_control: raw.radar_control ?? undefined,
    testea_manejabilidad: raw.radar_manejabilidad ?? undefined,
    testea_confort: estimateConfort(dureza),
    // No source columns for these — same conclusion the frontend mapper
    // already reached for es_bestseller ("column does not exist in DB").
    tiene_antivibracion: false,
    valoracion_usuarios: undefined,
    es_bestseller: false,
    relacion_calidad_precio: undefined,
  };
}
