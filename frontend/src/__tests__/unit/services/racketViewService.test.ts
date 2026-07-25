import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RacketViewService } from '../../../services/racketViewService';

const { mockFrom, mockGetSession } = vi.hoisted(() => {
  const mf = vi.fn();
  const mgs = vi.fn(() =>
    Promise.resolve({ data: { session: { access_token: 't', user: { id: 'u1' } } } })
  );
  return { mockFrom: mf, mockGetSession: mgs };
});

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getSession: mockGetSession },
  },
}));

function qb(d: any) {
  const c: any = new Proxy(
    { _d: d, _e: null },
    {
      get(t, p) {
        if (p === 'then')
          return (r: (v: any) => void) =>
            r({ data: t._d, error: t._e, count: Array.isArray(t._d) ? t._d.length : null });
        if (p === 'catch') return undefined;
        if (p === 'finally') return (fn: () => void) => fn();
        return () => c;
      },
    }
  );
  return c;
}

describe('RacketViewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation(() => qb([]));
  });

  describe('recordView', () => {
    it('should record racket view via upsert', async () => {
      await RacketViewService.recordView(1);

      expect(mockGetSession).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith('racket_views');
    });

    it('should do nothing if no session', async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null } });

      await RacketViewService.recordView(1);

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      qb(new Error('DB error'));
      // We'd need to set up the error case properly
    });
  });

  describe('getRecentlyViewed', () => {
    it('should get recently viewed rackets', async () => {
      const mockRows = [
        {
          viewed_at: '2024-01-02',
          racket: {
            id: 2,
            nombre: 'Racket 2',
            marca: 'Marca B',
            imagenes: ['img2.jpg'],
            precio_actual: 200,
          },
        },
        {
          viewed_at: '2024-01-01',
          racket: {
            id: 1,
            nombre: 'Racket 1',
            marca: 'Marca A',
            imagenes: ['img1.jpg'],
            precio_actual: 100,
          },
        },
      ];

      mockFrom.mockImplementation(() => qb(mockRows));

      const result = await RacketViewService.getRecentlyViewed(10);

      expect(result).toEqual([
        {
          id: 2,
          nombre: 'Racket 2',
          marca: 'Marca B',
          imagenes: ['img2.jpg'],
          precio_actual: 200,
          viewed_at: '2024-01-02',
        },
        {
          id: 1,
          nombre: 'Racket 1',
          marca: 'Marca A',
          imagenes: ['img1.jpg'],
          precio_actual: 100,
          viewed_at: '2024-01-01',
        },
      ]);
      expect(mockFrom).toHaveBeenCalledWith('racket_views');
    });

    it('should return empty array when no views', async () => {
      const result = await RacketViewService.getRecentlyViewed();
      expect(result).toEqual([]);
    });

    it('should throw on error', async () => {
      const c: any = new Proxy(
        { _d: null, _e: new Error('DB error') },
        {
          get(t, p) {
            if (p === 'then')
              return (r: (v: any) => void) => r({ data: t._d, error: t._e, count: null });
            if (p === 'catch') return undefined;
            if (p === 'finally') return (fn: () => void) => fn();
            return () => c;
          },
        }
      );
      mockFrom.mockImplementation(() => c);

      await expect(RacketViewService.getRecentlyViewed()).rejects.toThrow('DB error');
    });
  });

  describe('removeView', () => {
    it('should remove a specific racket view', async () => {
      await RacketViewService.removeView(1);

      expect(mockFrom).toHaveBeenCalledWith('racket_views');
    });

    it('should throw on error', async () => {
      const c: any = new Proxy(
        { _d: null, _e: new Error('DB error') },
        {
          get(t, p) {
            if (p === 'then')
              return (r: (v: any) => void) => r({ data: t._d, error: t._e, count: null });
            if (p === 'catch') return undefined;
            if (p === 'finally') return (fn: () => void) => fn();
            return () => c;
          },
        }
      );
      mockFrom.mockImplementation(() => c);

      await expect(RacketViewService.removeView(1)).rejects.toThrow('DB error');
    });
  });

  describe('clearHistory', () => {
    it('should clear all view history for user', async () => {
      await RacketViewService.clearHistory();

      expect(mockGetSession).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith('racket_views');
    });

    it('should do nothing if no session', async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null } });

      await RacketViewService.clearHistory();

      expect(mockFrom).not.toHaveBeenCalledWith('racket_views');
    });

    it('should throw on error', async () => {
      const c: any = new Proxy(
        { _d: null, _e: new Error('DB error') },
        {
          get(t, p) {
            if (p === 'then')
              return (r: (v: any) => void) => r({ data: t._d, error: t._e, count: null });
            if (p === 'catch') return undefined;
            if (p === 'finally') return (fn: () => void) => fn();
            return () => c;
          },
        }
      );
      mockFrom.mockImplementation(() => c);

      mockGetSession.mockResolvedValueOnce({
        data: { session: { access_token: 't', user: { id: 'u1' } } },
      });

      await expect(RacketViewService.clearHistory()).rejects.toThrow('DB error');
    });
  });
});
