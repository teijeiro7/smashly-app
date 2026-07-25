import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ComparisonService } from '@/services/comparisonService'
import type { SavedComparison } from '@/services/comparisonService'
import type { RacketComparisonData } from '@/types/racket'

const fetchMock = vi.fn()
global.fetch = fetchMock

const mockComparisonResult = {
  executiveSummary: 'Test summary',
  technicalAnalysis: [],
  comparisonTable: '| Test | Table |',
  recommendedProfiles: 'Test profiles',
  biomechanicalConsiderations: 'Test considerations',
  conclusion: 'Test conclusion',
  metrics: [
    { racketName: 'Racket 1', radarData: { potencia: 8, control: 7, salidaDeBola: 6, manejabilidad: 9, puntoDulce: 7 }, isCertified: false },
    { racketName: 'Racket 2', radarData: { potencia: 9, control: 6, salidaDeBola: 5, manejabilidad: 7, puntoDulce: 6 }, isCertified: false },
  ] as RacketComparisonData[],
}

const { mockData, mockFrom } = vi.hoisted(() => {
  const data: any[] = []
  const mf = vi.fn()
  return { mockData: data, mockFrom: mf }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: { access_token: 't', user: { id: 'user-123' } } } })),
    },
  },
}))

function makeChain(initialData: any): any {
  return new Proxy({ _data: initialData }, {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: (v: any) => void) => resolve({
          data: target._data,
          error: null,
          count: Array.isArray(target._data) ? target._data.length : null,
        })
      }
      if (prop === 'catch' || prop === 'finally') return undefined

      return (...args: any[]) => {
        let newData = target._data
        if (prop === 'eq') {
          const [col, val] = args
          const arr = Array.isArray(target._data) ? target._data : (target._data ? [target._data] : [])
          newData = arr.filter((d: any) => d[col] === val)
        } else if (prop === 'single') {
          const arr = Array.isArray(target._data) ? target._data : (target._data ? [target._data] : [])
          const item = arr[0] ?? null
          if (item === null) {
            return { then: (resolve: (v: any) => void) => resolve({ data: null, error: new Error('Not found'), count: null }) }
          }
          return makeChain(item)
        }
        return makeChain(newData)
      }
    },
  })
}

function seed(data: any[]) {
  mockData.length = 0
  mockData.push(...data)
  mockFrom.mockImplementation(() => makeChain(mockData))
}

function makeSaved(id = 'comp-123', overrides = {}): SavedComparison {
  return { id, user_id: 'user-123', racket_ids: [1, 2], comparison_text: JSON.stringify(mockComparisonResult), metrics: mockComparisonResult.metrics, created_at: '2025-01-15T00:00:00.000Z', updated_at: '2025-01-15T00:00:00.000Z', share_token: id, is_public: true, ...overrides } as SavedComparison
}

describe('ComparisonService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    seed([makeSaved()])
  })

  describe('compareRackets (fetch)', () => {
    it('should compare rackets successfully', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ comparison: mockComparisonResult }) })
      const result = await ComparisonService.compareRackets([1, 2])
      expect(result.comparison).toEqual(mockComparisonResult)
      expect(fetchMock).toHaveBeenCalledWith('/api/comparison', expect.objectContaining({ method: 'POST', body: expect.stringContaining('"racketIds":[1,2]') }))
    })

    it('should include user profile', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ comparison: mockComparisonResult }) })
      await ComparisonService.compareRackets([1, 2], { gameLevel: 'Intermedio' })
      const body = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(body.userProfile).toEqual({ gameLevel: 'Intermedio' })
    })

    it('should throw on error', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'Comparison failed' }) })
      await expect(ComparisonService.compareRackets([1, 2])).rejects.toThrow('Comparison failed')
    })
  })

  describe('saveComparison (supabase)', () => {
    it('should save comparison', async () => {
      const result = await ComparisonService.saveComparison([1, 2], mockComparisonResult)
      expect(result).toBeDefined()
      expect(result.id).toBe('comp-123')
    })
  })

  describe('getUserComparisons', () => {
    it('should return comparisons', async () => {
      const result = await ComparisonService.getUserComparisons()
      expect(result).toHaveLength(1)
    })

    it('should return empty when none exist', async () => {
      seed([])
      const result = await ComparisonService.getUserComparisons()
      expect(result).toEqual([])
    })
  })

  describe('getComparisonById', () => {
    it('should get by id', async () => {
      const result = await ComparisonService.getComparisonById('comp-123')
      expect(result.id).toBe('comp-123')
    })
  })

  describe('deleteComparison', () => {
    it('should delete successfully', async () => {
      await expect(ComparisonService.deleteComparison('comp-123')).resolves.not.toThrow()
    })
  })

  describe('getComparisonCount', () => {
    it('should return count', async () => {
      const result = await ComparisonService.getComparisonCount()
      expect(typeof result).toBe('number')
    })
  })

  describe('shareComparison', () => {
    it('should share and return token', async () => {
      const result = await ComparisonService.shareComparison('comp-123')
      expect(typeof result).toBe('string')
    })
  })

  describe('unshareComparison', () => {
    it('should unshare successfully', async () => {
      await expect(ComparisonService.unshareComparison('comp-123')).resolves.not.toThrow()
    })
  })

  describe('getSharedComparison', () => {
    it('should get shared by token', async () => {
      const result = await ComparisonService.getSharedComparison('comp-123')
      expect(result.id).toBe('comp-123')
    })

    it('should throw when not found', async () => {
      seed([])
      await expect(ComparisonService.getSharedComparison('bad-token')).rejects.toThrow()
    })
  })
})
