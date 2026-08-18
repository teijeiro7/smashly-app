#!/usr/bin/env node
/**
 * Triages pending error_incidents rows into Notion tickets. Run every 15
 * minutes by .github/workflows/error-triage.yml, on a full checkout (needs
 * git history to pull the real source snippet for a given commit).
 *
 * Zero npm dependencies on purpose — native fetch (Node 22) talks to
 * Supabase's PostgREST API, Mistral, and Notion directly; `git show`/`git
 * ls-tree` are shelled out via child_process. Keeps this workflow fast and
 * with nothing to `pnpm install`.
 */
import { execFileSync } from 'node:child_process';

const SUPABASE_URL = requireEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const MISTRAL_API_KEY = requireEnv('MISTRAL_API_KEY');
const NOTION_TOKEN = requireEnv('NOTION_TOKEN');
const NOTION_DATA_SOURCE_ID = requireEnv('NOTION_TODO_DATA_SOURCE_ID');

const NOTION_VERSION = '2025-09-03';
const MISTRAL_MODEL = 'codestral-latest';
const MISTRAL_MAX_RETRIES = 2;
const SNIPPET_CONTEXT_LINES = 30;

// Filter suave: guardado (visible en Supabase), pero nunca genera Ticket —
// no es un bug propio, es ruido conocido de red/entorno del usuario.
const IGNORED_MESSAGE_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /networkerror/i,
  /load failed/i,
  /failed to fetch/i,
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`::error::Missing required env var ${name}`);
    process.exit(1);
  }
  return value;
}

function log(msg) {
  console.log(`[error-triage] ${msg}`);
}

// ---------------------------------------------------------------------------
// Supabase (PostgREST)
// ---------------------------------------------------------------------------
async function supabaseFetch(path, { prefer, headers: extraHeaders, ...restOptions } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...restOptions,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: prefer ?? 'return=representation',
      ...extraHeaders,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase ${restOptions.method ?? 'GET'} ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

async function fetchTriageCandidates() {
  const params = new URLSearchParams({
    select: '*',
    is_own_origin: 'eq.true',
    is_ticketable: 'eq.true',
    or: '(status.eq.pending,and(status.eq.ticketed,needs_retriage.eq.true))',
    order: 'last_seen_at.asc',
    limit: '50',
  });
  return supabaseFetch(`error_incidents?${params}`);
}

async function updateIncident(id, patch) {
  await supabaseFetch(`error_incidents?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
    prefer: 'return=minimal',
  });
}

// ---------------------------------------------------------------------------
// Source snippet lookup — the whole point of running this in GitHub Actions
// instead of Vercel is having `git` and full history available.
// ---------------------------------------------------------------------------
function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch {
    return null;
  }
}

function resolveCommit(commitSha) {
  if (commitSha && git(['cat-file', '-e', `${commitSha}^{commit}`]) !== null) return commitSha;
  return 'HEAD';
}

/** First component name in a React componentStack ("at ComparisonTable\n at ErrorBoundary..."). */
function firstComponentName(componentStack) {
  const m = /at\s+([A-Z]\w+)/.exec(componentStack ?? '');
  return m ? m[1] : null;
}

function findSourceFileForComponent(commit, componentName) {
  const tree = git(['ls-tree', '-r', '--name-only', commit, '--', 'frontend/src']);
  if (!tree) return null;
  const candidates = tree.split('\n').filter((p) => new RegExp(`/${componentName}\\.tsx?$`).test(p));
  return candidates[0] ?? null;
}

function readFileAtCommit(commit, path) {
  return git(['show', `${commit}:${path}`]);
}

/**
 * Best-effort code snippet for the incident, or null if none could be
 * resolved. 'web' incidents only carry a built-asset path (no sourcemaps in
 * prod — see vite.config.ts), so they're resolved by component name instead;
 * 'api'/'manual' incidents carry a real repo-relative path from
 * report-error.ts's explicit `sourceFile`.
 */
function resolveSnippet(incident) {
  const commit = resolveCommit(incident.commit_sha);

  if (incident.source === 'web') {
    const componentName = firstComponentName(incident.component_stack);
    if (!componentName) return null;
    const path = findSourceFileForComponent(commit, componentName);
    if (!path) return null;
    const content = readFileAtCommit(commit, path);
    return content ? { path, content } : null;
  }

  if (!incident.first_frame_file) return null;
  const content = readFileAtCommit(commit, incident.first_frame_file);
  if (!content) return null;

  if (!incident.first_frame_line) return { path: incident.first_frame_file, content };

  const lines = content.split('\n');
  const start = Math.max(0, incident.first_frame_line - 1 - SNIPPET_CONTEXT_LINES);
  const end = Math.min(lines.length, incident.first_frame_line + SNIPPET_CONTEXT_LINES);
  const windowed = lines
    .slice(start, end)
    .map((l, i) => `${start + i + 1}: ${l}`)
    .join('\n');
  return { path: incident.first_frame_file, content: windowed };
}

// ---------------------------------------------------------------------------
// Mistral — enriches the incident into a structured ticket
// ---------------------------------------------------------------------------
const MISTRAL_SYSTEM_PROMPT = `Eres un ingeniero senior triando un error de producción de Smashly (catálogo y comparador de palas de pádel, React + TypeScript + Vercel serverless + Supabase). Se te da el mensaje de error, la traza, y opcionalmente un snippet del código real que estaba desplegado cuando ocurrió. Responde EXCLUSIVAMENTE con un objeto JSON con estas claves, todas string salvo donde se indique: titulo (máx 80 caracteres, con un emoji de bug al principio), sintoma (qué ve el usuario), reproduccion (pasos probables), causa_probable (señala la línea/función culpable si el snippet lo permite), ficheros_a_tocar (array de strings), criterio_aceptacion (array de strings), severidad (uno de: baja, media, alta, critica). Responde en español de España. No inventes código que no se te ha dado.`;

function buildMistralUserContent(incident, snippet) {
  const parts = [
    `Mensaje: ${incident.message}`,
    `Tipo: ${incident.error_type ?? 'desconocido'}`,
    `Fuente: ${incident.source}`,
    `Entorno: ${incident.environment}`,
    `URL: ${incident.url_path ?? 'n/a'}`,
    `Ocurrencias: ${incident.occurrence_count}`,
    `Commit: ${incident.commit_sha ?? 'n/a'}`,
  ];
  if (incident.stack) parts.push(`Traza:\n${incident.stack}`);
  if (incident.component_stack) parts.push(`Component stack:\n${incident.component_stack}`);
  if (snippet) parts.push(`Código real (${snippet.path}):\n${snippet.content}`);
  return parts.join('\n\n');
}

async function callMistral(incident, snippet) {
  const body = {
    model: MISTRAL_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: MISTRAL_SYSTEM_PROMPT },
      { role: 'user', content: buildMistralUserContent(incident, snippet) },
    ],
  };

  for (let attempt = 1; attempt <= MISTRAL_MAX_RETRIES + 1; attempt++) {
    try {
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MISTRAL_API_KEY}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Mistral ${res.status}: ${await res.text()}`);
      const data = await res.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      if (!parsed.titulo || !parsed.sintoma) throw new Error('Mistral response missing required fields');
      return parsed;
    } catch (err) {
      log(`Mistral attempt ${attempt} failed: ${err.message}`);
      if (attempt <= MISTRAL_MAX_RETRIES) await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
  return null;
}

function degradedTicket(incident) {
  return {
    titulo: `⚠️ ${incident.message.slice(0, 70)}`,
    sintoma: 'Sin enriquecer por IA — Mistral no respondió tras los reintentos. Ver traza y detalles abajo.',
    reproduccion: 'No disponible — revisar traza y URL.',
    causa_probable: 'No disponible.',
    ficheros_a_tocar: incident.first_frame_file ? [incident.first_frame_file] : [],
    criterio_aceptacion: [],
    severidad: 'media',
    degraded: true,
  };
}

// ---------------------------------------------------------------------------
// Notion
// ---------------------------------------------------------------------------
async function notionFetch(path, options = {}) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`Notion ${options.method ?? 'GET'} ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function paragraph(text) {
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: text.slice(0, 2000) } }] } };
}

function heading(text) {
  return { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: text } }] } };
}

function bulletedList(items) {
  return items.map((item) => ({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ type: 'text', text: { content: item.slice(0, 2000) } }] },
  }));
}

function codeBlock(text, language = 'plain text') {
  return {
    object: 'block',
    type: 'code',
    code: { rich_text: [{ type: 'text', text: { content: text.slice(0, 2000) } }], language },
  };
}

function buildPageBody(incident, ticket, regressionOf) {
  const blocks = [];
  if (regressionOf) {
    blocks.push(paragraph(`🔁 Regresión de un ticket ya cerrado: ${regressionOf}`));
  }
  blocks.push(heading('Síntoma'), paragraph(ticket.sintoma));
  blocks.push(heading('Reproducción'), paragraph(ticket.reproduccion));
  blocks.push(heading('Causa probable'), paragraph(ticket.causa_probable));
  if (ticket.ficheros_a_tocar?.length) {
    blocks.push(heading('Ficheros sospechosos'), ...bulletedList(ticket.ficheros_a_tocar));
  }
  if (ticket.criterio_aceptacion?.length) {
    blocks.push(heading('Criterio de aceptación'), ...bulletedList(ticket.criterio_aceptacion));
  }
  blocks.push(
    heading('Detalles'),
    paragraph(
      `Ocurrencias: ${incident.occurrence_count} · Entorno: ${incident.environment} · Fuente: ${incident.source} · Commit: ${incident.commit_sha ?? 'n/a'}`
    ),
    codeBlock(incident.fingerprint)
  );
  if (incident.stack) blocks.push(heading('Traza'), codeBlock(incident.stack.slice(0, 1900)));
  return blocks;
}

async function createNotionTicket(incident, ticket, regressionOf) {
  const page = await notionFetch('pages', {
    method: 'POST',
    body: JSON.stringify({
      parent: { type: 'data_source_id', data_source_id: NOTION_DATA_SOURCE_ID },
      properties: {
        Task: { title: [{ text: { content: ticket.titulo.slice(0, 200) } }] },
        Status: { status: { name: 'To do' } },
        Proyecto: { select: { name: 'Smashly' } },
        Notes: { rich_text: [{ text: { content: ticket.sintoma.slice(0, 2000) } }] },
      },
      children: buildPageBody(incident, ticket, regressionOf),
    }),
  });
  return page;
}

async function getNotionPageStatus(pageId) {
  const page = await notionFetch(`pages/${pageId}`);
  return page.properties?.Status?.status?.name ?? null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function isIgnoredNoise(incident) {
  return IGNORED_MESSAGE_PATTERNS.some((re) => re.test(incident.message));
}

async function triageOne(incident) {
  log(`Processing incident ${incident.id} (${incident.fingerprint.slice(0, 12)}…) — ${incident.message.slice(0, 80)}`);

  if (incident.status === 'ticketed' && incident.needs_retriage) {
    const currentStatus = await getNotionPageStatus(incident.notion_page_id);
    if (currentStatus !== 'Done') {
      log(`  still open in Notion (${currentStatus}) — clearing needs_retriage, no new ticket`);
      await updateIncident(incident.id, { needs_retriage: false });
      return;
    }
    log('  was Done — creating regression ticket');
    const snippet = resolveSnippet(incident);
    const ticket = (await callMistral(incident, snippet)) ?? degradedTicket(incident);
    const oldPageUrl = `https://notion.so/${incident.notion_page_id.replace(/-/g, '')}`;
    const page = await createNotionTicket(incident, { ...ticket, titulo: `🔁 ${ticket.titulo}` }, oldPageUrl);
    await updateIncident(incident.id, {
      notion_page_id: page.id,
      notion_created_at: new Date().toISOString(),
      needs_retriage: false,
      ai_attempts: incident.ai_attempts + (ticket.degraded ? 1 : 0),
    });
    log(`  regression ticketed → ${page.id}${ticket.degraded ? ' (degraded, no AI)' : ''}`);
    return;
  }

  if (isIgnoredNoise(incident)) {
    log('  matches ignored-noise filter — marking ignored, no ticket');
    await updateIncident(incident.id, { status: 'ignored' });
    return;
  }

  const snippet = resolveSnippet(incident);
  const ticket = (await callMistral(incident, snippet)) ?? degradedTicket(incident);
  const page = await createNotionTicket(incident, ticket);
  // Status is 'ticketed' even when degraded — the Notion page exists either
  // way, an error is never lost to an LLM failure. ai_attempts just records
  // that this one didn't get the AI enrichment, for later inspection.
  await updateIncident(incident.id, {
    status: 'ticketed',
    notion_page_id: page.id,
    notion_created_at: new Date().toISOString(),
    ai_attempts: incident.ai_attempts + (ticket.degraded ? 1 : 0),
  });
  log(`  ticketed → ${page.id}${ticket.degraded ? ' (degraded, no AI)' : ''}`);
}

async function main() {
  const incidents = await fetchTriageCandidates();
  log(`${incidents.length} incident(s) to process`);
  for (const incident of incidents) {
    try {
      await triageOne(incident);
    } catch (err) {
      console.error(`::error::Failed to triage incident ${incident.id}: ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error('::error::error-triage.mjs crashed:', err);
  process.exit(1);
});
