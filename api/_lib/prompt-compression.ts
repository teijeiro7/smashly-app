/** Ported from backend/api/src/services/promptCompressionService.ts */
import { getTesteaMetrics } from './testea-metrics';

export function buildCompactSelectionPrompt(rackets: any[], profile: any): string {
  const compressedRackets = rackets.map(compressRacket).join('\n');
  const compressedProfile = compressProfile(profile);

  return `S:Eres Smashly,experto pádel.Seguridad biomecánica primero.T:Verdad objetiva con métricas Testea.
U:${compressedProfile}
C:${rackets.length} palas seguras:
ID|M|Modelo|Nivel|Forma|Balance|€|P:C:M:Conf:Cert
${compressedRackets}
I:1.Selecciona EXACTAMENTE 3 palas del catálogo.2.Usa SOLO IDs proporcionados.3.Ordena por mejor match.4.Explicaciones ESPECÍFICAS con datos concretos.
R:{"rackets":[{"id":ID,"match_score":0-100,"reason":"2-3 frases específicas","what_it_gives_you":"3-4 beneficios","what_it_sacrifices":"qué cede","priority_alignment":"métricas prioritarias","biomechanical_fit":"por qué es segura","ideal_for_moment":"situaciones de juego"}],"analysis":"resumen","coaching_tip":"consejo técnico"}`;
}

function compressRacket(racket: any): string {
  const metrics = getTesteaMetrics(racket);
  return [
    racket.id,
    abbreviate(racket.marca, 3),
    abbreviate(racket.nombre, 20),
    abbreviateLevel(racket.caracteristicas_nivel_de_juego),
    abbreviateShape(racket.caracteristicas_forma),
    abbreviateBalance(racket.caracteristicas_balance),
    Math.round(racket.precio_actual || 0),
    `${metrics.potencia}:${metrics.control}:${metrics.manejabilidad}:${metrics.confort}:${metrics.certificado ? 1 : 0}`,
  ].join('|');
}

function compressProfile(profile: any): string {
  const parts: string[] = [
    `L:${abbreviateLevel(profile.level)}`,
    `F:${profile.frequency}`,
    `I:${profile.injuries === 'no' ? 0 : 1}`,
    `B:${formatBudget(profile.budget)}`,
    `G:${(profile.gender?.charAt(0) || 'X').toUpperCase()}`,
    `C:${abbreviateCondition(profile.physical_condition || '')}`,
    `T:${abbreviateTouch(profile.touch_preference || '')}`,
  ];

  if ('play_style' in profile && profile.play_style) {
    parts.push(`S:${abbreviateStyle(profile.play_style)}`);
  }

  if ('characteristic_priorities' in profile && profile.characteristic_priorities?.length) {
    parts.push(
      `P:${profile.characteristic_priorities.map((p: string) => p.charAt(0).toUpperCase()).join('')}`
    );
  }

  return parts.join(',');
}

function abbreviate(text: string, maxLength: number): string {
  if (!text) return 'NA';
  return text.length > maxLength ? text.substring(0, maxLength) : text;
}

function abbreviateLevel(level: string): string {
  const map: Record<string, string> = {
    principiante: 'PRIN',
    'iniciación': 'INIT',
    iniciacion: 'INIT',
    intermedio: 'INTM',
    medio: 'MED',
    avanzado: 'AVNZ',
    profesional: 'PRO',
    competición: 'COMP',
    competicion: 'COMP',
  };
  if (!level) return 'NA';
  const key = Object.keys(map).find(k => level.toLowerCase().includes(k));
  return key ? map[key] : level.substring(0, 4).toUpperCase();
}

function abbreviateShape(shape: string): string {
  const map: Record<string, string> = {
    redonda: 'RND',
    'lágrima': 'LAG',
    lagrima: 'LAG',
    diamante: 'DIA',
    híbrida: 'HYB',
    hibrida: 'HYB',
  };
  if (!shape) return 'NA';
  const key = Object.keys(map).find(k => shape.toLowerCase().includes(k));
  return key ? map[key] : shape.substring(0, 3).toUpperCase();
}

function abbreviateBalance(balance: string): string {
  if (!balance) return 'NA';
  const b = balance.toLowerCase();
  if (b.includes('alto') || b.includes('high')) return 'HI';
  if (b.includes('medio') || b.includes('mid')) return 'MID';
  if (b.includes('bajo') || b.includes('low')) return 'LO';
  return balance.substring(0, 3).toUpperCase();
}

function formatBudget(budget: any): string {
  if (typeof budget === 'object' && 'max' in budget) return `${budget.min || 0}-${budget.max}`;
  if (typeof budget === 'number') return `0-${budget}`;
  return String(budget);
}

function abbreviateCondition(condition: string): string {
  const map: Record<string, string> = {
    activo: 'ACT',
    ocasional: 'OCA',
    sedentario: 'SED',
    deportista: 'DEP',
  };
  const key = Object.keys(map).find(k => condition.toLowerCase().includes(k));
  return key ? map[key] : 'NA';
}

function abbreviateTouch(touch: string): string {
  const map: Record<string, string> = { blando: 'SFT', duro: 'HRD', medio: 'MED' };
  return map[touch.toLowerCase()] || 'NA';
}

function abbreviateStyle(style: string): string {
  const map: Record<string, string> = { ofensivo: 'OFN', defensivo: 'DEF', polivalente: 'POL' };
  return map[style.toLowerCase()] || style.substring(0, 3).toUpperCase();
}
