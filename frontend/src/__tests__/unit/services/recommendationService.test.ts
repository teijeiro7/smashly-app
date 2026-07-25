import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecommendationService } from '../../../services/recommendationService';

const fetchMock = vi.fn();
global.fetch = fetchMock;

type SupabaseMock = {
  supabase: {
    from: ReturnType<typeof vi.fn>;
    auth: { getSession: ReturnType<typeof vi.fn> };
  };
  mockFrom: ReturnType<typeof vi.fn>;
  mockData: any[];
};

const __mock = vi.hoisted((): SupabaseMock => {
  const mockData: any[] = [];

  function createQueryBuilder(data: any) {
    const chain: any = new Proxy(
      { _data: data, _error: null },
      {
        get(target, prop) {
          if (prop === 'then') {
            return (resolve: (v: any) => void) =>
              resolve({ data: target._data, error: target._error, count: null });
          }
          if (prop === 'catch') return undefined;
          if (prop === 'finally') return (fn: () => void) => fn();
          return () => chain;
        },
      }
    );
    return chain;
  }

  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => createQueryBuilder(mockData)),
          maybeSingle: vi.fn(() => createQueryBuilder(mockData[0] ?? null)),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => createQueryBuilder(mockData[0] ?? null)),
      })),
    })),
  }));

  const client = {
    from: mockFrom,
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({
          data: {
            session: { access_token: 'mock-token', user: { id: 'mock-user-id' } },
          },
        })
      ),
    },
  };

  return { supabase: client as any, mockFrom, mockData };
});

vi.mock('../../../lib/supabase', () => ({
  supabase: __mock.supabase,
}));

function mock(): SupabaseMock {
  return __mock;
}

describe('RecommendationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock().mockData.length = 0;
  });

  describe('generate', () => {
    it('should generate basic recommendation', async () => {
      const formData = {
        weight: 70,
        height: 175,
        playLevel: 'Intermedio',
        playStyle: 'Ofensivo',
      };

      const mockResult = {
        recommendations: [
          { id: 1, name: 'Racket 1', score: 9.5 },
          { id: 2, name: 'Racket 2', score: 9.0 },
        ],
        explanation: 'Based on your profile...',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await RecommendationService.generate('basic', formData as any);

      expect(result).toEqual(mockResult);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/recommendations/generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ type: 'basic', data: formData }),
        })
      );
    });

    it('should generate advanced recommendation', async () => {
      const formData = {
        weight: 70,
        height: 175,
        playLevel: 'Avanzado',
        playStyle: 'Defensivo',
        injuries: 'Ninguna',
        budget: 200,
      };

      const mockResult = {
        recommendations: [{ id: 1, name: 'Racket 1', score: 9.8 }],
        explanation: 'Advanced analysis...',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await RecommendationService.generate('advanced', formData as any);

      expect(result).toEqual(mockResult);
    });

    it('should handle error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Error generating recommendation' }),
      });

      await expect(
        RecommendationService.generate('basic', {} as any)
      ).rejects.toThrow('Error generating recommendation');
    });
  });

  describe('generateWithRAG', () => {
    it('should generate recommendation with RAG', async () => {
      const formData = {
        weight: 70,
        height: 175,
        playLevel: 'Intermedio',
        playStyle: 'Ofensivo',
      };

      const mockResult = {
        recommendations: [{ id: 1, name: 'Racket 1', score: 9.5 }],
        explanation: 'RAG-based analysis...',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await RecommendationService.generateWithRAG('basic', formData as any);

      expect(result).toEqual(mockResult);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/recommendations/generate-rag',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ type: 'basic', data: formData }),
        })
      );
    });

    it('should handle RAG generation error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Error generating RAG recommendation' }),
      });

      await expect(
        RecommendationService.generateWithRAG('basic', {} as any)
      ).rejects.toThrow('Error generating RAG recommendation');
    });
  });

  describe('save', () => {
    it('should save recommendation', async () => {
      const formData = { weight: 70, height: 175 };
      const result = { recommendations: [], explanation: 'Test' };
      const savedRecommendation = {
        id: 'rec-1',
        user_id: 'mock-user-id',
        form_type: 'basic',
        form_data: formData,
        recommendation_result: result,
        created_at: '2024-01-01',
      };

      mock().mockData.push(savedRecommendation);

      const saved = await RecommendationService.save('basic', formData as any, result as any);

      expect(saved).toEqual(savedRecommendation);
      expect(mock().mockFrom).toHaveBeenCalledWith('recommendations');
    });

    it('should throw when not authenticated', async () => {
      mock().supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
      });

      await expect(
        RecommendationService.save('basic', {} as any, {} as any)
      ).rejects.toThrow('No autenticado');
    });
  });

  describe('getLast', () => {
    it('should get last recommendation', async () => {
      const mockRecommendation = {
        id: 'rec-1',
        form_type: 'basic',
        created_at: '2024-01-01',
      };

      mock().mockData.push(mockRecommendation);

      const result = await RecommendationService.getLast();

      expect(result).toBeDefined();
      expect(mock().mockFrom).toHaveBeenCalledWith('recommendations');
    });

    it('should return null when not authenticated', async () => {
      mock().supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
      });

      const result = await RecommendationService.getLast();

      expect(result).toBeNull();
    });
  });
});
