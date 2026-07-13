import { describe, it, expect, beforeEach, vi } from 'vitest';
import comparisonService, { SavedComparison } from '@/services/comparisonService';
import { RacketComparisonData } from '@/types/racket';

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

vi.mock('@/lib/supabase', () => ({ supabase }));

const mockComparisonResult = {
  executiveSummary: 'Test summary',
  technicalAnalysis: [],
  comparisonTable: '| Test | Table |',
  recommendedProfiles: 'Test profiles',
  biomechanicalConsiderations: 'Test considerations',
  conclusion: 'Test conclusion',
  metrics: [
    {
      racketName: 'Racket 1',
      radarData: { potencia: 8, control: 7, salidaDeBola: 6, manejabilidad: 9, puntoDulce: 7 },
      isCertified: false,
    },
    {
      racketName: 'Racket 2',
      radarData: { potencia: 9, control: 6, salidaDeBola: 5, manejabilidad: 7, puntoDulce: 6 },
      isCertified: false,
    },
  ] as RacketComparisonData[],
};

const mockSavedComparison: SavedComparison = {
  id: 'comp-123',
  user_id: 'user-123',
  racket_ids: [1, 2],
  comparison_text: JSON.stringify(mockComparisonResult),
  metrics: mockComparisonResult.metrics,
  created_at: '2025-01-15T00:00:00.000Z',
  updated_at: '2025-01-15T00:00:00.000Z',
};

describe('ComparisonService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.data = mockSavedComparison;
    mockConfig.error = null;
    mockConfig.count = null;
  });

  describe('compareRackets', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should compare rackets successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          comparison: mockComparisonResult,
        }),
      });

      const result = await comparisonService.compareRackets([1, 2]);

      expect(result.comparison).toEqual(mockComparisonResult);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/comparison',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"racketIds":[1,2]'),
        })
      );
    });

    it('should include user profile in request when provided', async () => {
      const userProfile = {
        gameLevel: 'Intermedio',
        playingStyle: 'Polivalente',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comparison: mockComparisonResult }),
      });

      await comparisonService.compareRackets([1, 2], userProfile);

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.userProfile).toEqual(userProfile);
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Comparison failed' }),
      });

      await expect(comparisonService.compareRackets([1, 2])).rejects.toThrow('Comparison failed');
    });

    it('should throw error when error parsing fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(comparisonService.compareRackets([1, 2])).rejects.toThrow(
        'Error al comparar palas'
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(comparisonService.compareRackets([1, 2])).rejects.toThrow('Network error');
    });
  });

  describe('saveComparison', () => {
    it('should save comparison successfully', async () => {
      const result = await comparisonService.saveComparison([1, 2], mockComparisonResult);

      expect(result).toEqual(mockSavedComparison);
    });

    it('should throw error when save fails', async () => {
      mockConfig.error = new Error('Save failed');

      await expect(comparisonService.saveComparison([1, 2], mockComparisonResult)).rejects.toThrow(
        'Save failed'
      );
    });
  });

  describe('getUserComparisons', () => {
    it('should get user comparisons successfully', async () => {
      mockConfig.data = [mockSavedComparison];

      const result = await comparisonService.getUserComparisons();

      expect(result).toEqual([mockSavedComparison]);
    });

    it('should return empty array when no comparisons exist', async () => {
      mockConfig.data = [];

      const result = await comparisonService.getUserComparisons();

      expect(result).toEqual([]);
    });

    it('should throw error when fetch fails', async () => {
      mockConfig.error = new Error('Fetch failed');

      await expect(comparisonService.getUserComparisons()).rejects.toThrow('Fetch failed');
    });
  });

  describe('getComparisonById', () => {
    it('should get comparison by id successfully', async () => {
      mockConfig.data = mockSavedComparison;

      const result = await comparisonService.getComparisonById('comp-123');

      expect(result).toEqual(mockSavedComparison);
    });

    it('should throw error when comparison not found', async () => {
      mockConfig.error = new Error('Not found');

      await expect(comparisonService.getComparisonById('nonexistent')).rejects.toThrow('Not found');
    });
  });

  describe('deleteComparison', () => {
    it('should delete comparison successfully', async () => {
      await expect(comparisonService.deleteComparison('comp-123')).resolves.not.toThrow();
    });

    it('should throw error when delete fails', async () => {
      mockConfig.error = new Error('Delete failed');

      await expect(comparisonService.deleteComparison('comp-123')).rejects.toThrow('Delete failed');
    });
  });

  describe('getComparisonCount', () => {
    it('should get comparison count successfully', async () => {
      mockConfig.count = 5;

      const result = await comparisonService.getComparisonCount();

      expect(result).toBe(5);
    });

    it('should return 0 on error', async () => {
      mockConfig.error = new Error('Database error');

      await expect(comparisonService.getComparisonCount()).resolves.toBe(0);
    });
  });

  describe('shareComparison', () => {
    it('should share comparison and return token', async () => {
      mockConfig.data = { share_token: 'share-token-abc' };

      const result = await comparisonService.shareComparison('comp-123');

      expect(result).toBe('share-token-abc');
    });

    it('should throw error when share fails', async () => {
      mockConfig.error = new Error('Share failed');

      await expect(comparisonService.shareComparison('comp-123')).rejects.toThrow('Share failed');
    });
  });

  describe('unshareComparison', () => {
    it('should unshare comparison successfully', async () => {
      await expect(comparisonService.unshareComparison('comp-123')).resolves.not.toThrow();
    });

    it('should throw error when unshare fails', async () => {
      mockConfig.error = new Error('Unshare failed');

      await expect(comparisonService.unshareComparison('comp-123')).rejects.toThrow('Unshare failed');
    });
  });

  describe('getSharedComparison', () => {
    it('should get shared comparison by token', async () => {
      mockConfig.data = mockSavedComparison;

      const result = await comparisonService.getSharedComparison('share-token-abc');

      expect(result).toEqual(mockSavedComparison);
    });

    it('should throw error when shared comparison not found', async () => {
      mockConfig.error = new Error('Not found');

      await expect(comparisonService.getSharedComparison('invalid-token')).rejects.toThrow(
        'Comparación compartida no encontrada'
      );
    });
  });
});
