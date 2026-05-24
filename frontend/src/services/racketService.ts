import { Racket } from '../types/racket';
import { API_ENDPOINTS, buildApiUrl, getCommonHeaders, ApiResponse } from '../config/api';
import { logger } from '../utils/logger';

// ── Tipos para historial de precios ────────────────────────────────────────────
export interface PricePoint {
  date: string;
  price: number;
  store: string;
}

export interface StorePriceHistory {
  store: string;
  history: PricePoint[];
  currentPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
}

export interface PriceHistoryResult {
  racketId: number;
  days: number;
  stores: StorePriceHistory[];
  combined: PricePoint[];
}

/**
 * Helper para manejar respuestas de la API
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
  }

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.message || data.error || 'Error desconocido');
  }

  return data.data as T;
}

export class RacketService {
  /**
   * Obtiene todas las palas desde la API REST
   */
  static async getAllRackets(): Promise<Racket[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS);
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<Racket[]>(response);
    } catch (error: any) {
      logger.error('Error fetching rackets from API:', error);
      throw error;
    }
  }

  /**
   * Obtiene palas con paginación desde la API REST
   */
  static async getRacketsWithPagination(page: number = 0, limit: number = 50): Promise<Racket[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS, {
        page,
        limit,
        paginated: 'true',
      });
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      const data = await handleApiResponse<any>(response);
      return data.items || data;
    } catch (error: any) {
      logger.error('Error fetching rackets with pagination:', error);
      throw error;
    }
  }

  /**
   * Obtiene una pala por su ID desde la API REST
   */
  static async getRacketById(id: number): Promise<Racket | null> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_BY_ID(id));
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      return await handleApiResponse<Racket>(response);
    } catch (error: any) {
      logger.error('Error fetching racket by ID:', error);
      if (error.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Obtiene una pala por su nombre (exact match, case-insensitive)
   */
  static async getRacketByName(nombre: string): Promise<Racket | null> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_BY_NAME(nombre));
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      return await handleApiResponse<Racket>(response);
    } catch (error: any) {
      logger.error('Error fetching racket by name:', error);
      return null;
    }
  }

  /**
   * Busca palas por texto desde la API REST con filtros opcionales
   */
  static async searchRackets(
    query: string,
    filters?: Record<string, string>,
    pagination?: { page?: number; limit?: number }
  ): Promise<{ data: Racket[]; pagination?: any }> {
    try {
      const params: Record<string, string> = { q: query };
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params[key] = value;
        });
      }

      if (pagination) {
        if (pagination.page !== undefined) params.page = String(pagination.page);
        if (pagination.limit !== undefined) params.limit = String(pagination.limit);
      }

      const url = buildApiUrl(API_ENDPOINTS.RACKETS_SEARCH, params);
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<any>(response);
    } catch (error: any) {
      logger.error('Error searching rackets:', error);
      throw error;
    }
  }

  /**
   * Obtiene palas por marca desde la API REST
   */
  static async getRacketsByBrand(marca: string): Promise<Racket[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_BY_BRAND(marca));
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<Racket[]>(response);
    } catch (error: any) {
      logger.error('Error fetching rackets by brand:', error);
      throw error;
    }
  }

  /**
   * Obtiene palas bestseller desde la API REST
   */
  static async getBestsellerRackets(): Promise<Racket[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_BESTSELLERS);
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<Racket[]>(response);
    } catch (error: any) {
      logger.error('Error fetching bestseller rackets:', error);
      throw error;
    }
  }

  /**
   * Obtiene palas en oferta desde la API REST
   */
  static async getRacketsOnSale(): Promise<Racket[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_OFFERS);
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<Racket[]>(response);
    } catch (error: any) {
      logger.error('Error fetching rackets on sale:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las marcas únicas desde la API REST
   */
  static async getUniqueBrands(): Promise<string[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_BRANDS);
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<string[]>(response);
    } catch (error: any) {
      logger.error('Error fetching brands:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las palas con caché ETag:
   * - Envía If-None-Match con el ETag guardado
   * - 304 → devuelve localStorage (sin descargar el catálogo)
   * - 200 → guarda nuevo ETag + catálogo en localStorage, retorna
   */
  static async getAllRacketsCached(): Promise<Racket[]> {
    const CACHE_KEY = 'smashly_catalog';
    const ETAG_KEY = 'smashly_catalog_etag';

    const storedETag = localStorage.getItem(ETAG_KEY);
    const storedData = localStorage.getItem(CACHE_KEY);

    const headers: HeadersInit = { ...getCommonHeaders() };
    if (storedETag && storedData) {
      (headers as Record<string, string>)['If-None-Match'] = storedETag;
    }

    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS);
      const response = await fetch(url, { headers });

      if (response.status === 304 && storedData) {
        const parsed = JSON.parse(storedData) as Racket[];
        logger.log(`⚡ Catálogo desde localStorage (${parsed.length} palas, ETag hit)`);
        return parsed;
      }

      const data = await handleApiResponse<Racket[]>(response);
      const newETag = response.headers.get('ETag') || '';

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        if (newETag) localStorage.setItem(ETAG_KEY, newETag);
      } catch (e) {
        logger.warn('localStorage quota exceeded:', e);
      }

      logger.log(`💾 Catálogo actualizado (${data.length} palas)`);
      return data;
    } catch (error: any) {
      // Fallback to stale localStorage data rather than failing completely
      if (storedData) {
        try {
          return JSON.parse(storedData) as Racket[];
        } catch {}
      }
      logger.error('Error fetching catalog:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas básicas desde la API REST
   */
  static async getStats(): Promise<{
    total: number;
    bestsellers: number;
    onSale: number;
    brands: number;
  }> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_STATS);
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<{
        total: number;
        bestsellers: number;
        onSale: number;
        brands: number;
      }>(response);
    } catch (error: any) {
      logger.error('Error fetching stats:', error);
      throw error;
    }
  }

  /**
   * Actualiza una pala existente
   */
  static async updateRacket(id: number, updates: Partial<Racket>): Promise<Racket> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_BY_ID(id));
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: getCommonHeaders(),
        body: JSON.stringify(updates),
      });

      return await handleApiResponse<Racket>(response);
    } catch (error: any) {
      logger.error('Error updating racket:', error);
      throw error;
    }
  }

  /**
   * Elimina una pala por su ID
   */
  static async deleteRacket(id: number): Promise<void> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_BY_ID(id));
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: getCommonHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
    } catch (error: any) {
      logger.error('Error deleting racket:', error);
      throw error;
    }
  }

  /**
   * Actualiza masivamente un campo para todas las palas que coincidan con un valor antiguo
   */
  static async bulkUpdateRackets(
    field: string,
    oldValue: any,
    newValue: any
  ): Promise<{ updatedCount: number }> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.RACKETS_BULK_UPDATE);
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: getCommonHeaders(),
        body: JSON.stringify({ field, oldValue, newValue }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al realizar la actualización masiva');
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      logger.error('Error in bulkUpdateRackets:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de precios de una pala.
   * @param racketId  ID numérico de la pala
   * @param days      Ventana temporal en días (default: 90)
   * @param store     Filtrar por tienda (opcional)
   */
  static async getPriceHistory(
    racketId: number,
    days: number = 90,
    store?: string
  ): Promise<PriceHistoryResult | null> {
    try {
      const params: Record<string, any> = { days };
      if (store) params.store = store;

      const url = buildApiUrl(API_ENDPOINTS.RACKETS_PRICE_HISTORY(racketId), params);
      const response = await fetch(url, {
        method: 'GET',
        headers: getCommonHeaders(),
      });

      return await handleApiResponse<PriceHistoryResult>(response);
    } catch (error: any) {
      logger.error('Error fetching price history:', error);
      return null;
    }
  }
}
