import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
}

interface UseReviewStatsResult {
  stats: ReviewStats | null;
  loading: boolean;
  error: string | null;
}

async function fetchReviewStats(racketId: number): Promise<ReviewStats> {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('racket_id', racketId);

  if (error) throw new Error(error.message);

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
  let sum = 0;

  (data ?? []).forEach(({ rating }) => {
    dist[rating] = (dist[rating] ?? 0) + 1;
    sum += rating;
  });

  const n = data?.length ?? 0;

  return {
    totalReviews: n,
    averageRating: n > 0 ? sum / n : 0,
    ratingDistribution: dist as any,
  };
}

export const useReviewStats = (racketId: number | undefined): UseReviewStatsResult => {
  const { data: stats = null, isLoading, error } = useQuery<ReviewStats | null, Error>({
    queryKey: ['review-stats', racketId],
    queryFn: () => fetchReviewStats(racketId!),
    enabled: !!racketId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    stats,
    loading: isLoading,
    error: error ? error.message : null,
  };
};
