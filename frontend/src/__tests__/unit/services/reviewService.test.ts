import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reviewService } from '../../../services/reviewService';

const { mockConfig, supabase } = vi.hoisted(() => {
  const mockConfig: any = { data: null, error: null, count: null };

  function mockSelectReturn(resp: any) {
    const chain: any = { data: resp.data, error: resp.error, count: resp.count };
    chain.order = vi.fn(() => chain);
    chain.range = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.in = vi.fn(() => chain);
    chain.or = vi.fn(() => chain);
    chain.ilike = vi.fn(() => chain);
    chain.neq = vi.fn(() => chain);
    chain.gte = vi.fn(() => chain);
    chain.single = vi.fn(async () => ({
      data: Array.isArray(resp.data) ? (resp.data.length > 0 ? resp.data[0] : null) : resp.data,
      error: resp.error,
    }));
    chain.maybeSingle = vi.fn(async () => ({
      data: Array.isArray(resp.data) ? (resp.data.length > 0 ? resp.data[0] : null) : resp.data,
      error: resp.error,
    }));
    chain.select = vi.fn(() => chain);
    chain.insert = vi.fn(() => ({ ...chain, select: vi.fn(() => ({ ...chain, single: vi.fn(async () => resp) })) }));
    chain.update = vi.fn(() => ({ ...chain, select: vi.fn(() => ({ ...chain, single: vi.fn(async () => resp) })) }));
    chain.delete = vi.fn(() => chain);
    chain.upsert = vi.fn(() => ({ ...chain, select: vi.fn(() => ({ ...chain, single: vi.fn(async () => resp) })) }));
    chain.then = async (resolve: any) => resolve(resp);
    return chain;
  }

  return {
    mockConfig,
    supabase: {
      from: vi.fn(() => mockSelectReturn(mockConfig)),
      auth: {
        getSession: vi.fn(async () => ({
          data: { session: { access_token: 'test-token', user: { id: 'test-user', email: 'test@test.com' } } },
          error: null,
        })),
        signOut: vi.fn(async () => ({ error: null })),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
      rpc: vi.fn(),
      storage: { from: vi.fn() },
    },
  };
});

vi.mock('../../../lib/supabase', () => ({ supabase }));

const mockReviewRow = {
  id: '1',
  rating: 5,
  comment: 'Great racket',
  racket_id: 1,
  user_id: 'user-1',
  likes_count: 3,
  comments_count: 1,
  created_at: '2025-01-15T00:00:00.000Z',
  user_profiles: { id: 'user-1', nickname: 'Player1', avatar_url: 'avatar.jpg' },
};

const mockReviewRow2 = {
  id: '2',
  rating: 4,
  comment: 'Good',
  racket_id: 1,
  user_id: 'user-2',
  likes_count: 1,
  comments_count: 0,
  created_at: '2025-01-16T00:00:00.000Z',
  user_profiles: { id: 'user-2', nickname: 'Player2', avatar_url: null },
};

describe('reviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.data = [mockReviewRow, mockReviewRow2];
    mockConfig.error = null;
    mockConfig.count = 2;
  });

  describe('getReviewsByRacket', () => {
    it('should fetch reviews for a racket', async () => {
      const result = await reviewService.getReviewsByRacket(1);

      expect(result.reviews).toHaveLength(2);
      expect(result.reviews[0].rating).toBe(5);
      expect(result.reviews[0].user).toEqual(mockReviewRow.user_profiles);
      expect(result.pagination.total).toBe(2);
    });

    it('should handle errors', async () => {
      mockConfig.error = new Error('Not found');

      await expect(reviewService.getReviewsByRacket(999)).rejects.toThrow('Not found');
    });
  });

  describe('createReview', () => {
    it('should create a new review', async () => {
      const newReview = {
        racket_id: 1,
        rating: 5,
        comment: 'Excellent!',
        power: 9,
        control: 8,
      };

      const createdReview = {
        id: '1',
        ...newReview,
        user_id: 'test-user',
        likes_count: 0,
        comments_count: 0,
      };
      mockConfig.data = createdReview;

      const result = await reviewService.createReview(newReview as any);

      expect(result).toEqual(createdReview);
    });
  });

  describe('updateReview', () => {
    it('should update a review', async () => {
      const updates = { rating: 4, comment: 'Updated comment' };
      const updatedReview = { id: '1', ...updates };
      mockConfig.data = updatedReview;

      const result = await reviewService.updateReview('1', updates);

      expect(result).toEqual(updatedReview);
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      await reviewService.deleteReview('1');

      expect(mockConfig.error).toBeNull();
    });
  });

  describe('toggleLike', () => {
    it('should toggle like on a review when already liked', async () => {
      mockConfig.data = [{ id: 'like-1', review_id: '1', likes_count: 5 }];

      const result = await reviewService.toggleLike('1');

      expect(result.liked).toBe(false);
      expect(result.likes_count).toBe(5);
    });

    it('should toggle like on a review when not liked yet', async () => {
      mockConfig.data = [];

      const result = await reviewService.toggleLike('1');

      expect(result.liked).toBe(true);
      expect(result.likes_count).toBe(0);
    });
  });

  describe('getComments', () => {
    it('should fetch comments for a review', async () => {
      const mockCommentRow = {
        id: '1',
        content: 'Great review!',
        review_id: '1',
        user_id: 'user-1',
        created_at: '2025-01-15T00:00:00.000Z',
        user_profiles: { id: 'user-1', nickname: 'Player1', avatar_url: 'avatar.jpg' },
      };
      mockConfig.data = [mockCommentRow];

      const result = await reviewService.getComments('1');

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Great review!');
      expect(result[0].user).toEqual(mockCommentRow.user_profiles);
    });
  });

  describe('addComment', () => {
    it('should add a comment to a review', async () => {
      const comment = { content: 'Nice review!' };
      const createdComment = {
        id: '1',
        content: 'Nice review!',
        review_id: '1',
        user_id: 'test-user',
        created_at: '2025-01-15T00:00:00.000Z',
        user_profiles: { id: 'test-user', nickname: 'TestUser', avatar_url: null },
      };
      mockConfig.data = createdComment;

      const result = await reviewService.addComment('1', comment);

      expect(result.content).toBe('Nice review!');
      expect(result.user).toEqual(createdComment.user_profiles);
    });
  });
});
