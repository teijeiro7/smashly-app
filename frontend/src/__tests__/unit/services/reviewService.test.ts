import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reviewService } from '../../../services/reviewService';

const { mockData, mockFrom, mockGetSession } = vi.hoisted(() => {
  const queue: any[] = [];

  function qb(d: any) {
    const c: any = new Proxy(
      { _d: d, _e: null },
      {
        get(t, p) {
          if (p === 'then') {
            return (r: (v: any) => void) => {
              if (t._d && typeof t._d === 'object' && '_count' in t._d) {
                return r({ data: null, error: null, count: t._d._count });
              }
              return r({
                data: t._d,
                error: t._e,
                count: Array.isArray(t._d) ? t._d.length : null,
              });
            };
          }
          if (p === 'catch' || p === 'finally') return undefined;
          return () => c;
        },
      }
    );
    return c;
  }

  const mf = vi.fn(() => qb(queue.shift()));
  const mgs = vi.fn(() =>
    Promise.resolve({ data: { session: { access_token: 't', user: { id: 'u1' } } } })
  );

  return { mockData: queue, mockFrom: mf, mockGetSession: mgs };
});

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getSession: mockGetSession },
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
}));

const makeReview = (overrides = {}): any => ({
  id: 'r1',
  user_id: 'u1',
  racket_id: 1,
  title: 'Great racket',
  content: 'Really enjoyed playing with this',
  rating: 5,
  created_at: '2025-01-15T00:00:00.000Z',
  updated_at: '2025-01-15T00:00:00.000Z',
  likes_count: 3,
  comments_count: 1,
  user_profiles: { id: 'u1', nickname: 'Player1', avatar_url: 'avatar.jpg' },
  ...overrides,
});

const makeComment = (overrides = {}): any => ({
  id: 'c1',
  review_id: 'r1',
  user_id: 'u1',
  content: 'Nice review!',
  created_at: '2025-01-15T00:00:00.000Z',
  updated_at: '2025-01-15T00:00:00.000Z',
  user_profiles: { id: 'u1', nickname: 'Player1', avatar_url: 'avatar.jpg' },
  ...overrides,
});

describe('reviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData.length = 0;
  });

  describe('getReviewsByRacket', () => {
    it('should fetch reviews for a racket', async () => {
      const reviews = [makeReview({ id: 'r1' }), makeReview({ id: 'r2', rating: 4 })];
      const ratings = [{ rating: 5 }, { rating: 4 }];

      mockData.push(reviews, ratings);

      const result = await reviewService.getReviewsByRacket(1);

      expect(result.reviews).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.stats.averageRating).toBe(4.5);
      expect(mockFrom).toHaveBeenCalledWith('reviews');
    });

    it('should handle empty reviews', async () => {
      mockData.push([], []);

      const result = await reviewService.getReviewsByRacket(1);

      expect(result.reviews).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.stats.averageRating).toBe(0);
    });

    it('should handle error from supabase', async () => {
      const c: any = new Proxy(
        { _d: null, _e: new Error('DB error') },
        {
          get(t, p) {
            if (p === 'then')
              return (r: (v: any) => void) => r({ data: t._d, error: t._e, count: null });
            if (p === 'catch' || p === 'finally') return undefined;
            return () => c;
          },
        }
      );
      mockFrom.mockImplementationOnce(() => c);

      await expect(reviewService.getReviewsByRacket(1)).rejects.toThrow('DB error');
    });

    it('should apply sort parameter', async () => {
      const reviews = [makeReview({ id: 'r1', rating: 5 }), makeReview({ id: 'r2', rating: 3 })];
      mockData.push(reviews, reviews);

      const result = await reviewService.getReviewsByRacket(1, { sort: 'rating_high' });

      expect(result.reviews).toHaveLength(2);
      expect(mockFrom).toHaveBeenCalledWith('reviews');
    });

    it('should apply rating filter', async () => {
      const reviews = [makeReview({ id: 'r1', rating: 5 })];
      mockData.push(reviews, reviews);

      const result = await reviewService.getReviewsByRacket(1, { rating: 5 });

      expect(result.reviews).toHaveLength(1);
    });

    it('should check user likes when authenticated', async () => {
      const reviews = [makeReview({ id: 'r1' }), makeReview({ id: 'r2' })];
      const ratings = [{ rating: 5 }, { rating: 4 }];
      const likes = [{ review_id: 'r1' }];

      mockData.push(reviews, ratings, likes);

      const result = await reviewService.getReviewsByRacket(1);

      expect(result.reviews[0].user_has_liked).toBe(true);
      expect(result.reviews[1].user_has_liked).toBe(false);
    });

    it('should skip likes check when not authenticated', async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null } });

      const reviews = [makeReview({ id: 'r1' })];
      const ratings = [{ rating: 5 }];

      mockData.push(reviews, ratings);

      const result = await reviewService.getReviewsByRacket(1);

      expect(result.reviews[0].user_has_liked).toBeUndefined();
    });
  });

  describe('getReviewsByUser', () => {
    it('should fetch reviews by user', async () => {
      const reviews = [makeReview({ id: 'r1' })];
      mockData.push(reviews);

      const result = await reviewService.getReviewsByUser('u1');

      expect(result.reviews).toHaveLength(1);
      expect(mockFrom).toHaveBeenCalledWith('reviews');
    });

    it('should return empty when user has no reviews', async () => {
      mockData.push([]);

      const result = await reviewService.getReviewsByUser('u1');

      expect(result.reviews).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getReviewById', () => {
    it('should fetch a single review with details', async () => {
      const review = makeReview({
        rackets: {
          id: 1,
          nombre: 'Pro Drive',
          marca: 'Babolat',
          modelo: '2025',
          imagenes: ['img.jpg'],
        },
      });
      mockData.push(review);

      const result = await reviewService.getReviewById('r1');

      expect(result.id).toBe('r1');
      expect(result.racket?.nombre).toBe('Pro Drive');
      expect(mockFrom).toHaveBeenCalledWith('reviews');
    });

    it('should throw when review not found', async () => {
      const c: any = new Proxy(
        { _d: null, _e: new Error('Not found') },
        {
          get(t, p) {
            if (p === 'then')
              return (r: (v: any) => void) => r({ data: t._d, error: t._e, count: null });
            if (p === 'catch' || p === 'finally') return undefined;
            return () => c;
          },
        }
      );
      mockFrom.mockImplementationOnce(() => c);

      await expect(reviewService.getReviewById('bad-id')).rejects.toThrow('Not found');
    });
  });

  describe('createReview', () => {
    it('should create a new review', async () => {
      const dto = { racket_id: 1, title: 'Great', content: 'Amazing', rating: 5 };
      const created = makeReview();
      mockData.push(created);

      const result = await reviewService.createReview(dto);

      expect(result.id).toBe('r1');
      expect(mockGetSession).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith('reviews');
    });

    it('should throw when not authenticated', async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null } });

      await expect(
        reviewService.createReview({ racket_id: 1, title: 'T', content: 'C', rating: 5 })
      ).rejects.toThrow('No autenticado');
    });
  });

  describe('updateReview', () => {
    it('should update a review', async () => {
      const dto = { rating: 4, content: 'Updated' };
      const updated = makeReview({ rating: 4, content: 'Updated' });
      mockData.push(updated);

      const result = await reviewService.updateReview('r1', dto);

      expect(result.rating).toBe(4);
      expect(result.content).toBe('Updated');
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      mockData.push(null);

      await expect(reviewService.deleteReview('r1')).resolves.not.toThrow();
      expect(mockFrom).toHaveBeenCalledWith('reviews');
    });

    it('should throw on error', async () => {
      const c: any = new Proxy(
        { _d: null, _e: new Error('Delete failed') },
        {
          get(t, p) {
            if (p === 'then')
              return (r: (v: any) => void) => r({ data: t._d, error: t._e, count: null });
            if (p === 'catch' || p === 'finally') return undefined;
            return () => c;
          },
        }
      );
      mockFrom.mockImplementationOnce(() => c);

      await expect(reviewService.deleteReview('r1')).rejects.toThrow('Delete failed');
    });
  });

  describe('toggleLike', () => {
    it('should like a review when not previously liked', async () => {
      mockData.push(null, null, { likes_count: 4 });

      const result = await reviewService.toggleLike('r1');

      expect(result.liked).toBe(true);
      expect(result.likes_count).toBe(4);
      expect(mockGetSession).toHaveBeenCalled();
    });

    it('should unlike a review when already liked', async () => {
      mockData.push({ id: 'like-1' }, null, { likes_count: 2 });

      const result = await reviewService.toggleLike('r1');

      expect(result.liked).toBe(false);
      expect(result.likes_count).toBe(2);
    });

    it('should throw when not authenticated', async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null } });

      await expect(reviewService.toggleLike('r1')).rejects.toThrow('No autenticado');
    });
  });

  describe('getComments', () => {
    it('should fetch comments for a review', async () => {
      const comments = [makeComment(), makeComment({ id: 'c2', content: 'Thanks!' })];
      mockData.push(comments);

      const result = await reviewService.getComments('r1');

      expect(result).toHaveLength(2);
      expect(mockFrom).toHaveBeenCalledWith('review_comments');
    });

    it('should return empty array when no comments', async () => {
      mockData.push([]);

      const result = await reviewService.getComments('r1');

      expect(result).toEqual([]);
    });
  });

  describe('addComment', () => {
    it('should add a comment to a review', async () => {
      const dto = { content: 'Nice review!' };
      const created = makeComment();
      mockData.push(created);

      const result = await reviewService.addComment('r1', dto);

      expect(result.content).toBe('Nice review!');
      expect(mockGetSession).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith('review_comments');
    });

    it('should throw when not authenticated', async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null } });

      await expect(reviewService.addComment('r1', { content: 'Nice!' })).rejects.toThrow(
        'No autenticado'
      );
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      mockData.push(null);

      await expect(reviewService.deleteComment('c1')).resolves.not.toThrow();
      expect(mockFrom).toHaveBeenCalledWith('review_comments');
    });
  });
});
