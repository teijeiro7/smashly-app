import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListService } from '@/services/listService';
import { supabase } from '@/lib/supabase';

const mockDbLists = [
  {
    id: 'list-1',
    user_id: 'user-1',
    name: 'Mis Favoritas',
    description: 'Favs description',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    is_public: false,
    racket_count: [{ count: 5 }],
  },
  {
    id: 'list-2',
    user_id: 'user-1',
    name: 'Para Comprar',
    description: null,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    is_public: true,
    racket_count: [{ count: 3 }],
  },
];

const mockDbListWithRackets = [
  {
    id: 'list-1',
    user_id: 'user-1',
    name: 'Mis Favoritas',
    description: 'Favs description',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    is_public: false,
    rackets: [
      { racket: { id: 1, nombre: 'Racket 1', marca: 'Adidas' } },
      { racket: { id: 2, nombre: 'Racket 2', marca: 'Bullpadel' } },
    ],
  },
];

const { mockData, mockFrom } = vi.hoisted(() => {
  const data: any[] = [];
  const mf = vi.fn();
  return { mockData: data, mockFrom: mf };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: { access_token: 't', user: { id: 'u1' } } } })
      ),
    },
  },
}));

function qb(d: any, e: any = null) {
  const c: any = new Proxy(
    { _d: d, _e: e },
    {
      get(t, p) {
        if (p === 'then')
          return (r: (v: any) => void) =>
            r({ data: t._d, error: t._e, count: Array.isArray(t._d) ? t._d.length : null });
        if (p === 'catch' || p === 'finally') return undefined;
        return () => c;
      },
    }
  );
  return c;
}

function makeChain(data: any[]) {
  const chain: any = {};
  chain.select = vi.fn(() => {
    const q: any = {};
    q.eq = vi.fn((_col: string, val: any) => {
      const filtered = data.filter((d: any) => d.id === val);
      return {
        order: vi.fn(() => qb(filtered)),
        single: vi.fn(() => qb(filtered[0] ?? null)),
        maybeSingle: vi.fn(() => qb(filtered[0] ?? null)),
      };
    });
    q.order = vi.fn(() => qb(data));
    q.single = vi.fn(() => qb(data[0] ?? null));
    q.maybeSingle = vi.fn(() => qb(data[0] ?? null));
    return q;
  });
  chain.insert = vi.fn(() => {
    const i: any = {};
    i.select = vi.fn(() => ({ single: vi.fn(() => qb(data[0] ?? null)) }));
    i.then = (resolve: any) => resolve({ data: null, error: null });
    return i;
  });
  chain.update = vi.fn(() => ({
    eq: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => qb(data[0] ?? null)),
      })),
    })),
  }));
  chain.delete = vi.fn(() => ({
    eq: vi.fn((_col: string, _val: any) => qb(null)),
  }));
  return chain;
}

function seed(data: any[]) {
  mockData.length = 0;
  mockData.push(...data);
  mockFrom.mockImplementation(() => makeChain(mockData));
}

describe('ListService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seed(mockDbLists);
  });

  describe('getUserLists', () => {
    it('should return mapped lists with racket_count', async () => {
      const result = await ListService.getUserLists();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Mis Favoritas');
      expect(result[0].racket_count).toBe(5);
      expect(result[1].racket_count).toBe(3);
    });

    it('should throw on error', async () => {
      mockFrom.mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => qb(null, new Error('DB error'))),
        })),
      }));
      await expect(ListService.getUserLists()).rejects.toThrow('DB error');
    });
  });

  describe('getListById', () => {
    it('should return list with rackets mapped', async () => {
      seed(mockDbListWithRackets);
      const result = await ListService.getListById('list-1');
      expect(result.name).toBe('Mis Favoritas');
      expect(result.rackets).toHaveLength(2);
      expect(result.rackets![0].nombre).toBe('Racket 1');
    });

    it('should throw on error', async () => {
      mockFrom.mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => qb(null, new Error('Not found'))),
          })),
        })),
      }));
      await expect(ListService.getListById('bad-id')).rejects.toThrow('Not found');
    });
  });

  describe('createList', () => {
    it('should throw if no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: null } });
      await expect(ListService.createList({ name: 'Test' })).rejects.toThrow(
        'No hay sesión activa'
      );
    });

    it('should create and return list', async () => {
      const newListData = {
        id: 'new-1',
        user_id: 'u1',
        name: 'Nueva Lista',
        description: null,
        created_at: '2025-03-01T00:00:00Z',
        updated_at: '2025-03-01T00:00:00Z',
        is_public: false,
      };
      seed([newListData]);
      const result = await ListService.createList({ name: 'Nueva Lista' });
      expect(result.name).toBe('Nueva Lista');
      expect(result.id).toBe('new-1');
    });

    it('should throw on insert error', async () => {
      mockFrom.mockImplementationOnce(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => qb(null, new Error('Insert failed'))),
          })),
        })),
      }));
      await expect(ListService.createList({ name: 'Test' })).rejects.toThrow('Insert failed');
    });
  });

  describe('updateList', () => {
    it('should update and return list', async () => {
      const updated = { ...mockDbLists[0], name: 'Updated Name' };
      seed([updated]);
      const result = await ListService.updateList('list-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });

    it('should throw on error', async () => {
      mockFrom.mockImplementationOnce(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => qb(null, new Error('Update failed'))),
            })),
          })),
        })),
      }));
      await expect(ListService.updateList('bad-id', { name: 'Test' })).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('deleteList', () => {
    it('should delete successfully', async () => {
      await expect(ListService.deleteList('list-1')).resolves.not.toThrow();
    });

    it('should throw on error', async () => {
      mockFrom.mockImplementationOnce(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() => qb(null, new Error('Delete failed'))),
        })),
      }));
      await expect(ListService.deleteList('bad-id')).rejects.toThrow('Delete failed');
    });
  });

  describe('addRacketToList', () => {
    it('should add racket successfully', async () => {
      await expect(ListService.addRacketToList('list-1', 1)).resolves.not.toThrow();
    });

    it('should ignore duplicate error', async () => {
      mockFrom.mockImplementationOnce(() => ({
        insert: vi.fn(() => ({
          then: (resolve: any) =>
            resolve({ data: null, error: { code: '23505', message: 'duplicate' } }),
        })),
      }));
      await expect(ListService.addRacketToList('list-1', 1)).resolves.not.toThrow();
    });

    it('should throw on other error', async () => {
      mockFrom.mockImplementationOnce(() => ({
        insert: vi.fn(() => ({
          then: (resolve: any) =>
            resolve({ data: null, error: { code: '23506', message: 'FK violation' } }),
        })),
      }));
      await expect(ListService.addRacketToList('list-1', 1)).rejects.toThrow('FK violation');
    });
  });

  describe('removeRacketFromList', () => {
    it('should remove racket successfully', async () => {
      await expect(ListService.removeRacketFromList('list-1', 1)).resolves.not.toThrow();
    });

    it('should throw on error', async () => {
      mockFrom.mockImplementationOnce(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() => qb(null, new Error('Delete failed'))),
        })),
      }));
      await expect(ListService.removeRacketFromList('list-1', 1)).rejects.toThrow('Delete failed');
    });
  });
});
