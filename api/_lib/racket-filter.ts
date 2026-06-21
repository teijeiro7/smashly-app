/** Ported from backend/api/src/services/racketFilterService.ts */

export function filterRackets(allRackets: any[], profile: any): any[] {
  let filtered = [...allRackets];

  // Biomechanical filter — first, non-negotiable
  const { safe } = applyBiomechanicalFilter(filtered, profile);
  filtered = safe;

  if (filtered.length === 0) return [];

  // In-stock only
  if (profile.only_in_stock) {
    filtered = filtered.filter((r: any) => !!r.precio_actual);
  }

  // Budget
  filtered = filterByBudget(filtered, profile.budget);
  if (filtered.length === 0) return safe.slice(0, 10); // never return empty

  // Level
  filtered = filterByLevel(filtered, profile.level);
  if (filtered.length === 0) filtered = [...safe];

  // Play style (advanced)
  if ('play_style' in profile) {
    const byStyle = filterByPlayStyle(filtered, profile);
    if (byStyle.length > 0) filtered = byStyle;
  }

  // Score + diversity
  const scored = filtered.map((racket: any) => ({
    racket,
    score: calculateMatchScore(racket, profile),
  }));
  scored.sort((a, b) => b.score - a.score);

  return ensureDiversity(scored, 40).map((s: any) => s.racket);
}

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
        const relaxedMax = max + 10;
        return peso >= min && peso <= relaxedMax;
      })
      .slice(0, 10);
    safe.push(...relaxed);
  }

  return { safe, discarded, reasons };
}

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

  const filtered = rackets.filter((r: any) => !r.precio_actual || r.precio_actual <= maxBudget);
  return filtered.length >= 5 ? filtered : rackets;
}

function filterByLevel(rackets: any[], level: string): any[] {
  if (!level) return rackets;
  const levelLower = level.toLowerCase();
  const levelMap: Record<string, string[]> = {
    principiante: ['iniciación', 'iniciacion', 'principiante', 'básico', 'basico', 'todos'],
    iniciación: ['iniciación', 'iniciacion', 'principiante', 'básico', 'basico', 'todos'],
    medio: ['intermedio', 'medio', 'avanzado', 'todos'],
    intermedio: ['intermedio', 'medio', 'avanzado', 'todos'],
    avanzado: ['avanzado', 'profesional', 'competición', 'competicion', 'todos'],
    profesional: ['avanzado', 'profesional', 'competición', 'competicion', 'todos'],
  };

  const target = Object.keys(levelMap).find(k => levelLower.includes(k));
  if (!target) return rackets;

  const allowed = levelMap[target];
  const filtered = rackets.filter((r: any) => {
    const rLevel = (r.caracteristicas_nivel_de_juego || '').toLowerCase();
    return !rLevel || allowed.some(a => rLevel.includes(a));
  });

  return filtered.length >= 3 ? filtered : rackets;
}

function filterByPlayStyle(rackets: any[], profile: any): any[] {
  const style = (profile.play_style || '').toLowerCase();
  if (!style) return rackets;

  const formaPreference = profile.shape_preference?.toLowerCase();
  const balancePreference = profile.balance_preference?.toLowerCase();

  let filtered = rackets;

  if (formaPreference) {
    const byShape = rackets.filter((r: any) =>
      (r.caracteristicas_forma || '').toLowerCase().includes(formaPreference)
    );
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

  if (balancePreference) {
    const byBalance = filtered.filter((r: any) =>
      (r.caracteristicas_balance || '').toLowerCase().includes(balancePreference)
    );
    if (byBalance.length >= 5) filtered = byBalance;
  }

  return filtered;
}

function calculateMatchScore(racket: any, profile: any): number {
  let score = 0;

  // Budget fit
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

  // Testea certification
  if (racket.testea_certificado) score += 15;

  // Priority alignment (advanced)
  if ('characteristic_priorities' in profile && profile.characteristic_priorities?.length) {
    const metricMap: Record<string, string> = {
      potencia: 'testea_potencia',
      control: 'testea_control',
      manejabilidad: 'testea_manejabilidad',
    };
    profile.characteristic_priorities.slice(0, 3).forEach((priority: string, i: number) => {
      const col = metricMap[priority];
      if (col && racket[col] !== undefined) {
        score += (racket[col] / 10) * (15 - i * 4);
      }
    });
  }

  // User rating
  if (racket.valoracion_usuarios) {
    score += (racket.valoracion_usuarios / 5) * 10;
  }

  // Bestseller
  if (racket.es_bestseller) score += 5;

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
