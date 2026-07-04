import type { IncomingMessage, ServerResponse } from 'http';
import { generateContent } from './_lib/ai';
import { getRacketsByIds } from './_lib/racket-service';
import { getDbRadarValues } from './_lib/testea-metrics';
import { parseAiJson } from './_lib/json-parse';

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

  // Build dynamic column keys and table/metrics templates for N rackets (2 or 3)
  const racketNames = rackets.map((r: any, i: number) => r.nombre || `Pala ${i + 1}`);

  const tableRowTemplate = (feature: string) => {
    const cols = racketNames.map((name: string) => `"${name}":"..."`).join(',');
    return `    {"feature":"${feature}",${cols}}`;
  };

  const metricsTemplate = racketNames
    .map((name: string, i: number) =>
      `    {"racketId":${i},"racketName":"${name}","isCertified":false,"radarData":{"potencia":7,"control":7,"manejabilidad":7,"puntoDulce":6,"salidaDeBola":6}}`
    )
    .join(',\n');

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
INSTRUCCIÓN: Responde con UN ÚNICO objeto JSON válido. Incluye columnas para TODAS las palas listadas. Estructura exacta:
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
${tableRowTemplate('Forma')},
${tableRowTemplate('Balance')},
${tableRowTemplate('Dureza')},
${tableRowTemplate('Punto Dulce')},
${tableRowTemplate('Nivel recomendado')},
${tableRowTemplate('Precio aprox.')}
  ],
  "metrics": [
${metricsTemplate}
  ],
  "recommendedProfiles": "qué tipo de jugador se beneficia de cada pala",
  "biomechanicalConsiderations": "riesgos de lesiones por balance y dureza",
  "conclusion": "veredicto final directo"
}`;
}

function parseAndOverrideMetrics(text: string, rackets: any[]): any {
  const parsed = parseAiJson(text);

  if (!parsed.metrics || !Array.isArray(parsed.metrics)) {
    parsed.metrics = rackets.map((r: any) => ({
      racketId: r.id,
      racketName: r.nombre || r.name,
      isCertified: false,
      radarData: { potencia: 5, control: 5, manejabilidad: 5, puntoDulce: 5, salidaDeBola: 5 },
    }));
  }

  // Override with certified DB radar values when available
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
