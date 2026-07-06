#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const client = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function shortId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 8);
}

async function generateUniqueSlug(baseName: string): Promise<string> {
  const base = slugify(baseName) || 'tienda';
  for (let i = 0; i < 10; i++) {
    const slug = `${base}-${shortId()}`;
    const { data } = await client.from('stores').select('id').eq('slug', slug).maybeSingle();
    if (!data) return slug;
  }
  return `${base}-${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

async function main() {
  const { data: stores, error } = await client.from('stores').select('*').is('slug', null);
  if (error) { console.error('Error fetching stores:', error); process.exit(1); }
  if (!stores?.length) { console.log('No stores without slugs.'); return; }

  for (const store of stores) {
    const slug = await generateUniqueSlug(store.store_name);
    const { error: updateError } = await client.from('stores').update({ slug }).eq('id', store.id);
    if (updateError) {
      console.error(`Error updating ${store.id} (${store.store_name}):`, updateError);
    } else {
      console.log(`✓ ${store.store_name} → ${slug}`);
    }
  }

  console.log(`Done. ${stores.length} stores processed.`);
}

main();
