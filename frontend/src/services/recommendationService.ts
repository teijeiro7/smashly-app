import { supabase } from '../lib/supabase';
import { BasicFormData, AdvancedFormData, RecommendationResult, Recommendation } from '../types/recommendation';

async function getAuthHeader(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export class RecommendationService {
  static async generate(
    type: 'basic' | 'advanced',
    data: BasicFormData | AdvancedFormData
  ): Promise<RecommendationResult> {
    const headers = await getAuthHeader();
    const response = await fetch('/api/recommendations/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, data }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || body.message || `Error ${response.status} generating recommendation`);
    }

    return response.json();
  }

  static async generateWithRAG(
    type: 'basic' | 'advanced',
    data: BasicFormData | AdvancedFormData
  ): Promise<RecommendationResult> {
    const headers = await getAuthHeader();
    const response = await fetch('/api/recommendations/generate-rag', {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, data }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || body.message || `Error ${response.status} generating RAG recommendation`);
    }

    return response.json();
  }

  static async save(
    type: 'basic' | 'advanced',
    formData: BasicFormData | AdvancedFormData,
    result: RecommendationResult
  ): Promise<Recommendation> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No autenticado');

    const { data, error } = await supabase
      .from('recommendations')
      .insert({
        user_id: session.user.id,
        form_type: type,
        form_data: formData,
        recommendation_result: result,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Recommendation;
  }

  static async getLast(): Promise<Recommendation | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return (data as Recommendation) || null;
  }
}
