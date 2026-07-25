import { describe, it, expect, vi, beforeEach } from 'vitest';

import { supabase } from '../../../lib/supabase';
import { UserProfileService } from '../../../services/userProfileService';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({
          data: { session: { access_token: 't', user: { id: 'user-1' } } },
        })
      ),
    },
  },
}));

/** Minimal update().eq().select().single() chain for user_profiles */
const mockUpdateChain = (data: any, error: any = null) => ({
  update: vi.fn(() => ({
    eq: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({ data, error })),
      })),
    })),
  })),
});

global.fetch = vi.fn();

const mockApiResponse = (data: any) => ({
  ok: true,
  json: async () => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }),
});

const mockErrorResponse = (status: number, message: string) => ({
  ok: false,
  status,
  json: async () => ({ success: false, message }),
});

describe('UserProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // clearAllMocks keeps queued mock*Once values, which would leak from a
    // test that never consumes them into the next one.
    (global.fetch as any).mockReset();
  });

  describe('createUserProfile', () => {
    it('should create a user profile', async () => {
      const mockProfile = {
        id: 'user-1',
        email: 'test@test.com',
        nickname: 'TestUser',
        role: 'Player',
      };

      (global.fetch as any).mockResolvedValueOnce(mockApiResponse(mockProfile));

      const result = await UserProfileService.createUserProfile(
        'TestUser',
        'Test User',
        'Racket Pro'
      );

      expect(result).toEqual(mockProfile);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/profile'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname: 'TestUser',
            full_name: 'Test User',
            current_racket: 'Racket Pro',
          }),
        })
      );
    });

    it('should handle nickname conflict', async () => {
      (global.fetch as any).mockResolvedValueOnce(mockErrorResponse(400, 'nickname already taken'));

      await expect(UserProfileService.createUserProfile('TakenUser')).rejects.toThrow(
        "El nickname 'TakenUser' ya no está disponible"
      );
    });

    it('should handle generic error', async () => {
      (global.fetch as any).mockResolvedValueOnce(mockErrorResponse(500, 'Server error'));

      await expect(UserProfileService.createUserProfile('TestUser')).rejects.toThrow(
        'Server error'
      );
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile', async () => {
      const mockProfile = {
        id: 'user-1',
        email: 'test@test.com',
        nickname: 'TestUser',
        role: 'Player',
        created_at: '2025-01-01T00:00:00.000Z',
      };

      (global.fetch as any).mockResolvedValueOnce(mockApiResponse(mockProfile));

      const result = await UserProfileService.getUserProfile();

      expect(result).toEqual(mockProfile);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/profile'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return null when profile not found (404)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ success: false, message: 'Error: 404 Not Found' }),
      });

      const result = await UserProfileService.getUserProfile();

      expect(result).toBeNull();
    });
  });

  // updateUserProfile writes straight to Supabase (user_profiles) — the
  // /api/v1/users/profile PUT route no longer exists.
  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      const updatedProfile = {
        id: 'user-1',
        nickname: 'UpdatedUser',
        full_name: 'Updated Name',
        role: 'Player',
      };
      const chain = mockUpdateChain(updatedProfile);
      mockFrom.mockReturnValueOnce(chain);

      const result = await UserProfileService.updateUserProfile({
        nickname: 'UpdatedUser',
        full_name: 'Updated Name',
      });

      expect(result).toEqual(updatedProfile);
      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(chain.update).toHaveBeenCalledWith({
        nickname: 'UpdatedUser',
        full_name: 'Updated Name',
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle error', async () => {
      mockFrom.mockReturnValueOnce(mockUpdateChain(null, new Error('Invalid data')));

      await expect(UserProfileService.updateUserProfile({ nickname: 'Bad' })).rejects.toThrow(
        'Invalid data'
      );
    });

    it('should reject when there is no active session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: null } } as any);

      await expect(UserProfileService.updateUserProfile({ nickname: 'Bad' })).rejects.toThrow(
        'No hay sesión activa'
      );
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('isNicknameAvailable', () => {
    it('should return true (not implemented)', async () => {
      const result = await UserProfileService.isNicknameAvailable();

      expect(result).toBe(true);
    });
  });

  describe('deleteUserProfile', () => {
    it('should delete user profile', async () => {
      (global.fetch as any).mockResolvedValueOnce(mockApiResponse(null));

      await expect(UserProfileService.deleteUserProfile()).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/profile'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle error', async () => {
      (global.fetch as any).mockResolvedValueOnce(mockErrorResponse(500, 'Delete failed'));

      await expect(UserProfileService.deleteUserProfile()).rejects.toThrow('Delete failed');
    });
  });
});
