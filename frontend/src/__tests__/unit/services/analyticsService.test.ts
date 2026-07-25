import { describe, it, expect, vi, beforeEach } from 'vitest';

global.fetch = vi.fn();

import analyticsService from '../../../services/analyticsService';

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track a view event', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await analyticsService.trackEvent('store-1', 'view');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/analytics/store'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ store_id: 'store-1', event: 'view' }),
        })
      );
    });

    it('should track a click event', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await analyticsService.trackEvent('store-1', 'click');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: JSON.stringify({ store_id: 'store-1', event: 'click' }),
        })
      );
    });

    it('should silently fail on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(analyticsService.trackEvent('store-1', 'view')).resolves.not.toThrow();
    });

    it('should silently fail on server error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(analyticsService.trackEvent('store-1', 'view')).resolves.not.toThrow();
    });
  });
});
