import { supabaseAdmin } from './supabase';

export async function searchSimilarRackets(
  queryEmbedding: number[],
  options: { threshold?: number; limit?: number; safeRacketIds: number[] }
): Promise<Array<{ racketId: number; content: string; metadata: Record<string, any>; similarity: number }>> {
  const { threshold = 0.3, limit = 10, safeRacketIds } = options;

  const { data, error } = await supabaseAdmin.rpc('match_rackets', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: 100,
    filter_metadata: {},
  });

  if (error) throw new Error(`Vector search error: ${error.message}`);

  return (data || [])
    .filter((r: any) => safeRacketIds.includes(r.racket_id))
    .slice(0, limit)
    .map((r: any) => ({
      racketId: r.racket_id,
      content: r.content,
      metadata: r.metadata,
      similarity: r.similarity,
    }));
}

export async function searchRelevantReviews(
  queryEmbedding: number[],
  options: { threshold?: number; limit?: number; racketIds?: number[] }
): Promise<Array<{ reviewId: string; racketId: number; content: string; metadata: Record<string, any>; similarity: number }>> {
  const { threshold = 0.3, limit = 8, racketIds } = options;

  const { data, error } = await supabaseAdmin.rpc('match_reviews', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit * 2,
  });

  if (error) {
    console.error('Review vector search error:', error);
    return [];
  }

  let results = data || [];
  if (racketIds?.length) {
    results = results.filter((r: any) => racketIds.includes(r.racket_id));
  }

  return results.slice(0, limit).map((r: any) => ({
    reviewId: r.review_id,
    racketId: r.racket_id,
    content: r.content,
    metadata: r.metadata,
    similarity: r.similarity,
  }));
}

export async function searchKnowledge(
  queryEmbedding: number[],
  options: { threshold?: number; limit?: number }
): Promise<Array<{ content: string; source: string; similarity: number }>> {
  const { threshold = 0.3, limit = 6 } = options;

  const { data, error } = await supabaseAdmin.rpc('match_knowledge', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    console.error('Knowledge vector search error:', error);
    return [];
  }

  return (data || []).map((r: any) => ({
    content: r.content,
    source: r.source,
    similarity: r.similarity,
  }));
}
