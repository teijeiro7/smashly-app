import { supabase } from '../lib/supabase';
import type {
  Review,
  ReviewWithDetails,
  ReviewWithUser,
  CreateReviewDTO,
  UpdateReviewDTO,
  CreateCommentDTO,
  ReviewsResponse,
  ReviewComment,
  ReviewFilters,
} from '../types/review';

function mapRow(row: any): ReviewWithUser {
  const { user_profiles, ...review } = row;
  return { ...review, user: user_profiles ?? null };
}

export const reviewService = {
  async getReviewsByRacket(
    racketId: number,
    params?: ReviewFilters
  ): Promise<ReviewsResponse> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('reviews')
      .select('*, user_profiles!inner(id, nickname, avatar_url)', { count: 'exact' })
      .eq('racket_id', racketId);

    if (params?.rating) query = query.eq('rating', params.rating);

    const sortMap: Record<string, { column: string; asc: boolean }> = {
      recent: { column: 'created_at', asc: false },
      rating_high: { column: 'rating', asc: false },
      rating_low: { column: 'rating', asc: true },
      most_liked: { column: 'likes_count', asc: false },
    };
    const sort = sortMap[params?.sort ?? 'recent'] ?? sortMap.recent;
    query = query.order(sort.column, { ascending: sort.asc });

    const { data, count, error } = await query.range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);

    const reviews = (data ?? []).map(mapRow);
    const totalReviews = count ?? 0;
    const totalPages = Math.ceil(totalReviews / limit);

    // Compute stats from all ratings for this racket (lightweight)
    const { data: allRatings } = await supabase
      .from('reviews')
      .select('rating')
      .eq('racket_id', racketId);

    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
    let ratingSum = 0;
    (allRatings ?? []).forEach(({ rating }) => {
      dist[rating] = (dist[rating] ?? 0) + 1;
      ratingSum += rating;
    });
    const n = allRatings?.length ?? 0;

    // Check if current user has liked the fetched reviews
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const reviewIds = reviews.map(r => r.id);
      const { data: likes } = await supabase
        .from('review_likes')
        .select('review_id')
        .eq('user_id', session.user.id)
        .in('review_id', reviewIds);

      const likedSet = new Set((likes ?? []).map((l: any) => l.review_id));
      reviews.forEach(r => { (r as any).user_has_liked = likedSet.has(r.id); });
    }

    return {
      reviews,
      pagination: { total: totalReviews, page, limit, totalPages },
      stats: {
        averageRating: n > 0 ? ratingSum / n : 0,
        totalReviews,
        ratingDistribution: dist as any,
      },
    };
  },

  async getReviewsByUser(
    userId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ReviewsResponse> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('reviews')
      .select('*, user_profiles!inner(id, nickname, avatar_url)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    const reviews = (data ?? []).map(mapRow);
    const total = count ?? 0;

    return {
      reviews,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats: { averageRating: 0, totalReviews: total, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    };
  },

  async getReviewById(reviewId: string): Promise<ReviewWithDetails> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, user_profiles!inner(id, nickname, avatar_url), rackets(id, nombre, marca, modelo, imagenes)')
      .eq('id', reviewId)
      .single();

    if (error) throw new Error(error.message);
    const { user_profiles, rackets, ...review } = data as any;
    return { ...review, user: user_profiles, racket: rackets } as ReviewWithDetails;
  },

  async createReview(dto: CreateReviewDTO): Promise<Review> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No autenticado');

    const { data, error } = await supabase
      .from('reviews')
      .insert({ ...dto, user_id: session.user.id, likes_count: 0, comments_count: 0 })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Review;
  },

  async updateReview(reviewId: string, dto: UpdateReviewDTO): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .update(dto)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Review;
  },

  async deleteReview(reviewId: string): Promise<void> {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) throw new Error(error.message);
  },

  async toggleLike(reviewId: string): Promise<{ liked: boolean; likes_count: number }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No autenticado');

    const { data: existing } = await supabase
      .from('review_likes')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('review_likes').delete().eq('id', existing.id);
      // Decrement likes_count
      await supabase.rpc('decrement_review_likes', { review_id: reviewId });
    } else {
      await supabase.from('review_likes').insert({ review_id: reviewId, user_id: session.user.id });
    }

    const { data: updated } = await supabase
      .from('reviews')
      .select('likes_count')
      .eq('id', reviewId)
      .single();

    return { liked: !existing, likes_count: updated?.likes_count ?? 0 };
  },

  async getComments(reviewId: string): Promise<ReviewComment[]> {
    const { data, error } = await supabase
      .from('review_comments')
      .select('*, user_profiles!inner(id, nickname, avatar_url)')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => {
      const { user_profiles, ...comment } = row;
      return { ...comment, user: user_profiles };
    }) as ReviewComment[];
  },

  async addComment(reviewId: string, dto: CreateCommentDTO): Promise<ReviewComment> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No autenticado');

    const { data, error } = await supabase
      .from('review_comments')
      .insert({ review_id: reviewId, user_id: session.user.id, content: dto.content })
      .select('*, user_profiles!inner(id, nickname, avatar_url)')
      .single();

    if (error) throw new Error(error.message);

    const { user_profiles, ...comment } = data as any;
    return { ...comment, user: user_profiles } as ReviewComment;
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from('review_comments').delete().eq('id', commentId);
    if (error) throw new Error(error.message);
  },
};
