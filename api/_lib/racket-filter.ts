/** Ported from backend/api/src/services/racketFilterService.ts */
import { getTesteaMetrics } from './testea-metrics';

// ─── Public exports ──────────────────────────────────────────────────────────

/**
 * Filter and score all rackets against a player profile.
 * Returns entries sorted by score descending (best first).
 */
export function filterRacketsWithScores(
  allRackets: any[],
  profile: any
): Array<{ racket: any; score: number }> {
  let filtered = [...allRackets];

  // 1. Biomechanical filter — first, non-negotiable
  const { safe } = applyBiomechanicalFilter(filtered, profile);
  filtered = safe;

  if (filtered.length === 0) return [];

  // 2. In-stock only
  if (profile.only_in_stock) {
    filtered = filtered.filter((r: any) => !!r.precio_actual);
  }

  // 3. Budget — revert if too few remain
  const afterBudget = filterByBudget(filtered, profile.budget);
  if (afterBudget.length >= 5) filtered = afterBudget;

  // 4. Level — revert if too few remain
  const afterLevel = filterByLevel(filtered, profile.level);
  if (afterLevel.length >= 3) filtered = afterLevel;

  // 5. Play style (advanced) — soft filter, reverts if insufficient matches
  if ('play_style' in profile) {
    const byStyle = filterByPlayStyle(filtered, profile);
    if (byStyle.length > 0) filtered = byStyle;
  }

  // 6. Score + diversity
  const scored = filtered.map((racket: any) => ({
    racket,
    score: calculateMatchScore(racket, profile),
  }));
  scored.sort((a, b) => b.score - a.score);

  return ensureDiversity(scored, 40);
}

/**
 * Backward-compatible wrapper — returns only the racket array.
 */
export function filterRackets(allRackets: any[], profile: any): any[] {
  return filterRacketsWithScores(allRackets, profile).map((s: any) => s.racket);
}

// ─── Biomechanical safety ────────────────────────────────────────────────────

function calculateSafeWeightRange(profile: any): { min: number; max: number } {
  let baselineMax = profile.gender === 'femenino' ? 360 : 365;
  const min = 340;
  let max = baselineMax;

  if (profile.physical_condition === 'ocasional') max -= 5;

  const isBeginnerLevel =
    (profile.level || '').toLowerCase().includes('principiante') ||
    (profile.level || '').toLowerCase().includes('iniciación') ||
    (profile.level || '').toLowerCase().includes('iniciacion');
  if (isBeginnerLevel) {
    max = Math.min(max, profile.gender === 'femenino' ? 360 : 365);
  }

  const hasInjuries = profile.injuries && profile.injuries !== 'no';
  if (hasInjuries) {
    max = Math.min(max, profile.gender === 'femenino' ? 355 : 360);
  }

  return { min, max };
}

function applyBiomechanicalFilter(
  rackets: any[],
  profile: any
): { safe: any[]; discarded: any[]; reasons: Record<string, string> } {
  const { min, max } = calculateSafeWeightRange(profile);
  const hasInjuries = profile.injuries && profile.injuries !== 'no';
  const safe: any[] = [];
  const discarded: any[] = [];
  const reasons: Record<string, string> = {};

  for (const racket of rackets) {
    const peso = racket.peso;
    const dureza = (racket.caracteristicas_dureza || '').toLowerCase();
    const balance = (racket.caracteristicas_balance || '').toLowerCase();
    let isSafe = true;
    const reasonParts: string[] = [];

    // Weight check — only when data is available
    if (peso !== null && peso !== undefined) {
      if (peso < min || peso > max) {
        isSafe = false;
        reasonParts.push(`peso ${peso}g fuera del rango seguro ${min}-${max}g`);
      }
    }

    if (hasInjuries) {
      if (dureza.includes('dura') || dureza.includes('hard')) {
        isSafe = false;
        reasonParts.push(`dureza "${dureza}" no recomendada para lesiones`);
      }
      if (balance.includes('alto') || balance.includes('high')) {
        isSafe = false;
        reasonParts.push(`balance "${balance}" no recomendado para lesiones`);
      }
    }

    if (isSafe) {
      safe.push(racket);
    } else {
      discarded.push(racket);
      reasons[racket.id] = reasonParts.join(', ');
    }
  }

  // Relax if too few pass
  if (safe.length < 5 && discarded.length > 0) {
    const relaxed = discarded
      .filter((r: any) => {
        const peso = r.peso;
        if (peso === null || peso === undefined) return true;
        return peso >= min && peso <= max + 10;
      })
      .slice(0, 10);
    safe.push(...relaxed);
  }

  return { safe, discarded, reasons };
}

// ─── Hard filters ────────────────────────────────────────────────────────────

function filterByBudget(rackets: any[], budget: any): any[] {
  let maxBudget: number;

  if (typeof budget === 'object' && 'max' in budget) {
    maxBudget = budget.max;
  } else if (typeof budget === 'string') {
    const match = budget.match(/\d+/g);
    maxBudget = match ? parseInt(match[match.length - 1]) : 999;
  } else if (typeof budget === 'number') {
    maxBudget = budget;
  } else {
    return rackets;
  }

  return rackets.filter((r: any) => !r.precio_actual || r.precio_actual <= maxBudget);
}

function filterByLevel(rackets: any[], level: string): any[] {
  if (!level) return rackets;
  const levelLower = level.toLowerCase();
  const levelMap: Record<string, string[]> = {
    principiante: ['iniciación', 'iniciacion', 'principiante', 'básico', 'basico', 'todos'],
    iniciación:   ['iniciación', 'iniciacion', 'principiante', 'básico', 'basico', 'todos'],
    medio:        ['intermedio', 'medio', 'avanzado', 'todos'],
    intermedio:   ['intermedio', 'medio', 'avanzado', 'todos'],
    avanzado:     ['avanzado', 'profesional', 'competición', 'competicion', 'todos'],
    profesional:  ['avanzado', 'profesional', 'competición', 'competicion', 'todos'],
  };

  const target = Object.keys(levelMap).find(k => levelLower.includes(k));
  if (!target) return rackets;

  const allowed = levelMap[target];
  return rackets.filter((r: any) => {
    const rLevel = (r.caracteristicas_nivel_de_juego || '').toLowerCase();
    return !rLevel || allowed.some(a => rLevel.includes(a));
  });
}

/**
 * Normalize wizard style values ('control', 'potencia', 'equilibrado')
 * to the internal filter idiom ('defensivo', 'ofensivo', 'polivalente').
 * Also passes through values already in the internal idiom.
 */
function normalizePlayStyle(raw: string): string {
  const map: Record<string, string> = {
    control:     'defensivo',
    potencia:    'ofensivo',
    equilibrado: 'polivalente',
  };
  const lower = raw.toLowerCase();
  return map[lower] ?? lower;
}

function filterByPlayStyle(rackets: any[], profile: any): any[] {
  const rawStyle = profile.play_style || '';
  if (!rawStyle) return rackets;
  const style = normalizePlayStyle(rawStyle);

  const formaPreference = (profile.shape_preference || '').toLowerCase();
  const balancePreference = (profile.balance_preference || '').toLowerCase();

  let filtered = rackets;

  // Shape preference takes priority over inferred style shape
  if (formaPreference && formaPreference !== 'no_se') {
    const prefNorm = formaPreference === 'lagrima' ? 'lagrima' : formaPreference;
    const byShape = rackets.filter((r: any) => {
      const forma = (r.caracteristicas_forma || '').toLowerCase();
      return forma.includes(prefNorm) || (formaPreference === 'lagrima' && forma.includes('lágrima'));
    });
    if (byShape.length >= 5) filtered = byShape;
  } else if (style === 'ofensivo') {
    const byStyle = rackets.filter((r: any) => {
      const forma = (r.caracteristicas_forma || '').toLowerCase();
      return forma.includes('diamante') || forma.includes('lágrima') || forma.includes('lagrima');
    });
    if (byStyle.length >= 5) filtered = byStyle;
  } else if (style === 'defensivo') {
    const byStyle = rackets.filter((r: any) =>
      (r.caracteristicas_forma || '').toLowerCase().includes('redonda')
    );
    if (byStyle.length >= 5) filtered = byStyle;
  }

  if (balancePreference && balancePreference !== 'no_se') {
    const byBalance = filtered.filter((r: any) =>
      (r.caracteristicas_balance || '').toLowerCase().includes(balancePreference)
    );
    if (byBalance.length >= 5) filtered = byBalance;
  }

  return filtered;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Score a racket against a player profile.
 *
 * Weight summary (max points):
 *
 * Player-fit signals (always active — basic + advanced):
 *   touch_preference ↔ dureza    : 12
 *   level exactness               : 12
 *   quality-price ratio           :  8
 *
 * Player-fit signals (advanced only):
 *   shape_preference              : 10
 *   balance_preference            : 10
 *   weight_preference             :  8
 *   goals / objectives            : up to 6 per goal (max 36 for all 6 goals)
 *   play_style alignment          :  8
 *
 * Generic quality signals (always active):
 *   budget fit                    : 20
 *   testea certification          : 15
 *   characteristic_priorities     : up to 33 (advanced)
 *   user rating                   : 10
 *   bestseller                    :  5
 */
function calculateMatchScore(racket: any, profile: any): number {
  let score = 0;
  const metrics = getTesteaMetrics(racket);

  // ── Budget fit (max 20) ────────────────────────────────────────────────────
  if (racket.precio_actual) {
    const maxBudget =
      typeof profile.budget === 'object' && 'max' in profile.budget
        ? profile.budget.max
        : typeof profile.budget === 'number'
          ? profile.budget
          : 999;
    if (racket.precio_actual <= maxBudget * 0.8) score += 20;
    else if (racket.precio_actual <= maxBudget) score += 10;
  }

  // ── Testea certification (max 15) ──────────────────────────────────────────
  if (racket.testea_certificado) score += 15;

  // ── User rating (max 10) ───────────────────────────────────────────────────
  if (racket.valoracion_usuarios) {
    score += (racket.valoracion_usuarios / 5) * 10;
  }

  // ── Bestseller (max 5) ─────────────────────────────────────────────────────
  if (racket.es_bestseller) score += 5;

  // ── Quality-price ratio (max 8) ────────────────────────────────────────────
  if (racket.relacion_calidad_precio) {
    score += (racket.relacion_calidad_precio / 10) * 8;
  }

  // ── Touch preference ↔ dureza alignment (max 12) ──────────────────────────
  // Applies to all profiles — touch_preference is collected in the basic wizard.
  const touch = (profile.touch_preference || '').toLowerCase();
  if (touch) {
    const dureza = (racket.caracteristicas_dureza || '').toLowerCase();
    if (touch === 'duro') {
      if (dureza.includes('dura') || dureza.includes('hard')) score += 12;
      else if (dureza.includes('media')) score += 4;
    } else if (touch === 'blando') {
      if (dureza.includes('blanda') || dureza.includes('soft')) score += 12;
      else if (dureza.includes('media')) score += 4;
    } else if (touch === 'medio') {
      if (dureza.includes('media')) score += 12;
      else if (dureza.includes('blanda') || dureza.includes('soft')) score += 6;
      else if (dureza.includes('dura') || dureza.includes('hard')) score += 6;
    }
  }

  // ── Level exactness (max 12) ───────────────────────────────────────────────
  // filterByLevel ensures the racket is appropriate for the level; here we
  // reward rackets whose declared level exactly matches the player's level.
  {
    const userLevel = (profile.level || '').toLowerCase();
    const racketLevel = (racket.caracteristicas_nivel_de_juego || '').toLowerCase();
    if (racketLevel && userLevel) {
      if (racketLevel.includes(userLevel)) {
        score += 12; // exact label match
      } else if (racketLevel.includes('todos')) {
        score += 6;  // designed for all levels
      } else {
        score += 3;  // adjacent level (still safe per filterByLevel)
      }
    }
  }

  // ── Priority alignment (advanced, max ~33) ─────────────────────────────────
  if ('characteristic_priorities' in profile && profile.characteristic_priorities?.length) {
    const metricMap: Record<string, string> = {
      potencia:      'testea_potencia',
      control:       'testea_control',
      manejabilidad: 'testea_manejabilidad',
    };
    profile.characteristic_priorities.slice(0, 3).forEach((priority: string, i: number) => {
      const col = metricMap[priority];
      if (col && racket[col] !== undefined) {
        score += (racket[col] / 10) * (15 - i * 4);
      }
    });
  }

  // ── Shape preference scoring (advanced, max 10) ────────────────────────────
  if (profile.shape_preference && profile.shape_preference !== 'no_se') {
    const pref = profile.shape_preference.toLowerCase();
    const forma = (racket.caracteristicas_forma || '').toLowerCase();
    const prefNorm = pref === 'lagrima' ? 'lagrima' : pref;
    if (forma.includes(prefNorm) || (pref === 'lagrima' && forma.includes('lágrima'))) {
      score += 10;
    }
  }

  // ── Balance preference scoring (advanced, max 10) ──────────────────────────
  if (profile.balance_preference && profile.balance_preference !== 'no_se') {
    const pref = profile.balance_preference.toLowerCase();
    const balance = (racket.caracteristicas_balance || '').toLowerCase();
    if (balance.includes(pref)) score += 10;
  }

  // ── Weight preference scoring (advanced, max 8) ────────────────────────────
  if (profile.weight_preference && profile.weight_preference !== 'no_se' && racket.peso) {
    const pref = profile.weight_preference.toLowerCase();
    const peso = racket.peso;
    if (pref === 'ligera' && peso < 360) score += 8;
    else if (pref === 'media' && peso >= 360 && peso <= 375) score += 8;
    else if (pref === 'pesada' && peso > 375) score += 8;
  }

  // ── Play style alignment (advanced, max 8) ─────────────────────────────────
  // Adds a scoring signal on top of filterByPlayStyle so style-matching rackets
  // still surface even when the hard filter reverts due to insufficient results.
  if (profile.play_style) {
    const style = normalizePlayStyle(profile.play_style);
    const forma = (racket.caracteristicas_forma || '').toLowerCase();
    if (style === 'ofensivo') {
      if (forma.includes('diamante')) score += 8;
      else if (forma.includes('lágrima') || forma.includes('lagrima')) score += 4;
    } else if (style === 'defensivo') {
      if (forma.includes('redonda')) score += 8;
      else if (forma.includes('lágrima') || forma.includes('lagrima')) score += 4;
    } else if (style === 'polivalente') {
      if (forma.includes('lágrima') || forma.includes('lagrima')) score += 8;
      else if (forma.includes('redonda') || forma.includes('diamante')) score += 4;
    }
  }

  // ── Goals / objectives (advanced, max 6 per goal) ─────────────────────────
  // Wizard multi-select values: 'Más potencia' | 'Más control' | 'Menos lesiones'
  //                             'Mejorar técnica' | 'Subir de nivel' | 'Durabilidad'
  // normalizeFormData maps `goals` → `objectives`; we handle both keys for safety.
  const goals: string[] = profile.objectives || profile.goals || [];
  for (const goal of goals) {
    switch (goal) {
      case 'Más potencia':
        score += (metrics.potencia / 10) * 6;
        break;
      case 'Más control':
        score += (metrics.control / 10) * 6;
        break;
      case 'Menos lesiones':
        // Reward comfort metrics and anti-vibration technology
        score += (metrics.confort / 10) * 4;
        if (racket.tiene_antivibracion) score += 2;
        break;
      case 'Mejorar técnica':
        // Maneuverability helps execute strokes correctly during learning
        score += (metrics.manejabilidad / 10) * 6;
        break;
      case 'Subir de nivel':
        // Certified, bestseller rackets support player development
        if (metrics.certificado) score += 4;
        if (racket.es_bestseller) score += 2;
        break;
      case 'Durabilidad':
        // Quality-certified rackets with good value-price ratio tend to last
        if (metrics.certificado) score += 3;
        if (racket.relacion_calidad_precio) {
          score += (racket.relacion_calidad_precio / 10) * 3;
        }
        break;
    }
  }

  return score;
}

function ensureDiversity(scored: any[], maxCount: number): any[] {
  if (scored.length <= maxCount) return scored;

  const brands = new Map<string, number>();
  const result: any[] = [];

  for (const item of scored) {
    if (result.length >= maxCount) break;
    const brand = item.racket.marca;
    const count = brands.get(brand) || 0;
    if (count < 5) {
      result.push(item);
      brands.set(brand, count + 1);
    }
  }

  return result;
}

// ─── Biomechanical safety assessment (used by generate.ts) ───────────────────

export function assessBiomechanicalSafety(racket: any, profile: any): any {
  const dureza = (racket.caracteristicas_dureza || '').toLowerCase();
  const balance = (racket.caracteristicas_balance || '').toLowerCase();
  const peso = racket.peso || 365;
  const hasInjuries = profile.injuries && profile.injuries !== 'no';
  const { min, max } = calculateSafeWeightRange(profile);

  const weightAppropriate = racket.peso ? peso >= min && peso <= max : true;
  const balanceAppropriate = hasInjuries ? !balance.includes('alto') : true;
  const hardnessAppropriate = hasInjuries
    ? !dureza.includes('dura') && !dureza.includes('hard')
    : true;
  const isSafe = weightAppropriate && balanceAppropriate && hardnessAppropriate;

  let safetyNotes = '';
  if (hasInjuries && racket.tiene_antivibracion) {
    safetyNotes = 'Incluye tecnología anti-vibración, ideal para prevenir lesiones.';
  } else if (hasInjuries) {
    safetyNotes = 'Características suaves que minimizan el riesgo de lesión.';
  }

  return {
    is_safe: isSafe,
    weight_appropriate: weightAppropriate,
    balance_appropriate: balanceAppropriate,
    hardness_appropriate: hardnessAppropriate,
    has_antivibration: racket.tiene_antivibracion || false,
    safety_notes: safetyNotes,
  };
}
