import type { IncomingMessage, ServerResponse } from 'http';
import { generateContent } from '../_lib/ai';
import { getAllRackets } from '../_lib/racket-service';
import { filterRacketsWithScores, assessBiomechanicalSafety } from '../_lib/racket-filter';
import { getTesteaMetrics } from '../_lib/testea-metrics';
import { buildCompactSelectionPrompt } from '../_lib/prompt-compression';
import { cacheGet, cacheSet, generateProfileHash } from '../_lib/cache';
import { parseAiJson } from '../_lib/json-parse';

function normalizeFormData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  const n = { ...data };

  // Key normalizations
  if (n.style !== undefined && n.play_style === undefined) {
    n.play_style = n.style;
    delete n.style;
  }
  if (n.weakest_shot !== undefined && n.weak_shot === undefined) {
    n.weak_shot = n.weakest_shot;
    delete n.weakest_shot;
  }
  if (n.goals !== undefined && n.objectives === undefined) {
    n.objectives = n.goals;
    // Keep goals too — filter reads both keys for safety
  }
  if (n.likes_current_racket !== undefined && n.current_racket_likes === undefined) {
    n.current_racket_likes = n.likes_current_racket;
    delete n.likes_current_racket;
  }
  if (n.dislikes_current_racket !== undefined && n.current_racket_dislikes === undefined) {
    n.current_racket_dislikes = n.dislikes_current_racket;
    delete n.dislikes_current_racket;
  }
  if (typeof n.years_playing === 'string') {
    n.years_playing = parseInt(n.years_playing, 10) || 0;
  }

  // Value normalization: wizard sends 'control'/'potencia'/'equilibrado' for style;
  // the filter expects 'defensivo'/'ofensivo'/'polivalente'.  Normalise here so
  // the full pipeline (filter, scoring, and prompt) sees consistent values.
  if (n.play_style) {
    const styleMap: Record<string, string> = {
      control:     'defensivo',
      potencia:    'ofensivo',
      equilibrado: 'polivalente',
    };
    n.play_style = styleMap[n.play_style.toLowerCase()] ?? n.play_style;
  }

  return n;
}

function enrichRecommendations(
  aiRackets: any[],
  filteredRackets: any[],
  profile: any,
  scoreMap: Map<number, number>   // racketId → normalised deterministic score 0-100
): any[] {
  return aiRackets
    .map((rec: any) => {
      const racket = filteredRackets.find((r: any) => r.id === rec.id);
      if (!racket) return null;

      const testeaMetrics = getTesteaMetrics(racket);
      const biomechanicalSafety = assessBiomechanicalSafety(racket, profile);

      // Use the deterministic score rather than the AI-generated match_score.
      // The AI prose is still used for all explanatory fields.
      const deterministicScore = scoreMap.get(racket.id) ?? rec.match_score;

      return {
        id: racket.id,
        name: racket.nombre,
        brand: racket.marca,
        image: racket.imagenes?.[0] || null,
        price: racket.precio_actual,
        match_score: deterministicScore,
        reason: rec.reason,
        what_it_gives_you: rec.what_it_gives_you || null,
        what_it_sacrifices: rec.what_it_sacrifices || null,
        ideal_for_moment: rec.ideal_for_moment || null,
        order_change_reason: rec.order_change_reason || null,
        testea_metrics: testeaMetrics,
        biomechanical_safety: biomechanicalSafety,
        community_data: {
          user_rating: racket.valoracion_usuarios || undefined,
          quality_price_ratio: racket.relacion_calidad_precio || undefined,
          is_bestseller: racket.es_bestseller || false,
        },
        match_details: {
          priority_alignment: rec.priority_alignment || rec.reason,
          biomechanical_fit: rec.biomechanical_fit || 'Pala segura para tu perfil',
          preference_match: rec.preference_match || null,
        },
      };
    })
    .filter(Boolean);
}

function getMainCriterion(profile: any): string {
  if (profile.characteristic_priorities?.length > 0) {
    return profile.characteristic_priorities[0].toUpperCase();
  }
  if (profile.injuries && profile.injuries !== 'no') return 'SEGURIDAD BIOMECÁNICA';
  return 'NIVEL DE JUEGO';
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
  if (!type || !data || typeof data !== 'object' || Object.keys(data).length === 0) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing or invalid type or data' }));
    return;
  }

  const missingFields = ['level', 'budget'].filter(f => !data[f]);
  if (missingFields.length > 0) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Missing required fields: ${missingFields.join(', ')}` }));
    return;
  }

  try {
    const profile = normalizeFormData(data);
    const cacheHash = generateProfileHash(profile);
    const cached = cacheGet(cacheHash);
    if (cached) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cached));
      return;
    }

    const allRackets = await getAllRackets();

    // Filter and score deterministically — best first
    const scoredRackets = filterRacketsWithScores(allRackets, profile);

    if (scoredRackets.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No rackets match your criteria. Please adjust your filters.' }));
      return;
    }

    // Top 12 sent to the LLM; deterministic rank already established
    const limitedScored = scoredRackets.slice(0, 12);
    const maxScore = Math.max(...limitedScored.map(s => s.score), 1);
    const limitedRackets = limitedScored.map(s => s.racket);

    // Normalised score map (0-100) keyed by racket id — used to override AI match_score
    const scoreMap = new Map<number, number>(
      limitedScored.map(s => [s.racket.id, Math.round((s.score / maxScore) * 100)])
    );

    const prompt = buildCompactSelectionPrompt(limitedScored, profile);

    let aiResult: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const aiResponse = await generateContent(prompt);
        aiResult = parseAiJson(aiResponse);
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }

    const enrichedRackets = enrichRecommendations(aiResult.rackets, limitedRackets, profile, scoreMap);

    if (enrichedRackets.length === 0) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No valid recommendations could be generated' }));
      return;
    }

    const result = {
      rackets: enrichedRackets,
      analysis: aiResult.analysis,
      coaching_tip: aiResult.coaching_tip || undefined,
      process_summary: {
        total_catalog: allRackets.length,
        discarded_biomechanical: allRackets.length - scoredRackets.length,
        safe_evaluated: limitedRackets.length,
        main_criterion: getMainCriterion(profile),
      },
      transparency_note:
        'Las puntuaciones de Potencia, Control, Manejabilidad, Punto Dulce y Salida de Bola son calculadas de forma determinista a partir de las características físicas de cada pala (forma, balance, dureza) y permanecen fijas para cada modelo. Las valoraciones de usuarios reflejan la experiencia de la comunidad Smashly.',
    };

    cacheSet(cacheHash, result);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err: any) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('No rackets match') || message.includes('adjust your filters')) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
      return;
    }
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
