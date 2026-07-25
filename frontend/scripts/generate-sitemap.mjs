#!/usr/bin/env node
/**
 * Generates public/sitemap.xml at build time from the live racket catalog.
 *
 * Before this, sitemap.xml was a hand-maintained static file with 8 URLs —
 * the ~800-racket catalog (and every racket detail page) was entirely
 * unindexed. Runs as a prebuild step (see frontend/package.json "build").
 *
 * Slug/URL scheme must stay in sync with buildRacketUrl() in
 * src/config/seo.ts — this intentionally duplicates that logic rather than
 * importing it, since this script runs standalone via plain Node (no
 * TS/Vite transform) before the rest of the build.
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SITE_URL = 'https://smashly-app.es';
const OUTPUT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/sitemap.xml');
const TODAY = new Date().toISOString().slice(0, 10);

const STATIC_PAGES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/catalog', changefreq: 'daily', priority: '0.9' },
  { path: '/best-racket', changefreq: 'weekly', priority: '0.9' },
  { path: '/compare', changefreq: 'weekly', priority: '0.8' },
  { path: '/compare-rackets', changefreq: 'weekly', priority: '0.8' },
  { path: '/faq', changefreq: 'monthly', priority: '0.6' },
  { path: '/terms-and-conditions', changefreq: 'yearly', priority: '0.2' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.2' },
];

// Mirrors slugify() in src/config/seo.ts.
function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function staticUrlEntry(page) {
  return `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
}

function racketUrlEntry(racket) {
  const slug = slugify(racket.name || '');
  const loc = `${SITE_URL}/racket-detail?id=${racket.id}&name=${encodeURIComponent(slug)}`;
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
}

async function fetchAllRackets(supabase) {
  // rackets uses English column names (name, not nombre — see
  // api/_lib/racket-mapper.ts for the full story). Excludes discontinued
  // rackets: their detail pages aren't worth indexing.
  const PAGE = 1000;
  const all = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('rackets')
      .select('id, name')
      .eq('discontinued', false)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return all;
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      '[generate-sitemap] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY not set — ' +
        'skipping sitemap generation, leaving the existing public/sitemap.xml as-is.'
    );
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let rackets;
  try {
    rackets = await fetchAllRackets(supabase);
  } catch (err) {
    console.warn(
      '[generate-sitemap] Failed to fetch rackets, leaving existing sitemap.xml as-is:',
      err?.message || err
    );
    return;
  }

  const entries = [...STATIC_PAGES.map(staticUrlEntry), ...rackets.map(racketUrlEntry)];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${entries.join('\n')}
</urlset>
`;

  writeFileSync(OUTPUT_PATH, xml, 'utf-8');
  console.log(`[generate-sitemap] Wrote ${entries.length} URLs (${rackets.length} rackets) to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('[generate-sitemap] Unexpected error, leaving existing sitemap.xml as-is:', err);
});
