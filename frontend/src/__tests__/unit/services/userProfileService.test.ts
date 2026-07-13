import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UserProfileService } from '../../../services/userProfileService';

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

      const result = await UserProfileService.createUserProfile('TestUser', 'Test User', 'Racket Pro');

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

      await expect(
        UserProfileService.createUserProfile('TakenUser')
      ).rejects.toThrow("El nickname 'TakenUser' ya no está disponible");
    });

    it('should handle generic error', async () => {
      (global.fetch as any).mockResolvedValueOnce(mockErrorResponse(500, 'Server error'));

      await expect(UserProfileService.createUserProfile('TestUser')).rejects.toThrow('Server error');
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

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      const updatedProfile = {
        id: 'user-1',
        nickname: 'UpdatedUser',
        full_name: 'Updated Name',
        role: 'Player',
      };

      (global.fetch as any).mockResolvedValueOnce(mockApiResponse(updatedProfile));

      const result = await UserProfileService.updateUserProfile({
        nickname: 'UpdatedUser',
        full_name: 'Updated Name',
      });

      expect(result).toEqual(updatedProfile);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/profile'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ nickname: 'UpdatedUser', full_name: 'Updated Name' }),
        })
      );
    });

    it('should handle error', async () => {
      (global.fetch as any).mockResolvedValueOnce(mockErrorResponse(400, 'Invalid data'));

      await expect(
        UserProfileService.updateUserProfile({ nickname: 'Bad' })
      ).rejects.toThrow('Invalid data');
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
