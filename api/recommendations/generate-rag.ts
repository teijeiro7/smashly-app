import type { IncomingMessage, ServerResponse } from 'http';
import { generateContent, embed } from '../_lib/openrouter';
import { getAllRackets } from '../_lib/racket-service';
import { filterRackets } from '../_lib/racket-filter';
import { getTesteaMetrics } from '../_lib/testea-metrics';
import { searchSimilarRackets, searchRelevantReviews, searchKnowledge } from '../_lib/vector-store';
import { cacheGet, cacheSet, generateProfileHash } from '../_lib/cache';

function buildHyDEQuery(data: any): string {
  const parts: string[] = [];
  const hasInjuries = data.injuries && data.injuries !== 'no';

  if (hasInjuries) {
    parts.push('forma redonda o lágrima', 'balance bajo o medio');
    parts.push('núcleo EVA Soft goma blanda', 'cara fibra de vidrio o carbono 3K');
    parts.push('dureza blanda', 'sistema antivibración', 'confort alto 9/10', 'manejabilidad alta 8/10');
  } else {
    const shapeFromStyle: Record<string, string> = {
      ofensivo: 'forma diamante o lágrima',
      defensivo: 'forma redonda',
      polivalente: 'forma lágrima',
    };
    const balanceFromStyle: Record<string, string> = {
      ofensivo: 'balance alto',
      defensivo: 'balance bajo',
      polivalente: 'balance medio',
    };

    if (data.shape_preference) {
      parts.push(`forma ${data.shape_preference}`);
    } else if (data.play_style) {
      parts.push(shapeFromStyle[data.play_style] || 'forma lágrima');
    }

    if (data.balance_preference) {
      parts.push(`balance ${data.balance_preference}`);
    } else if (data.play_style) {
      parts.push(balanceFromStyle[data.play_style] || 'balance medio');
    }
  }

  const touchMap: Record<string, string> = {
    blando: 'núcleo EVA Soft goma blanda salida de bola suave confort',
    duro: 'núcleo EVA Hard carbono 18K control potencia dura',
    medio: 'núcleo EVA equilibrado tacto medio',
  };
  parts.push(touchMap[data.touch_preference || ''] || 'núcleo EVA equilibrado');
  parts.push(`nivel ${data.level || 'intermedio'}`);

  const budget =
    typeof data.budget === 'object' && 'min' in data.budget
      ? `${data.budget.min}-${data.budget.max}`
      : `0-${data.budget}`;
  parts.push(`precio ${budget}€`);

  if (data.characteristic_priorities?.length) {
    const metricMap: Record<string, string> = {
      potencia: 'potencia alta 9/10',
      control: 'control alto 9/10',
      manejabilidad: 'manejabilidad alta 9/10',
      salida_de_bola: 'salida de bola alta',
      punto_dulce: 'punto dulce amplio centrado',
    };
    data.characteristic_priorities.slice(0, 2).forEach((p: string) => {
      if (metricMap[p]) parts.push(metricMap[p]);
    });
  }

  return `Pala de pádel ideal: ${parts.join(', ')}.`;
}

function buildNLQuery(data: any): string {
  const level = data.level || 'intermedio';
  const injuries =
    data.injuries && data.injuries !== 'no' ? `con lesión en ${data.injuries}` : 'sin lesiones';
  const budget =
    typeof data.budget === 'object' && 'min' in data.budget
      ? `${data.budget.min}-${data.budget.max}€`
      : `${data.budget}€`;
  const touch = data.touch_preference ? `tacto ${data.touch_preference}` : '';
  const gender = data.gender ? `jugador ${data.gender}` : 'jugador';
  const condition = data.physical_condition ? `, condición física ${data.physical_condition}` : '';

  let query = `${gender} nivel ${level}${condition}, ${injuries}, presupuesto ${budget}. Busca pala ${touch}.`;

  if (data.play_style) {
    const style = data.play_style || 'polivalente';
    const position = data.position ? ` Posición: ${data.position}.` : '';
    const years = data.years_playing ? ` ${data.years_playing} años jugando.` : '';
    const bestShot = data.best_shot ? ` Mejor golpe: ${data.best_shot}.` : '';
    const weakShot = data.weak_shot ? ` Golpe a mejorar: ${data.weak_shot}.` : '';
    const objectives = data.objectives?.length ? ` Objetivos: ${data.objectives.join(', ')}.` : '';
    const priorities = data.characteristic_priorities?.length
      ? ` Prioridades: ${data.characteristic_priorities.join(', ')}.`
      : '';
    const likes = data.current_racket_likes ? ` Le gusta de su pala: ${data.current_racket_likes}.` : '';
    const dislikes = data.current_racket_dislikes
      ? ` No le gusta de su pala: ${data.current_racket_dislikes}.`
      : '';

    query += ` Estilo ${style}.${position}${years}${bestShot}${weakShot}${objectives}${priorities}${likes}${dislikes}`;
  }

  if (data.current_racket) query += ` Actualmente usa la ${data.current_racket}.`;

  return query.replace(/\s+/g, ' ').trim();
}

function buildRAGPrompt(context: {
  userProfile: any;
  retrievedRackets: Array<{ racketId: number; content: string; similarity: number; metadata: any }>;
  relevantReviews: Array<{ racketId: number; content: string; metadata: any }>;
  knowledgeContext: Array<{ content: string; source: string }>;
  safeRacketCount: number;
  totalCatalog: number;
}): string {
  const { userProfile, retrievedRackets, relevantReviews, knowledgeContext, safeRacketCount, totalCatalog } = context;
  const budget =
    typeof userProfile.budget === 'object' && 'min' in userProfile.budget
      ? `${userProfile.budget.min}-${userProfile.budget.max}€`
      : `${userProfile.budget}€`;

  const profileLines = [
    `- Nivel: ${userProfile.level}`,
    `- Lesiones: ${userProfile.injuries || 'ninguna'}`,
    `- Presupuesto: ${budget}`,
    userProfile.touch_preference ? `- Tacto preferido: ${userProfile.touch_preference}` : '',
    userProfile.gender ? `- Género: ${userProfile.gender}` : '',
    userProfile.physical_condition ? `- Condición física: ${userProfile.physical_condition}` : '',
    userProfile.play_style ? `- Estilo: ${userProfile.play_style}` : '',
    userProfile.characteristic_priorities?.length
      ? `- Prioridades: ${userProfile.characteristic_priorities.join(', ')}`
      : '',
  ].filter(Boolean).join('\n');

  const racketsSection = retrievedRackets
    .map((r, i) => `${i + 1}. [ID:${r.racketId}] (sim:${r.similarity.toFixed(2)})\n${r.content}`)
    .join('\n\n');

  const reviewsSection = relevantReviews.length
    ? relevantReviews.map(r => `• [Pala ID:${r.racketId}] ${r.content}`).join('\n')
    : 'No hay reviews disponibles.';

  const knowledgeSection = knowledgeContext.length
    ? knowledgeContext.map(k => `[${k.source}] ${k.content}`).join('\n')
    : '';

  return `CONTEXTO: Motor RAG de recomendación de palas de pádel. Seguridad biomecánica primero.

PERFIL DEL USUARIO:
${profileLines}

PALAS RECUPERADAS POR SIMILITUD SEMÁNTICA (${retrievedRackets.length} de ${safeRacketCount} seguras / ${totalCatalog} total):
${racketsSection}

REVIEWS RELEVANTES:
${reviewsSection}

${knowledgeSection ? `CONOCIMIENTO EXPERTO:\n${knowledgeSection}\n` : ''}
INSTRUCCIÓN: Selecciona EXACTAMENTE 3 palas de las recuperadas. Usa SOLO los IDs listados. Explica con datos concretos.

RESPONDE SOLO CON JSON:
{"rackets":[{"id":ID,"match_score":0-100,"reason":"explicación","priority_alignment":"métricas","biomechanical_fit":"seguridad","preference_match":"tacto/estilo"}],"analysis":"resumen 3-4 frases"}`;
}

function enrichRAGResult(aiRackets: any[], filteredRackets: any[]): any[] {
  return aiRackets
    .map((rec: any) => {
      const racket = filteredRackets.find((r: any) => r.id === rec.id);
      if (!racket) return null;
      const metrics = getTesteaMetrics(racket);
      return {
        id: racket.id,
        name: racket.nombre,
        brand: racket.marca,
        image: racket.imagenes?.[0] || null,
        price: racket.precio_actual,
        match_score: rec.match_score,
        reason: rec.reason,
        testea_metrics: metrics,
        match_details: {
          priority_alignment: rec.priority_alignment,
          biomechanical_fit: rec.biomechanical_fit,
          preference_match: rec.preference_match,
        },
        community_data: {
          user_rating: racket.valoracion_usuarios,
          is_bestseller: racket.es_bestseller,
        },
      };
    })
    .filter(Boolean);
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body: any;
  try {
    body = await readBody(req);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid request body' }));
    return;
  }

  const { type, data } = body;
  if (!type || !data) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing type or data' }));
    return;
  }

  try {
    const cacheHash = generateProfileHash(data);
    const cached = cacheGet(cacheHash);
    if (cached) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cached));
      return;
    }

    // Biomechanical filter first
    const allRackets = await getAllRackets();
    const filteredRackets = filterRackets(allRackets, data);
    const safeRacketIds = filteredRackets.map((r: any) => r.id as number);

    if (safeRacketIds.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No safe rackets found for your profile.' }));
      return;
    }

    // Build HyDE + NL queries and embed in parallel
    const hydeQuery = buildHyDEQuery(data);
    const nlQuery = buildNLQuery(data);
    const [hydeEmbedding, nlEmbedding] = await Promise.all([embed(hydeQuery), embed(nlQuery)]);

    // Multi-query retrieval in parallel
    const [hydeRackets, nlRackets, knowledgeChunks] = await Promise.all([
      searchSimilarRackets(hydeEmbedding, { limit: 12, safeRacketIds }),
      searchSimilarRackets(nlEmbedding, { limit: 10, safeRacketIds }),
      searchKnowledge(hydeEmbedding, { limit: 6 }),
    ]);

    // Merge + dedup: keep highest similarity per racket
    const racketMap = new Map<number, (typeof hydeRackets)[0]>();
    [...hydeRackets, ...nlRackets].forEach(r => {
      const existing = racketMap.get(r.racketId);
      if (!existing || r.similarity > existing.similarity) racketMap.set(r.racketId, r);
    });
    const topRackets = Array.from(racketMap.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 15);

    // Reviews for top 10 rackets
    const topRacketIds = topRackets.slice(0, 10).map(r => r.racketId);
    const relevantReviews = await searchRelevantReviews(hydeEmbedding, { limit: 8, racketIds: topRacketIds });

    // Assemble prompt + call LLM
    const ragPrompt = buildRAGPrompt({
      userProfile: data,
      retrievedRackets: topRackets,
      relevantReviews,
      knowledgeContext: knowledgeChunks,
      safeRacketCount: safeRacketIds.length,
      totalCatalog: allRackets.length,
    });

    const aiResponse = await generateContent(ragPrompt);
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse AI response JSON');
    const aiResult = JSON.parse(jsonMatch[0]);

    const enrichedRackets = enrichRAGResult(aiResult.rackets, filteredRackets);

    const result = {
      rackets: enrichedRackets,
      analysis: aiResult.analysis,
      process_summary: {
        total_catalog: allRackets.length,
        discarded_biomechanical: allRackets.length - filteredRackets.length,
        safe_evaluated: filteredRackets.length,
        main_criterion:
          data.characteristic_priorities?.[0]?.toUpperCase() || 'SIMILITUD SEMÁNTICA',
        rag_retrieved_count: topRackets.length,
      },
      transparency_note:
        'Recomendación generada mediante búsqueda semántica (RAG) en nuestro catálogo de palas y reviews.',
    };

    cacheSet(cacheHash, result);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err: any) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('No safe rackets')) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
      return;
    }
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
