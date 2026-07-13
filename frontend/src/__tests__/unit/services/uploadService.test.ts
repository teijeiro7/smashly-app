import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UploadService } from '../../../services/uploadService';

global.fetch = vi.fn();

function createMockFile(overrides: Partial<File> = {}): File {
  return {
    type: 'image/jpeg',
    size: 1024 * 1024,
    name: 'test.jpg',
    ...overrides,
  } as File;
}

describe('UploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadAvatar', () => {
    it('should upload an avatar successfully', async () => {
      const mockFile = createMockFile();
      const mockAvatarUrl = 'https://example.com/avatars/user-1.jpg';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { avatar_url: mockAvatarUrl, file_path: 'avatars/user-1.jpg' },
        }),
      });

      const result = await UploadService.uploadAvatar(mockFile);

      expect(result).toBe(mockAvatarUrl);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/upload/avatar'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should reject invalid file type', async () => {
      const mockFile = createMockFile({ type: 'image/gif' });

      await expect(UploadService.uploadAvatar(mockFile)).rejects.toThrow(
        'Tipo de archivo no válido'
      );
    });

    it('should reject file too large', async () => {
      const mockFile = createMockFile({ size: 10 * 1024 * 1024 });

      await expect(UploadService.uploadAvatar(mockFile)).rejects.toThrow(
        'El archivo es demasiado grande'
      );
    });

    it('should handle API error', async () => {
      const mockFile = createMockFile();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, message: 'Upload failed' }),
      });

      await expect(UploadService.uploadAvatar(mockFile)).rejects.toThrow('Upload failed');
    });

    it('should handle missing avatar_url in response', async () => {
      const mockFile = createMockFile();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { file_path: 'avatars/user-1.jpg' },
        }),
      });

      await expect(UploadService.uploadAvatar(mockFile)).rejects.toThrow(
        'No se recibió la URL del avatar'
      );
    });
  });

  describe('deleteAvatar', () => {
    it('should delete avatar successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await expect(UploadService.deleteAvatar()).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/upload/avatar'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle API error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, message: 'Delete failed' }),
      });

      await expect(UploadService.deleteAvatar()).rejects.toThrow('Delete failed');
    });
  });

  describe('validateImageFile', () => {
    it('should return valid for JPEG', () => {
      const result = UploadService.validateImageFile(createMockFile({ type: 'image/jpeg' }));

      expect(result).toEqual({ isValid: true });
    });

    it('should return valid for PNG', () => {
      const result = UploadService.validateImageFile(createMockFile({ type: 'image/png' }));

      expect(result).toEqual({ isValid: true });
    });

    it('should return valid for WebP', () => {
      const result = UploadService.validateImageFile(createMockFile({ type: 'image/webp' }));

      expect(result).toEqual({ isValid: true });
    });

    it('should reject invalid file type', () => {
      const result = UploadService.validateImageFile(createMockFile({ type: 'image/gif' }));

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Tipo de archivo no válido');
    });

    it('should reject oversized file', () => {
      const result = UploadService.validateImageFile(createMockFile({ size: 10 * 1024 * 1024 }));

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('demasiado grande');
    });
  });

  describe('createPreviewUrl', () => {
    it('should create a blob URL', () => {
      const mockFile = createMockFile();
      const spy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
      const result = UploadService.createPreviewUrl(mockFile);

      expect(spy).toHaveBeenCalledWith(mockFile);
      expect(result).toBe('blob:mock');

      spy.mockRestore();
    });
  });

  describe('revokePreviewUrl', () => {
    it('should revoke a blob URL', () => {
      const spy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      UploadService.revokePreviewUrl('blob:mock');

      expect(spy).toHaveBeenCalledWith('blob:mock');

      spy.mockRestore();
    });
  });
});
