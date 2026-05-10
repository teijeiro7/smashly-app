import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response, NextFunction } from 'express';
import type { RequestWithUser } from '../../types';

vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../../config/supabase';
import { requireRacketOwner } from '../../middleware/requireRacketOwner';

function createMockRes(): any {
  const res: any = { statusCode: 200 };
  res.status = vi.fn((code: number) => { res.statusCode = code; return res; });
  res.json = vi.fn((body: any) => { res.body = body; return res; });
  return res;
}

function createMockReq(overrides: Partial<RequestWithUser> = {}): RequestWithUser {
  return { params: { id: '42' }, user: undefined, ...overrides } as unknown as RequestWithUser;
}

const mockSupabaseChain = (data: any, error: any = null) => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
  (supabase.from as any).mockReturnValue(chain);
  return chain;
};

describe('requireRacketOwner', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no user', async () => {
    const req = createMockReq({ user: undefined });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    await requireRacketOwner(req, res as Response, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next immediately for admin users without DB queries', async () => {
    const req = createMockReq({ user: { id: 'admin-1', email: 'a@b.com', role: 'admin' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    await requireRacketOwner(req, res as Response, next);

    expect(supabase.from).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('returns 400 when racket id is not a number', async () => {
    const req = createMockReq({ params: { id: 'abc' }, user: { id: 'u1', email: 'u@b.com', role: 'player' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    await requireRacketOwner(req, res as Response, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 when racket does not exist', async () => {
    const req = createMockReq({ user: { id: 'u1', email: 'u@b.com', role: 'player' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    mockSupabaseChain(null, { message: 'not found' });

    await requireRacketOwner(req, res as Response, next);

    expect(res.statusCode).toBe(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when racket has no store_id', async () => {
    const req = createMockReq({ user: { id: 'u1', email: 'u@b.com', role: 'player' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    mockSupabaseChain({ id: 42, store_id: null });

    await requireRacketOwner(req, res as Response, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user has no store', async () => {
    const req = createMockReq({ user: { id: 'u1', email: 'u@b.com', role: 'player' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    (supabase.from as any).mockImplementation((table: string) => {
      const chain: any = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      if (table === 'rackets') {
        chain.single = vi.fn().mockResolvedValue({ data: { id: 42, store_id: 'store-uuid' }, error: null });
      } else {
        chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'no store' } });
      }
      return chain;
    });

    await requireRacketOwner(req, res as Response, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when store does not own the racket', async () => {
    const req = createMockReq({ user: { id: 'u1', email: 'u@b.com', role: 'player' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    (supabase.from as any).mockImplementation((table: string) => {
      const chain: any = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      if (table === 'rackets') {
        chain.single = vi.fn().mockResolvedValue({ data: { id: 42, store_id: 'store-A' }, error: null });
      } else {
        chain.single = vi.fn().mockResolvedValue({ data: { id: 'store-B' }, error: null });
      }
      return chain;
    });

    await requireRacketOwner(req, res as Response, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when store owns the racket', async () => {
    const req = createMockReq({ user: { id: 'u1', email: 'u@b.com', role: 'player' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    (supabase.from as any).mockImplementation((table: string) => {
      const chain: any = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      if (table === 'rackets') {
        chain.single = vi.fn().mockResolvedValue({ data: { id: 42, store_id: 'store-X' }, error: null });
      } else {
        chain.single = vi.fn().mockResolvedValue({ data: { id: 'store-X' }, error: null });
      }
      return chain;
    });

    await requireRacketOwner(req, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
