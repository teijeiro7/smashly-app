import type { IncomingMessage, ServerResponse } from 'http';
import { generateContent } from './_lib/ai';
import { getRacketsByIds } from './_lib/racket-service';

function getDbRadarValues(racket: any): null | Record<string, number> {
  const hasCertified = [
    racket.testea_potencia,
    racket.testea_control,
    racket.testea_manejabilidad,
    racket.testea_confort,
  ].every(v => v !== null && v !== undefined);

  if (!hasCertified) return null;

  // Map Testea metrics to radar format
  const forma = (racket.caracteristicas_forma || '').toLowerCase();
  const dureza = (racket.caracteristicas_dureza || '').toLowerCase();
  const puntoDulce =
    forma.includes('redonda') ? 8 : forma.includes('lágrima') || forma.includes('lagrima') ? 6 : 4;
  const salidaDeBola =
    dureza.includes('blanda') || dureza.includes('soft')
      ? 8
      : dureza.includes('media')
        ? 6
        : 4;

  return {
    potencia: racket.testea_potencia,
    control: racket.testea_control,
    manejabilidad: racket.testea_manejabilidad,
    puntoDulce,
    salidaDeBola,
  };
}

function buildComparisonPrompt(rackets: any[], userProfile?: any): string {
  const racketsInfo = rackets
    .map((r: any, i: number) => {
      const hasTestea = [r.testea_potencia, r.testea_control, r.testea_manejabilidad, r.testea_confort].some(
        v => v !== null && v !== undefined
      );
      const dbRadar = getDbRadarValues(r);
      const radarLine = dbRadar
        ? `⚠️ VALORES RADAR FIJOS DE BD (NO MODIFICAR): Pot:${dbRadar.potencia}, Con:${dbRadar.control}, Man:${dbRadar.manejabilidad}, PD:${dbRadar.puntoDulce}, SB:${dbRadar.salidaDeBola}`
        : 'Métricas Radar: No disponibles (estima basándote en forma y materiales)';

      return `PALA ${i + 1}:
Nombre: ${r.nombre || r.name}
Marca: ${r.marca || 'N/A'}
Modelo: ${r.modelo || 'N/A'}
Forma: ${r.caracteristicas_forma || 'N/A'}
Goma: ${r.caracteristicas_nucleo || 'N/A'}
Cara/Fibra: ${r.caracteristicas_cara || 'N/A'}
Balance: ${r.caracteristicas_balance || 'N/A'}
Dureza: ${r.caracteristicas_dureza || 'N/A'}
Nivel: ${r.caracteristicas_nivel_de_juego || 'N/A'}
Testea Certificado: ${hasTestea ? 'SÍ' : 'NO'}
${radarLine}`;
    })
    .join('\n\n');

  const userContext = userProfile
    ? `\nCONTEXTO DEL USUARIO:\nNivel: ${userProfile.gameLevel || 'No especificado'}\nEstilo: ${userProfile.playingStyle || 'No especificado'}\nGénero: ${userProfile.gender || 'No especificado'}\n`
    : '';

  const r0 = rackets[0]?.nombre || 'Pala 1';
  const r1 = rackets[1]?.nombre || 'Pala 2';

  return `CONTEXTO: Eres "Smashly AI", experto en pádel. Análisis técnico comparativo.

REGLAS DE DOMINIO:
- Palas Diamante: Balance alto, máxima potencia, riesgo epicondilitis.
- Palas Redondas: Balance bajo, control, punto dulce amplio. Ideales con lesiones.
- Palas Lágrima: Polivalentes, balance medio.
- Carbono 18K: Rígido (potencia). 3K / Fibra de Vidrio: Confort.
- Gomas Hard: control+potencia. Soft: salida de bola+confort.

DATOS DE PALAS:
${racketsInfo}
${userContext}
INSTRUCCIÓN: Responde con UN ÚNICO objeto JSON válido. Estructura exacta:
{
  "_reasoning": "chain-of-thought interno",
  "executiveSummary": "2-3 frases contundentes",
  "technicalAnalysis": [
    {"title":"Potencia","content":"..."},
    {"title":"Control","content":"..."},
    {"title":"Manejabilidad","content":"..."},
    {"title":"Confort","content":"..."}
  ],
  "comparisonTable": [
    {"feature":"Forma","${r0}":"...","${r1}":"..."},
    {"feature":"Balance","${r0}":"...","${r1}":"..."},
    {"feature":"Dureza","${r0}":"...","${r1}":"..."},
    {"feature":"Punto Dulce","${r0}":"...","${r1}":"..."},
    {"feature":"Nivel recomendado","${r0}":"...","${r1}":"..."},
    {"feature":"Precio aprox.","${r0}":"...","${r1}":"..."}
  ],
  "metrics": [
    {"racketId":0,"racketName":"${r0}","isCertified":false,"radarData":{"potencia":7,"control":7,"manejabilidad":7,"puntoDulce":6,"salidaDeBola":6}}
  ],
  "recommendedProfiles": "qué tipo de jugador se beneficia de cada pala",
  "biomechanicalConsiderations": "riesgos de lesiones por balance y dureza",
  "conclusion": "veredicto final directo"
}`;
}

function parseAndOverrideMetrics(text: string, rackets: any[]): any {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in AI response');

  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.metrics || !Array.isArray(parsed.metrics)) {
    parsed.metrics = rackets.map((r: any) => ({
      racketId: r.id,
      racketName: r.nombre || r.name,
      isCertified: false,
      radarData: { potencia: 5, control: 5, manejabilidad: 5, puntoDulce: 5, salidaDeBola: 5 },
    }));
  }

  // Override with DB radar values when available
  parsed.metrics = parsed.metrics.map((metric: any, i: number) => {
    const racket = rackets[i];
    if (!racket) return metric;
    const dbRadar = getDbRadarValues(racket);
    if (dbRadar) {
      return { ...metric, isCertified: true, radarData: dbRadar };
    }
    return metric;
  });

  return parsed;
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

  const { racketIds, userProfile } = body;

  if (!racketIds || !Array.isArray(racketIds) || racketIds.length < 2) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Se requieren al menos 2 IDs de palas para comparar' }));
    return;
  }

  if (racketIds.length > 3) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Solo se pueden comparar hasta 3 palas simultáneamente' }));
    return;
  }

  try {
    const rackets = await getRacketsByIds(racketIds);

    if (rackets.length !== racketIds.length) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No se encontraron todas las palas solicitadas' }));
      return;
    }

    const prompt = buildComparisonPrompt(rackets, userProfile);
    const aiResponse = await generateContent(prompt);
    const comparison = parseAndOverrideMetrics(aiResponse, rackets);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ comparison }));
  } catch (err: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error al generar la comparación', details: err?.message }));
  }
}
