import { vi } from 'vitest';

type MockResponse = { data: any; error: any; count?: any };

function mockSelectReturn(resp: MockResponse) {
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

export function mockSupabase(resp: MockResponse) {
  return {
    from: vi.fn(() => mockSelectReturn(resp)),
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
  };
}
