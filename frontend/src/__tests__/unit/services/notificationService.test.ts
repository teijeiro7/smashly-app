import { describe, it, expect, vi, beforeEach } from 'vitest';

const { chain, mockConfig, supabase } = vi.hoisted(() => {
  const mockConfig: any = { data: null, error: null, count: null };

  const chain: any = {};
  chain.data = null;
  chain.error = null;
  chain.count = null;
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
    data: Array.isArray(mockConfig.data) ? (mockConfig.data.length > 0 ? mockConfig.data[0] : null) : mockConfig.data,
    error: mockConfig.error,
  }));
  chain.maybeSingle = vi.fn(async () => ({
    data: Array.isArray(mockConfig.data) ? (mockConfig.data.length > 0 ? mockConfig.data[0] : null) : mockConfig.data,
    error: mockConfig.error,
  }));
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => ({ ...chain, select: vi.fn(() => ({ ...chain, single: vi.fn(async () => mockConfig) })) }));
  chain.update = vi.fn(() => ({ ...chain, select: vi.fn(() => ({ ...chain, single: vi.fn(async () => mockConfig) })) }));
  chain.delete = vi.fn(() => chain);
  chain.upsert = vi.fn(() => ({ ...chain, select: vi.fn(() => ({ ...chain, single: vi.fn(async () => mockConfig) })) }));
  chain.then = async (resolve: any) => resolve(mockConfig);

  return {
    chain,
    mockConfig,
    supabase: {
      from: vi.fn(() => chain),
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

import { NotificationService } from '../../../services/notificationService';
import type { Notification } from '../../../types/notification';

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chain.data = null;
    chain.error = null;
    chain.count = null;
    mockConfig.data = null;
    mockConfig.error = null;
    mockConfig.count = null;
  });

  describe('fetchNotifications', () => {
    it('should fetch notifications', async () => {
      const mockNotifications: Notification[] = [
        {
          id: 'notif-1',
          user_id: 'user-1',
          type: 'price_drop',
          title: 'Price Drop',
          message: 'A racket dropped in price',
          data: {},
          is_read: false,
          created_at: '2025-01-15T00:00:00.000Z',
        },
      ];
      chain.data = mockNotifications;
      mockConfig.data = mockNotifications;

      const result = await NotificationService.fetchNotifications();

      expect(result).toEqual(mockNotifications);
      expect(supabase.from).toHaveBeenCalledWith('notifications');
    });

    it('should filter by unread only', async () => {
      chain.data = [];
      mockConfig.data = [];

      await NotificationService.fetchNotifications({ unreadOnly: true });

      expect(chain.eq).toHaveBeenCalledWith('is_read', false);
    });

    it('should apply limit and offset', async () => {
      chain.data = [];
      mockConfig.data = [];

      await NotificationService.fetchNotifications({ limit: 10, offset: 20 });

      expect(chain.limit).toHaveBeenCalledWith(10);
      expect(chain.range).toHaveBeenCalledWith(20, 29);
    });

    it('should handle error', async () => {
      chain.error = new Error('Database error');
      mockConfig.error = new Error('Database error');

      await expect(NotificationService.fetchNotifications()).rejects.toThrow('Database error');
    });

    it('should return empty array when no notifications', async () => {
      chain.data = null;
      mockConfig.data = null;

      const result = await NotificationService.fetchNotifications();

      expect(result).toEqual([]);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      chain.count = 5;
      mockConfig.count = 5;

      const result = await NotificationService.getUnreadCount();

      expect(result).toBe(5);
    });

    it('should return 0 when count is null', async () => {
      chain.count = null;
      mockConfig.count = null;

      const result = await NotificationService.getUnreadCount();

      expect(result).toBe(0);
    });

    it('should handle error', async () => {
      chain.error = new Error('Count failed');
      mockConfig.error = new Error('Count failed');

      await expect(NotificationService.getUnreadCount()).rejects.toThrow('Count failed');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const result = await NotificationService.markAsRead('notif-1');

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(chain.update).toHaveBeenCalledWith({ is_read: true });
      expect(chain.eq).toHaveBeenCalledWith('id', 'notif-1');
    });

    it('should handle error', async () => {
      chain.error = new Error('Update failed');
      mockConfig.error = new Error('Update failed');

      await expect(NotificationService.markAsRead('notif-1')).rejects.toThrow('Update failed');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all as read and return count', async () => {
      chain.data = [{ id: 'notif-1' }, { id: 'notif-2' }];
      mockConfig.data = [{ id: 'notif-1' }, { id: 'notif-2' }];

      const result = await NotificationService.markAllAsRead();

      expect(result).toBe(2);
    });

    it('should return 0 when no notifications to mark', async () => {
      chain.data = [];
      mockConfig.data = [];

      const result = await NotificationService.markAllAsRead();

      expect(result).toBe(0);
    });

    it('should handle error', async () => {
      chain.error = new Error('Update all failed');
      mockConfig.error = new Error('Update all failed');

      await expect(NotificationService.markAllAsRead()).rejects.toThrow('Update all failed');
    });
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const mockNotification: Notification = {
        id: 'notif-new',
        user_id: 'test-user',
        type: 'review',
        title: 'New Review',
        message: 'Someone reviewed your racket',
        data: { racket_id: 1 },
        is_read: false,
        created_at: '2025-01-15T00:00:00.000Z',
      };
      chain.data = mockNotification;
      mockConfig.data = mockNotification;

      const result = await NotificationService.createNotification(
        'review',
        'New Review',
        'Someone reviewed your racket',
        { racket_id: 1 }
      );

      expect(result).toEqual(mockNotification);
    });

    it('should return null when no session', async () => {
      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const result = await NotificationService.createNotification('review', 'Title', 'Message');

      expect(result).toBeNull();
    });

    it('should handle error', async () => {
      chain.error = new Error('Insert failed');
      mockConfig.error = new Error('Insert failed');

      await expect(
        NotificationService.createNotification('review', 'Title', 'Message')
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const result = await NotificationService.deleteNotification('notif-1');

      expect(result).toBe(true);
      expect(supabase.from().delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'notif-1');
    });

    it('should handle error', async () => {
      chain.error = new Error('Delete failed');
      mockConfig.error = new Error('Delete failed');

      await expect(NotificationService.deleteNotification('notif-1')).rejects.toThrow('Delete failed');
    });
  });
});
