import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import racketService from '@/services/racketService';

const { mockConfig, supabase } = vi.hoisted(() => {
  const mockConfig: any = { data: null, error: null, count: null };

  function mockSelectReturn(resp: any) {
    const chain: any = { data: resp.data, error: resp.error, count: resp.count };
    chain.order = vi.fn(() => chain);
    chain.range = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.not = vi.fn(() => chain);
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
    chain.insert = vi.fn(() => ({
      ...chain,
      select: vi.fn(() => ({ ...chain, single: vi.fn(async () => resp) })),
    }));
    chain.update = vi.fn(() => ({
      ...chain,
      select: vi.fn(() => ({ ...chain, single: vi.fn(async () => resp) })),
    }));
    chain.delete = vi.fn(() => chain);
    chain.upsert = vi.fn(() => ({
      ...chain,
      select: vi.fn(() => ({ ...chain, single: vi.fn(async () => resp) })),
    }));
    chain.then = async (resolve: any) => resolve(resp);
    return chain;
  }

  return {
    mockConfig,
    supabase: {
      from: vi.fn(() => mockSelectReturn(mockConfig)),
      auth: {
        getSession: vi.fn(async () => ({
          data: {
            session: {
              access_token: 'test-token',
              user: { id: 'test-user', email: 'test@test.com' },
            },
          },
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

const mockDbRackets = [
  {
    id: 1,
    name: 'Adidas Metalbone 3.1',
    brand: 'Adidas',
    model: 'Metalbone 3.1',
    images: ['metalbone.jpg'],
    description: 'Pala de potencia',
    on_offer: true,
    created_at: '2025-01-15T00:00:00.000Z',
    updated_at: '2025-01-15T00:00:00.000Z',
    view_count: 0,
    padelnuestro_actual_price: 250,
    padelnuestro_original_price: 280,
    padelnuestro_discount_percentage: 11,
    padelnuestro_link: 'https://padelmarket.com/pala1',
  },
  {
    id: 2,
    name: 'Bullpadel Vertex 04',
    brand: 'Bullpadel',
    model: 'Vertex 04',
    images: ['vertex.jpg'],
    description: 'Pala de control',
    on_offer: true,
    created_at: '2025-01-15T00:00:00.000Z',
    updated_at: '2025-01-15T00:00:00.000Z',
    view_count: 0,
    padelnuestro_actual_price: 180,
    padelnuestro_original_price: 200,
    padelnuestro_discount_percentage: 10,
    padelnuestro_link: 'https://padelnuestro.com/pala2',
  },
];

describe('RacketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.data = mockDbRackets;
    mockConfig.error = null;
    mockConfig.count = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllRackets', () => {
    it('should fetch all rackets successfully', async () => {
      const result = await racketService.getAllRackets();

      expect(result).toHaveLength(2);
      expect(result[0].nombre).toBe('Adidas Metalbone 3.1');
      expect(result[0].marca).toBe('Adidas');
      expect(result[0].precio_actual).toBe(250);
    });

    it('should throw error when supabase query fails', async () => {
      mockConfig.error = new Error('Server error');

      await expect(racketService.getAllRackets()).rejects.toThrow('Server error');
    });

    it('excludes discontinued rackets via IS NOT TRUE (discontinued is a real, nullable column)', async () => {
      await racketService.getAllRackets();
      const chain = supabase.from.mock.results[0].value;
      // `discontinued = false` would silently drop rows where the column is
      // NULL (unknown status) instead of showing them, so this must be
      // `not(discontinued, is, true)` rather than `eq(discontinued, false)`.
      expect(chain.not).toHaveBeenCalledWith('discontinued', 'is', true);
      expect(chain.eq).not.toHaveBeenCalledWith('discontinued', false);
    });
  });

  describe('getRacketsWithPagination', () => {
    it('should fetch paginated rackets with default params', async () => {
      const result = await racketService.getRacketsWithPagination();

      expect(result).toHaveLength(2);
      expect(result[0].nombre).toBe('Adidas Metalbone 3.1');
    });

    it('should fetch paginated rackets with custom params', async () => {
      const result = await racketService.getRacketsWithPagination(0, 10);

      expect(result).toHaveLength(2);
      expect(result[1].nombre).toBe('Bullpadel Vertex 04');
    });

    it('should handle empty data', async () => {
      mockConfig.data = [];

      const result = await racketService.getRacketsWithPagination();

      expect(result).toEqual([]);
    });
  });

  describe('getRacketById', () => {
    it('should fetch racket by id successfully', async () => {
      const result = await racketService.getRacketById(1);

      expect(result).not.toBeNull();
      expect(result!.nombre).toBe('Adidas Metalbone 3.1');
      expect(result!.marca).toBe('Adidas');
    });

    it('should return null when racket is not found', async () => {
      mockConfig.data = [];

      const result = await racketService.getRacketById(999);

      expect(result).toBeNull();
    });

    it('should throw error for other errors', async () => {
      mockConfig.error = new Error('Database error');

      await expect(racketService.getRacketById(1)).rejects.toThrow('Database error');
    });
  });

  describe('getRacketByName', () => {
    it('should find racket by exact name match', async () => {
      const result = await racketService.getRacketByName('Adidas Metalbone 3.1');

      expect(result).not.toBeNull();
      expect(result!.nombre).toBe('Adidas Metalbone 3.1');
    });

    it('should return null when no match found', async () => {
      mockConfig.data = [];

      const result = await racketService.getRacketByName('Non-existent Racket');

      expect(result).toBeNull();
    });

    it('should throw on supabase error', async () => {
      mockConfig.error = new Error('Network error');

      await expect(racketService.getRacketByName('Test Racket')).rejects.toThrow('Network error');
    });
  });

  describe('searchRackets', () => {
    it('should search rackets by query', async () => {
      const result = await racketService.searchRackets('Adidas');

      expect(result.data).toHaveLength(2);
      expect(result.data[0].nombre).toBe('Adidas Metalbone 3.1');
      expect(result.pagination).toBeDefined();
    });

    it('should throw error on search failure', async () => {
      mockConfig.error = new Error('Search failed');

      await expect(racketService.searchRackets('test')).rejects.toThrow('Search failed');
    });
  });

  describe('getRacketsByBrand', () => {
    it('should fetch rackets by brand', async () => {
      const result = await racketService.getRacketsByBrand('Adidas');

      expect(result).toHaveLength(2);
      expect(result[0].marca).toBe('Adidas');
    });
  });

  describe('getBestsellerRackets', () => {
    it('should fetch bestseller rackets', async () => {
      const result = await racketService.getBestsellerRackets();

      expect(result).toHaveLength(2);
      expect(result[0].nombre).toBe('Adidas Metalbone 3.1');
    });
  });

  describe('getRacketsOnSale', () => {
    it('should fetch rackets on sale', async () => {
      const result = await racketService.getRacketsOnSale();

      expect(result).toHaveLength(2);
      expect(result[0].en_oferta).toBe(true);
    });
  });

  describe('getUniqueBrands', () => {
    it('should fetch unique brands', async () => {
      const result = await racketService.getUniqueBrands();

      expect(result).toEqual(['Adidas', 'Bullpadel']);
    });
  });

  describe('getStats', () => {
    it('should fetch racket statistics', async () => {
      mockConfig.count = 1000;

      const result = await racketService.getStats();

      expect(result.total).toBe(1000);
      expect(result.bestsellers).toBe(0);
      expect(result.onSale).toBe(1000);
      expect(result.brands).toBe(2);
    });
  });
});
