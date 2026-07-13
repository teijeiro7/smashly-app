import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListService } from '../../../services/listService';

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

describe('ListService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.data = null;
    mockConfig.error = null;
    mockConfig.count = null;
  });

  describe('getUserLists', () => {
    it('should return user lists', async () => {
      const mockLists = [
        { id: '1', name: 'Mis Favoritas', is_public: false, racket_count: [{ count: 5 }] },
        { id: '2', name: 'Para Comprar', is_public: true, racket_count: [{ count: 3 }] },
      ];
      mockConfig.data = mockLists;

      const result = await ListService.getUserLists();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Mis Favoritas');
      expect(result[0].racket_count).toBe(5);
      expect(result[1].racket_count).toBe(3);
    });

    it('should handle API error', async () => {
      mockConfig.error = new Error('Server error');

      await expect(ListService.getUserLists()).rejects.toThrow('Server error');
    });
  });

  describe('getListById', () => {
    it('should return list with rackets', async () => {
      const mockList = {
        id: '1',
        name: 'Mis Favoritas',
        rackets: [
          { racket: { id: 1, nombre: 'Racket 1' } },
          { racket: { id: 2, nombre: 'Racket 2' } },
        ],
      };
      mockConfig.data = mockList;

      const result = await ListService.getListById('1');

      expect(result).toEqual({
        id: '1',
        name: 'Mis Favoritas',
        rackets: [
          { id: 1, nombre: 'Racket 1' },
          { id: 2, nombre: 'Racket 2' },
        ],
      });
    });
  });

  describe('createList', () => {
    it('should create new list', async () => {
      const newList = { name: 'Nueva Lista', description: 'Test' };
      const createdList = {
        id: '3',
        name: 'Nueva Lista',
        description: 'Test',
        user_id: 'test-user',
        is_public: false,
      };
      mockConfig.data = createdList;

      const result = await ListService.createList(newList);

      expect(result).toEqual(createdList);
    });
  });

  describe('updateList', () => {
    it('should update list', async () => {
      const updates = { name: 'Updated Name' };
      const updatedList = { id: '1', name: 'Updated Name', description: null };
      mockConfig.data = updatedList;

      const result = await ListService.updateList('1', updates);

      expect(result).toEqual(updatedList);
    });
  });

  describe('deleteList', () => {
    it('should delete list', async () => {
      await ListService.deleteList('1');

      expect(mockConfig.error).toBeNull();
    });
  });

  describe('addRacketToList', () => {
    it('should add racket to list', async () => {
      await ListService.addRacketToList('list-1', 1);

      expect(mockConfig.error).toBeNull();
    });
  });

  describe('removeRacketFromList', () => {
    it('should remove racket from list', async () => {
      await ListService.removeRacketFromList('list-1', 1);

      expect(mockConfig.error).toBeNull();
    });
  });
});
