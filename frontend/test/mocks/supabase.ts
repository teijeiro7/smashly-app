import { vi } from 'vitest'

function createQueryBuilder(data: any = []) {
  const chain: any = new Proxy(
    { _data: data, _error: null },
    {
      get(target, prop) {
        if (prop === 'then') {
          return (resolve: (v: any) => void) =>
            resolve({ data: target._data, error: target._error, count: null })
        }
        if (prop === 'catch') {
          return undefined
        }
        if (prop === 'finally') {
          return (fn: () => void) => fn()
        }
        return () => chain
      },
    }
  )
  return chain
}

export function createMockSupabase() {
  const mockData: any[] = []
  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => createQueryBuilder(mockData)),
          limit: vi.fn(() => createQueryBuilder(mockData)),
          single: vi.fn(() => createQueryBuilder(mockData[0] ?? null)),
          maybeSingle: vi.fn(() =>
            createQueryBuilder(mockData[0] ?? null)
          ),
          in: vi.fn(() => createQueryBuilder(mockData)),
          ilike: vi.fn(() => ({
            maybeSingle: vi.fn(() => createQueryBuilder(mockData[0] ?? null)),
          })),
        })),
        range: vi.fn(() => createQueryBuilder(mockData)),
        maybeSingle: vi.fn(() => createQueryBuilder(mockData[0] ?? null)),
        single: vi.fn(() => createQueryBuilder(mockData[0] ?? null)),
        in: vi.fn(() => createQueryBuilder(mockData)),
        ilike: vi.fn(() => ({
          maybeSingle: vi.fn(() => createQueryBuilder(mockData[0] ?? null)),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => createQueryBuilder(mockData[0] ?? null)),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => createQueryBuilder(mockData[0] ?? null)),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => createQueryBuilder(null)),
      })),
      order: vi.fn(() => ({
        range: vi.fn(() => createQueryBuilder(mockData)),
        limit: vi.fn(() => createQueryBuilder(mockData)),
        maybeSingle: vi.fn(() => createQueryBuilder(mockData[0] ?? null)),
        in: vi.fn(() => createQueryBuilder(mockData)),
      })),
    })),
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({
          data: {
            session: {
              access_token: 'mock-token',
              user: { id: 'mock-user-id' },
            },
          },
        })
      ),
    },
  }))

  return {
    supabase: mockFrom as any,
    mockFrom,
    mockData,
    setMockData: (data: any[]) => {
      mockData.splice(0, mockData.length, ...data)
      mockFrom.mockClear()
      return mockFrom
    },
  }
}
