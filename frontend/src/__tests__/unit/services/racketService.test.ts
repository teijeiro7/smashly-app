import { describe, it, expect, vi } from 'vitest'
import { RacketService } from '@/services/racketService'

const mockDbData = [
  { id: 1, name: 'Adidas Metalbone 3.1', brand: 'Adidas', model: 'Metalbone 3.1', on_offer: true, comparison_only: false, padelnuestro_actual_price: 250, padelnuestro_original_price: 280, padelnuestro_discount_percentage: 11, padelnuestro_link: 'https://padelmarket.com/pala1', created_at: '2025-01-01', view_count: 100 },
  { id: 2, name: 'Bullpadel Vertex 04', brand: 'Bullpadel', model: 'Vertex 04', on_offer: true, comparison_only: false, padelmarket_actual_price: 180, padelmarket_original_price: 200, padelmarket_discount_percentage: 10, padelmarket_link: 'https://padelnuestro.com/pala2', created_at: '2025-01-02', view_count: 50 },
]

const { mockData, mockFrom } = vi.hoisted(() => {
  const data: any[] = []
  const mf = vi.fn()
  return {
    mockData: data,
    mockFrom: mf,
  }
})

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: { access_token: 't', user: { id: 'u1' } } } })),
    },
  },
}))

function qb(d: any) {
  const c: any = new Proxy({ _d: d, _e: null }, {
    get(t, p) {
      if (p === 'then') return (r: (v: any) => void) => r({ data: t._d, error: t._e, count: Array.isArray(t._d) ? t._d.length : null })
      if (p === 'catch' || p === 'finally') return undefined
      return () => c
    },
  })
  return c
}

function makeChain(data: any[]) {
  const chain: any = {}
  chain.select = vi.fn((...args: any[]) => {
    const opts = args[1]
    const count = opts?.count === 'exact' ? data.length : undefined
    const q: any = {}
    q.then = (r: (v: any) => void) => r({ data, error: null, count: count ?? (Array.isArray(data) ? data.length : null) })
    q.order = vi.fn(() => q)
    q.eq = vi.fn(() => q)
    q.range = vi.fn(() => q)
    q.limit = vi.fn(() => q)
    q.maybeSingle = vi.fn(() => qb(data[0] ?? null))
    q.single = vi.fn(() => qb(data[0] ?? null))
    q.in = vi.fn(() => q)
    q.ilike = vi.fn(() => q)
    q.or = vi.fn(() => q)
    return q
  })
  chain.update = vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => qb(data[0] ?? null)) })) })) }))
  chain.delete = vi.fn(() => ({ eq: vi.fn(() => qb(null)) }))
  return chain
}

function seed(data: any[]) {
  mockData.length = 0
  mockData.push(...data)
  mockFrom.mockImplementation(() => makeChain(mockData))
}

describe('RacketService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    seed(mockDbData)
  })

  it('getAllRackets returns mapped rackets', async () => {
    const r = await RacketService.getAllRackets()
    expect(r).toHaveLength(2)
    expect(r[0].nombre).toBe('Adidas Metalbone 3.1')
  })

  it('getRacketById returns single racket', async () => {
    const r = await RacketService.getRacketById(1)
    expect(r).not.toBeNull()
    expect(r!.nombre).toBe('Adidas Metalbone 3.1')
  })

  it('getRacketById returns null for missing', async () => {
    seed([])
    const r = await RacketService.getRacketById(999)
    expect(r).toBeNull()
  })

  it('getRacketsWithPagination works', async () => {
    const r = await RacketService.getRacketsWithPagination(0, 1)
    expect(r).toHaveLength(2)
  })

  it('getRacketsByBrand filters by brand', async () => {
    const r = await RacketService.getRacketsByBrand('Adidas')
    expect(r).toHaveLength(2)
  })

  it('getBestsellerRackets returns top rackets', async () => {
    const r = await RacketService.getBestsellerRackets()
    expect(r).toHaveLength(2)
  })

  it('getRacketsOnSale returns sale rackets', async () => {
    const r = await RacketService.getRacketsOnSale()
    expect(r).toHaveLength(2)
  })

  it('getUniqueBrands returns brand list', async () => {
    const r = await RacketService.getUniqueBrands()
    expect(r).toContain('Adidas')
  })

  it('getStats returns stats', async () => {
    const r = await RacketService.getStats()
    expect(r.total).toBeGreaterThan(0)
  })
})
