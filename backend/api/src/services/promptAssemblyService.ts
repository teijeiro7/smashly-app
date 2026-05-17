import { BasicFormData, AdvancedFormData } from '../types/recommendation';

export class PromptAssemblyService {
  static buildRecommendationPrompt(context: {
    userProfile: BasicFormData | AdvancedFormData;
    retrievedRackets: Array<{
      racketId: number;
      content: string;
      similarity: number;
      metadata: Record<string, any>;
    }>;
    relevantReviews: Array<{
      racketId: number;
      content: string;
      metadata: Record<string, any>;
    }>;
    knowledgeContext: Array<{
      content: string;
      source: string;
    }>;
    safeRacketCount: number;
    totalCatalog: number;
  }): string {
    const {
      userProfile,
      retrievedRackets,
      relevantReviews,
      knowledgeContext,
      safeRacketCount,
      totalCatalog,
    } = context;

    const isAdvanced = 'play_style' in userProfile;
    const adv = userProfile as AdvancedFormData;

    // ── Perfil completo ──────────────────────────────────────────────────────
    const budget =
      typeof userProfile.budget === 'object' && 'min' in (userProfile.budget as any)
        ? `${(userProfile.budget as any).min}-${(userProfile.budget as any).max}€`
        : `${userProfile.budget}€`;

    const profileLines: string[] = [
      `- Nivel: ${userProfile.level}`,
      `- Lesiones / limitaciones: ${userProfile.injuries || 'ninguna'}`,
      `- Presupuesto: ${budget}`,
      userProfile.touch_preference ? `- Tacto preferido: ${userProfile.touch_preference}` : '',
      userProfile.gender ? `- Género: ${userProfile.gender}` : '',
      userProfile.physical_condition ? `- Condición física: ${userProfile.physical_condition}` : '',
      userProfile.current_racket ? `- Pala actual: ${userProfile.current_racket}` : '',
    ];

    if (isAdvanced) {
      profileLines.push(
        `- Estilo de juego: ${adv.play_style || 'polivalente'}`,
        adv.position ? `- Posición en pista: ${adv.position}` : '',
        adv.years_playing ? `- Años jugando: ${adv.years_playing}` : '',
        adv.best_shot ? `- Mejor golpe: ${adv.best_shot}` : '',
        adv.weak_shot ? `- Golpe a mejorar: ${adv.weak_shot}` : '',
        adv.weight_preference ? `- Preferencia de peso: ${adv.weight_preference}` : '',
        adv.balance_preference ? `- Preferencia de balance: ${adv.balance_preference}` : '',
        adv.shape_preference ? `- Preferencia de forma: ${adv.shape_preference}` : '',
        adv.current_racket_likes
          ? `- Lo que le gusta de su pala actual: ${adv.current_racket_likes}`
          : '',
        adv.current_racket_dislikes
          ? `- Lo que NO le gusta de su pala actual: ${adv.current_racket_dislikes}`
          : '',
        adv.objectives?.length ? `- Objetivos: ${adv.objectives.join(', ')}` : '',
        adv.characteristic_priorities?.length
          ? `- PRIORIDADES (orden 1=más importante): ${adv.characteristic_priorities.map((p, i) => `${i + 1}. ${p}`).join(', ')}`
          : '',
      );
    }

    const profileSection = profileLines.filter(l => l).join('\n');

    // ── Criterios de puntuación para match_score ─────────────────────────────
    let scoringSection: string;
    if (isAdvanced && adv.characteristic_priorities?.length) {
      const weights = [30, 25, 20, 15, 10];
      const priorityWeights = adv.characteristic_priorities
        .map((p, i) => `  - ${p}: ${weights[i] ?? 5}%`)
        .join('\n');
      scoringSection = `CRITERIOS DE PUNTUACIÓN (match_score 0-100):
Prioridades del usuario (total 75%):
${priorityWeights}
Seguridad biomecánica (15%) — especialmente si hay lesiones.
Ajuste de presupuesto (10%) — penaliza si supera el rango.`;
    } else {
      scoringSection = `CRITERIOS DE PUNTUACIÓN (match_score 0-100):
- Similitud semántica al perfil: 40%
- Seguridad biomecánica y confort: 30%
- Ajuste de presupuesto: 20%
- Preferencia de tacto/forma: 10%`;
    }

    // ── Sección de conocimiento de dominio ───────────────────────────────────
    const knowledgeSection =
      knowledgeContext.length > 0
        ? `CONOCIMIENTO DE DOMINIO (materiales, biomecánica, técnica):
---
${knowledgeContext.map(k => k.content).join('\n---\n')}
---`
        : '';

    // ── Palas candidatas ─────────────────────────────────────────────────────
    const racketsSection = retrievedRackets
      .map((r, i) => {
        return `--- CANDIDATA ${i + 1} (Similitud: ${(r.similarity * 100).toFixed(1)}%) ---
ID: ${r.racketId}
${r.content}
--- FIN CANDIDATA ${i + 1} ---`;
      })
      .join('\n\n');

    // ── Reviews de comunidad ─────────────────────────────────────────────────
    const reviewsSection =
      relevantReviews.length > 0
        ? `EXPERIENCIA DE LA COMUNIDAD (reviews reales de jugadores):
${relevantReviews.map(rv => `• ${rv.content}`).join('\n')}`
        : '';

    return `CONTEXTO DEL SISTEMA:
Eres "Smashly AI", motor experto en palas de pádel. Debes recomendar las 3 mejores palas
basándote ÚNICAMENTE en los datos proporcionados. Seguridad biomecánica es no negociable.

${knowledgeSection}

PERFIL DEL USUARIO:
${profileSection}

${scoringSection}

PALAS CANDIDATAS (pre-filtradas por seguridad biomecánica):
De ${totalCatalog} palas totales, ${safeRacketCount} son seguras para este perfil.
Estas son las ${retrievedRackets.length} más relevantes semánticamente:

${racketsSection}

${reviewsSection}

INSTRUCCIONES DE SALIDA:
1. Selecciona EXACTAMENTE 3 palas de las candidatas de arriba (usa su ID exacto).
2. Ordénalas de mayor a menor match_score.
3. Responde SOLO con este JSON (sin markdown, sin texto adicional):

{
  "_reasoning": "Analiza paso a paso: qué necesita este jugador → qué palas cumplen sus prioridades en orden → por qué descartas las demás → veredicto final.",
  "rackets": [
    {
      "id": <id_exacto_de_la_pala>,
      "match_score": <0-100 según criterios arriba>,
      "reason": "<por qué es ideal, citando specs y métricas concretas>",
      "priority_alignment": "<cómo encaja con sus prioridades en orden>",
      "biomechanical_fit": "<por qué es segura para sus lesiones/físico>",
      "preference_match": "<tacto, forma, peso — cómo cuadra con sus gustos>"
    }
  ],
  "analysis": "<resumen ejecutivo máx 120 palabras: por qué estas 3, qué gana cada perfil de jugador>"
}

RESTRICCIONES CRÍTICAS:
- Solo palas de la lista de candidatas (IDs exactos).
- No inventes métricas ni specs. Si no tienes datos, no los menciones.
- Si el usuario tiene lesiones, las 3 palas DEBEN ser seguras biomecánicamente.`;
  }
}
