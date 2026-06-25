/** Ported from backend/api/src/services/promptCompressionService.ts */
import { getTesteaMetrics } from './testea-metrics';

/**
 * Build the compact selection prompt sent to the LLM.
 *
 * @param scoredRackets  Top-N rackets pre-sorted by deterministic score (best first).
 *                       Scores are raw; this function normalises them to 0-100 for the model.
 * @param profile        Normalised player profile from normalizeFormData.
 */
export function buildCompactSelectionPrompt(
  scoredRackets: Array<{ racket: any; score: number }>,
  profile: any
): string {
  const maxScore = Math.max(...scoredRackets.map(s => s.score), 1);
  const compressedRackets = scoredRackets
    .map((s, i) => compressRacket(s.racket, i + 1, Math.round((s.score / maxScore) * 100)))
    .join('\n');
  const compressedProfile = compressProfile(profile);

  return `S:Eres Smashly,experto pádel.Seguridad biomecánica primero.T:Verdad objetiva con métricas Testea.
D:DIA=max potencia+riesgo epicónd|RND=control+punto dulce amplio+seguro lesiones|LAG=polivalente|C18K=rígido potencia|C3K/FV=confort|GHard=control+pot|GSoft=salida+confort
U:${compressedProfile}
C:${scoredRackets.length} palas pre-ordenadas por score determinista (Rank 1=mejor match):
Rank|Score|ID|M|Modelo|Nivel|Forma|Balance|€|P:C:M:Conf:Cert
${compressedRackets}
I:1.Selecciona EXACTAMENTE 3 palas del catálogo.2.Usa SOLO IDs proporcionados.3.Respeta el orden Rank/Score salvo justificación fuerte—si reordenas incluye "order_change_reason" en cada pala afectada.4.Explicaciones ESPECÍFICAS con datos concretos.
EJEMPLO:{"rackets":[{"id":42,"match_score":87,"reason":"Balance bajo y dureza media, ideal para epicondilitis nivel intermedio","what_it_gives_you":"Control preciso, punto dulce amplio, protección articular","what_it_sacrifices":"Menos potencia en smashes","priority_alignment":"Control:8.5/10 Manejabilidad:7.8/10","biomechanical_fit":"Redonda balance-bajo, segura para codo","ideal_for_moment":"Defensa desde fondo, bandejas, voleas"}],"analysis":"2-3 frases resumen del perfil y opciones","coaching_tip":"Un consejo técnico concreto para este jugador"}
R:{"rackets":[{"id":ID,"match_score":0-100,"reason":"2-3 frases específicas","what_it_gives_you":"3-4 beneficios concretos","what_it_sacrifices":"qué cede respecto a otras","priority_alignment":"métricas prioritarias con valores","biomechanical_fit":"por qué es segura para este perfil","ideal_for_moment":"situaciones de juego donde brilla"}],"analysis":"resumen","coaching_tip":"consejo técnico"}`;
}

function compressRacket(racket: any, rank: number, normScore: number): string {
  const metrics = getTesteaMetrics(racket);
  return [
    rank,
    normScore,
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
    `F:${profile.frequency || 'NA'}`,
    `I:${profile.injuries === 'no' ? 0 : 1}`,
    `B:${formatBudget(profile.budget)}`,
    `G:${(profile.gender?.charAt(0) || 'X').toUpperCase()}`,
    `C:${abbreviateCondition(profile.physical_condition || '')}`,
    `T:${abbreviateTouch(profile.touch_preference || '')}`,
  ];

  if ('play_style' in profile && profile.play_style) {
    parts.push(`S:${abbreviateStyle(profile.play_style)}`);
  }

  if (profile.shape_preference && profile.shape_preference !== 'no_se') {
    parts.push(`Sh:${abbreviateShape(profile.shape_preference)}`);
  }

  if (profile.balance_preference && profile.balance_preference !== 'no_se') {
    parts.push(`Ba:${abbreviateBalance(profile.balance_preference)}`);
  }

  if (profile.weight_preference && profile.weight_preference !== 'no_se') {
    parts.push(`W:${abbreviateWeight(profile.weight_preference)}`);
  }

  if ('characteristic_priorities' in profile && profile.characteristic_priorities?.length) {
    parts.push(
      `P:${profile.characteristic_priorities.map((p: string) => p.charAt(0).toUpperCase()).join('')}`
    );
  }

  // Goals / objectives (wizard multi-select)
  const goals: string[] = profile.objectives || profile.goals || [];
  if (goals.length > 0) {
    parts.push(`Go:${goals.map(abbreviateGoal).join(',')}`);
  }

  return parts.join(',');
}

// ─── Abbreviation helpers ─────────────────────────────────────────────────────

function abbreviate(text: string, maxLength: number): string {
  if (!text) return 'NA';
  return text.length > maxLength ? text.substring(0, maxLength) : text;
}

function abbreviateLevel(level: string): string {
  const map: Record<string, string> = {
    principiante: 'PRIN',
    'iniciación': 'INIT',
    iniciacion:   'INIT',
    intermedio:   'INTM',
    medio:        'MED',
    avanzado:     'AVNZ',
    profesional:  'PRO',
    competición:  'COMP',
    competicion:  'COMP',
  };
  if (!level) return 'NA';
  const key = Object.keys(map).find(k => level.toLowerCase().includes(k));
  return key ? map[key] : level.substring(0, 4).toUpperCase();
}

function abbreviateShape(shape: string): string {
  const map: Record<string, string> = {
    redonda:  'RND',
    'lágrima':'LAG',
    lagrima:  'LAG',
    diamante: 'DIA',
    'híbrida':'HYB',
    hibrida:  'HYB',
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
    activo:     'ACT',
    ocasional:  'OCA',
    sedentario: 'SED',
    deportista: 'DEP',
    asiduo:     'ASI',
  };
  const key = Object.keys(map).find(k => condition.toLowerCase().includes(k));
  return key ? map[key] : 'NA';
}

function abbreviateTouch(touch: string): string {
  const map: Record<string, string> = { blando: 'SFT', duro: 'HRD', medio: 'MED' };
  return map[touch.toLowerCase()] || 'NA';
}

function abbreviateStyle(style: string): string {
  const map: Record<string, string> = {
    ofensivo:    'OFN',
    defensivo:   'DEF',
    polivalente: 'POL',
    potencia:    'OFN',
    control:     'DEF',
    equilibrado: 'POL',
  };
  return map[style.toLowerCase()] || style.substring(0, 3).toUpperCase();
}

function abbreviateWeight(weight: string): string {
  const map: Record<string, string> = { ligera: 'LIG', media: 'MED', pesada: 'PES' };
  return map[weight.toLowerCase()] || weight.substring(0, 3).toUpperCase();
}

function abbreviateGoal(goal: string): string {
  const map: Record<string, string> = {
    'Más potencia':    'POT',
    'Más control':     'CTR',
    'Menos lesiones':  'LES',
    'Mejorar técnica': 'TEC',
    'Subir de nivel':  'NIV',
    'Durabilidad':     'DUR',
  };
  return map[goal] ?? goal.substring(0, 3).toUpperCase();
}
