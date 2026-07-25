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

import messagingService from '../../../services/messagingService';

global.fetch = vi.fn();

describe('messagingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listConversations', () => {
    it('should list conversations', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          buyer_id: 'buyer-1',
          store_id: 'store-1',
          last_message_at: '2025-01-15T00:00:00.000Z',
          created_at: '2025-01-10T00:00:00.000Z',
          store: { store_name: 'Store 1', slug: 'store-1' },
          buyer: { nickname: 'Player1' },
          last_message: { content: 'Hi!', created_at: '2025-01-15T00:00:00.000Z', sender_id: 'buyer-1' },
          unread_count: 2,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockConversations }),
      });

      const result = await messagingService.listConversations();

      expect(result).toEqual(mockConversations);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/messaging/conversations'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
        })
      );
    });

    it('should handle error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(messagingService.listConversations()).rejects.toThrow(
        'Error al cargar conversaciones'
      );
    });
  });

  describe('createConversation', () => {
    it('should create a conversation', async () => {
      const mockMessage = {
        id: 'msg-1',
        conversation_id: 'conv-1',
        sender_id: 'user-1',
        content: 'Hello!',
        read: false,
        created_at: '2025-01-15T00:00:00.000Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMessage,
      });

      const result = await messagingService.createConversation('store-1', 'Hello!');

      expect(result).toEqual(mockMessage);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/messaging/conversations'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ store_id: 'store-1', content: 'Hello!' }),
        })
      );
    });

    it('should handle error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Store not found' }),
      });

      await expect(
        messagingService.createConversation('store-1', 'Hello!')
      ).rejects.toThrow('Store not found');
    });
  });

  describe('getMessages', () => {
    it('should get messages for a conversation', async () => {
      const mockResponse = {
        data: [
          {
            id: 'msg-1',
            conversation_id: 'conv-1',
            sender_id: 'user-1',
            content: 'Hello!',
            read: true,
            created_at: '2025-01-15T00:00:00.000Z',
          },
        ],
        total: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await messagingService.getMessages('conv-1', 1);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('conversation_id=conv-1'),
        expect.any(Object)
      );
    });

    it('should handle error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(messagingService.getMessages('conv-1')).rejects.toThrow(
        'Error al cargar mensajes'
      );
    });
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const mockMessage = {
        id: 'msg-2',
        conversation_id: 'conv-1',
        sender_id: 'user-1',
        content: 'How much?',
        read: false,
        created_at: '2025-01-15T00:00:00.000Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMessage,
      });

      const result = await messagingService.sendMessage('conv-1', 'How much?');

      expect(result).toEqual(mockMessage);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/messaging/messages'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ conversation_id: 'conv-1', content: 'How much?' }),
        })
      );
    });

    it('should handle error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot send message' }),
      });

      await expect(messagingService.sendMessage('conv-1', 'Hi')).rejects.toThrow(
        'Cannot send message'
      );
    });
  });

  describe('markRead', () => {
    it('should mark conversation as read', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await messagingService.markRead('conv-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/messaging/messages'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ conversation_id: 'conv-1' }),
        })
      );
    });
  });
});
