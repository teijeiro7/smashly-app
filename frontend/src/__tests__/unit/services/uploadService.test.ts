import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UploadService } from '../../../services/uploadService';
import { supabase } from '../../../lib/supabase';

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    storage: {
      from: vi.fn(),
    },
  },
}));

function createMockFile(overrides: Partial<File> = {}): File {
  return {
    type: 'image/jpeg',
    size: 1024 * 1024,
    name: 'test.jpg',
    ...overrides,
  } as File;
}

const mockSession = {
  access_token: 'test-token',
  user: { id: 'user-1', email: 'test@test.com' },
};

describe('UploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: mockSession } });
  });

  describe('uploadAvatar', () => {
    it('should upload an avatar successfully', async () => {
      const mockFile = createMockFile();
      const mockPublicUrl = 'https://example.com/avatars/user-1/avatar.jpg';

      const upload = vi.fn().mockResolvedValue({ error: null });
      const getPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: mockPublicUrl } });
      (supabase.storage.from as any).mockReturnValue({ upload, getPublicUrl });

      const result = await UploadService.uploadAvatar(mockFile);

      expect(result).toBe(mockPublicUrl);
      expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
      expect(upload).toHaveBeenCalledWith(
        'user-1/avatar.jpg',
        mockFile,
        expect.objectContaining({ upsert: true, contentType: 'image/jpeg' })
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

    it('should handle storage upload error', async () => {
      const mockFile = createMockFile();

      const upload = vi.fn().mockResolvedValue({ error: { message: 'Upload failed' } });
      (supabase.storage.from as any).mockReturnValue({ upload });

      await expect(UploadService.uploadAvatar(mockFile)).rejects.toThrow('Upload failed');
    });

    it('should reject when there is no active session', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
      const mockFile = createMockFile();

      await expect(UploadService.uploadAvatar(mockFile)).rejects.toThrow('No hay sesión activa');
    });
  });

  describe('deleteAvatar', () => {
    it('should delete avatar successfully', async () => {
      const list = vi.fn().mockResolvedValue({ data: [{ name: 'avatar.jpg' }], error: null });
      const remove = vi.fn().mockResolvedValue({ error: null });
      (supabase.storage.from as any).mockReturnValue({ list, remove });

      await expect(UploadService.deleteAvatar()).resolves.not.toThrow();

      expect(list).toHaveBeenCalledWith('user-1');
      expect(remove).toHaveBeenCalledWith(['user-1/avatar.jpg']);
    });

    it('should no-op when the user has no avatar', async () => {
      const list = vi.fn().mockResolvedValue({ data: [], error: null });
      const remove = vi.fn();
      (supabase.storage.from as any).mockReturnValue({ list, remove });

      await expect(UploadService.deleteAvatar()).resolves.not.toThrow();
      expect(remove).not.toHaveBeenCalled();
    });

    it('should handle storage error', async () => {
      const list = vi.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } });
      (supabase.storage.from as any).mockReturnValue({ list });

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
