import type { IncomingMessage, ServerResponse } from 'http';
import { generateContent } from '../_lib/ai';
import { getAllRackets } from '../_lib/racket-service';
import { filterRackets, assessBiomechanicalSafety } from '../_lib/racket-filter';
import { getTesteaMetrics } from '../_lib/testea-metrics';
import { buildCompactSelectionPrompt } from '../_lib/prompt-compression';
import { cacheGet, cacheSet, generateProfileHash } from '../_lib/cache';

function normalizeFormData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  const n = { ...data };
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
    delete n.goals;
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
  return n;
}

function parseJsonResponse(text: string): any {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    throw new Error('No valid JSON object in AI response');
  }
  const candidate = cleaned.slice(first, last + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    // Attempt repair
    for (const attempt of [candidate + ']}', candidate.replace(/,(\s*[}\]])/g, '$1')]) {
      try {
        return JSON.parse(attempt);
      } catch { /* continue */ }
    }
    throw new Error('Failed to parse AI response JSON');
  }
}

function enrichRecommendations(aiRackets: any[], filteredRackets: any[], profile: any): any[] {
  return aiRackets
    .map((rec: any) => {
      const racket = filteredRackets.find((r: any) => r.id === rec.id);
      if (!racket) return null;

      const testeaMetrics = getTesteaMetrics(racket);
      const biomechanicalSafety = assessBiomechanicalSafety(racket, profile);

      return {
        id: racket.id,
        name: racket.nombre,
        brand: racket.marca,
        image: racket.imagenes?.[0] || null,
        price: racket.precio_actual,
        match_score: rec.match_score,
        reason: rec.reason,
        what_it_gives_you: rec.what_it_gives_you || null,
        what_it_sacrifices: rec.what_it_sacrifices || null,
        ideal_for_moment: rec.ideal_for_moment || null,
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
    const filteredRackets = filterRackets(allRackets, profile);

    if (filteredRackets.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No rackets match your criteria. Please adjust your filters.' }));
      return;
    }

    const limitedRackets = filteredRackets.slice(0, 12);
    const prompt = buildCompactSelectionPrompt(limitedRackets, profile);

    let aiResult: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const aiResponse = await generateContent(prompt);
        aiResult = parseJsonResponse(aiResponse);
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }

    const enrichedRackets = enrichRecommendations(aiResult.rackets, limitedRackets, profile);

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
        discarded_biomechanical: allRackets.length - filteredRackets.length,
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
