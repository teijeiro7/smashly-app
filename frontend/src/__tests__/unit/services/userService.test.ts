import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../../services/userService';

// Mock fetch
global.fetch = vi.fn();

// getAuthHeaders() (frontend/src/config/api.ts) reads the real Supabase
// session, not localStorage — mock the client it calls.
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: { access_token: 'test-token' } } })
      ),
    },
  },
}));

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should fetch user profile', async () => {
      const mockProfile = {
        id: 'user-1',
        email: 'test@test.com',
        nickname: 'testuser',
        full_name: 'Test User',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockProfile }),
      });

      const result = await UserService.getUserProfile();

      expect(result).toEqual(mockProfile);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/profile'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      });

      const result = await UserService.getUserProfile();
      expect(result).toBeNull();
    });
  });

  describe('createUserProfile', () => {
    it('should create user profile', async () => {
      const profileData = {
        nickname: 'newuser',
        full_name: 'New User',
        nivel_juego: 'Intermedio',
      };

      const createdProfile = { id: 'user-2', ...profileData };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: createdProfile }),
      });

      const result = await UserService.createUserProfile(profileData);

      expect(result).toEqual(createdProfile);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/profile'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(profileData),
        })
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      const updates = { full_name: 'Updated Name' };
      const updatedProfile = { id: 'user-1', ...updates };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updatedProfile }),
      });

      const result = await UserService.updateUserProfile(updates);

      expect(result).toEqual(updatedProfile);
    });
  });
});
