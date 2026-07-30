import { supabase } from '../lib/supabase';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET = 'avatars';

/**
 * Servicio para manejar la subida de archivos (avatares).
 * Sube directamente a Supabase Storage (bucket `avatars`, RLS por
 * auth.uid() en la carpeta `${uid}/...`, lectura pública) — no existe
 * ningún endpoint /api/v1/upload/avatar en el backend.
 */
export class UploadService {
  /**
   * Sube un avatar de usuario
   * @param file - Archivo de imagen a subir
   * @returns URL pública del avatar subido
   */
  static async uploadAvatar(file: File): Promise<string> {
    try {
      const validation = UploadService.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${session.user.id}/avatar.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (error) throw new Error(error.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      throw new Error(error.message || 'Error al subir el avatar');
    }
  }

  /**
   * Elimina el avatar del usuario.
   * La extensión puede variar entre subidas, así que se lista la carpeta
   * del usuario y se borra todo lo que haya en ella.
   */
  static async deleteAvatar(): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET)
        .list(session.user.id);

      if (listError) throw new Error(listError.message);
      if (!files || files.length === 0) return;

      const paths = files.map(f => `${session.user.id}/${f.name}`);
      const { error } = await supabase.storage.from(BUCKET).remove(paths);

      if (error) throw new Error(error.message);
    } catch (error: any) {
      console.error('Error deleting avatar:', error);
      throw new Error(error.message || 'Error al eliminar el avatar');
    }
  }

  /**
   * Valida si un archivo es una imagen válida
   */
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG y WebP',
      };
    }

    if (file.size > MAX_SIZE) {
      return {
        isValid: false,
        error: 'El archivo es demasiado grande. Tamaño máximo: 5MB',
      };
    }

    return { isValid: true };
  }

  /**
   * Crea una URL de vista previa para una imagen
   */
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Libera una URL de vista previa creada con createPreviewUrl
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}
