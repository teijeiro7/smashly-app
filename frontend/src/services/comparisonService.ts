import { supabase } from '../lib/supabase';
import { ComparisonResult, RacketComparisonData } from '../types/racket';

export interface ComparisonResponse {
  comparison: ComparisonResult;
}

export interface SavedComparison {
  id: string;
  user_id: string;
  racket_ids: number[];
  comparison_text: string;
  metrics?: RacketComparisonData[];
  share_token?: string;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

async function getAuthHeader(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export const ComparisonService = {
  /** AI comparison via Vercel serverless function */
  compareRackets: async (racketIds: number[], userProfile?: any): Promise<ComparisonResponse> => {
    const headers = await getAuthHeader();
    const response = await fetch('/api/comparison', {
      method: 'POST',
      headers,
      body: JSON.stringify({ racketIds, userProfile }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al comparar palas');
    }

    return response.json();
  },

  saveComparison: async (
    racketIds: number[],
    comparison: ComparisonResult
  ): Promise<SavedComparison> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No autenticado');

    const { data, error } = await supabase
      .from('comparisons')
      .insert({
        user_id: session.user.id,
        racket_ids: racketIds,
        comparison_text: JSON.stringify(comparison),
        metrics: comparison.metrics,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as SavedComparison;
  },

  getUserComparisons: async (): Promise<SavedComparison[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase
      .from('comparisons')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as SavedComparison[];
  },

  getComparisonById: async (id: string): Promise<SavedComparison> => {
    const { data, error } = await supabase
      .from('comparisons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as SavedComparison;
  },

  deleteComparison: async (id: string): Promise<void> => {
    const { error } = await supabase.from('comparisons').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  getComparisonCount: async (): Promise<number> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return 0;

    const { count, error } = await supabase
      .from('comparisons')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    if (error) return 0;
    return count || 0;
  },

  shareComparison: async (id: string): Promise<string> => {
    const shareToken = crypto.randomUUID();

    const { data, error } = await supabase
      .from('comparisons')
      .update({ share_token: shareToken, is_public: true })
      .eq('id', id)
      .select('share_token')
      .single();

    if (error) throw new Error(error.message);
    return data.share_token;
  },

  unshareComparison: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('comparisons')
      .update({ is_public: false })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  getSharedComparison: async (token: string): Promise<SavedComparison> => {
    const { data, error } = await supabase
      .from('comparisons')
      .select('*')
      .eq('share_token', token)
      .eq('is_public', true)
      .single();

    if (error) throw new Error('Comparación compartida no encontrada');
    return data as SavedComparison;
  },
};
