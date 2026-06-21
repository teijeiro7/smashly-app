import { supabaseAdmin } from './supabase';

export async function getAllRackets(): Promise<any[]> {
  const { data, error } = await supabaseAdmin
    .from('rackets')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw new Error(`Error fetching rackets: ${error.message}`);
  return data ?? [];
}

export async function getRacketsByIds(ids: number[]): Promise<any[]> {
  const { data, error } = await supabaseAdmin
    .from('rackets')
    .select('*')
    .in('id', ids);

  if (error) throw new Error(`Error fetching rackets by ids: ${error.message}`);
  return data ?? [];
}
