import { describe, it, expect, vi, beforeEach } from 'vitest';

const { supabase } = vi.hoisted(() => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      }),
    },
  },
}));

vi.mock('../../../lib/supabase', () => ({ supabase }));

import catalogService from '../../../services/catalogService';

global.fetch = vi.fn();

describe('catalogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should list catalog items', async () => {
      const mockResponse = {
        data: [
          {
            id: 'price-1',
            racket_id: 1,
            store_id: 'store-1',
            price: 199.99,
            currency: 'EUR',
            in_stock: true,
            is_auto_match: false,
          },
        ],
        total: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await catalogService.list('store-1', 1, 50);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/stores/catalog/store-1?page=1&limit=50'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
        })
      );
    });

    it('should handle error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Catalog not found' }),
      });

      await expect(catalogService.list('store-1')).rejects.toThrow('Catalog not found');
    });
  });

  describe('add', () => {
    it('should add an item to catalog', async () => {
      const mockItem = {
        id: 'price-1',
        racket_id: 1,
        store_id: 'store-1',
        price: 199.99,
        in_stock: true,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockItem,
      });

      const result = await catalogService.add('store-1', { racket_id: 1, price: 199.99 });

      expect(result).toEqual(mockItem);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/stores/catalog/store-1'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ racket_id: 1, price: 199.99 }),
        })
      );
    });

    it('should handle error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Racket already in catalog' }),
      });

      await expect(catalogService.add('store-1', { racket_id: 1 })).rejects.toThrow(
        'Racket already in catalog'
      );
    });
  });

  describe('update', () => {
    it('should update a catalog item', async () => {
      const mockUpdated = {
        id: 'price-1',
        racket_id: 1,
        store_id: 'store-1',
        price: 149.99,
        in_stock: false,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdated,
      });

      const result = await catalogService.update('store-1', 'price-1', {
        price: 149.99,
        in_stock: false,
      });

      expect(result).toEqual(mockUpdated);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/stores/catalog/store-1/price-1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ price: 149.99, in_stock: false }),
        })
      );
    });

    it('should handle error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Item not found' }),
      });

      await expect(catalogService.update('store-1', 'price-1', { price: 100 })).rejects.toThrow(
        'Item not found'
      );
    });
  });

  describe('remove', () => {
    it('should remove a catalog item', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await catalogService.remove('store-1', 'price-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/stores/catalog/store-1/price-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot delete' }),
      });

      await expect(catalogService.remove('store-1', 'price-1')).rejects.toThrow('Cannot delete');
    });
  });

  describe('search', () => {
    it('should search catalog', async () => {
      const mockResponse = {
        data: [
          { id: 1, name: 'Test Racket', brand: 'Test', model: 'Pro', images: [], _score: 0.9 },
        ],
        total: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await catalogService.search('store-1', 'test', 1, 20);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/stores/catalog/store-1/search'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ query: 'test', page: 1, limit: 20 }),
        })
      );
    });

    it('should handle error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Search failed' }),
      });

      await expect(catalogService.search('store-1', 'test')).rejects.toThrow('Search failed');
    });
  });
});
