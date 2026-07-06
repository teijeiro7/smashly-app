import { randomUUID } from 'crypto';
import { supabaseAdmin } from './supabase';

function shortId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 8);
}

function slugifyBase(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function generateStoreSlug(storeName: string): Promise<string> {
  const base = slugifyBase(storeName) || 'tienda';
  for (let i = 0; i < 10; i++) {
    const slug = `${base}-${shortId()}`;
    const { data } = await supabaseAdmin.from('stores').select('id').eq('slug', slug).maybeSingle();
    if (!data) return slug;
  }
  return `${base}-${shortId()}${shortId()}`;
}
