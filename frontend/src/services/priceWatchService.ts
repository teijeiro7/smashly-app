import { API_ENDPOINTS, buildApiUrl, getCommonHeaders } from '../config/api';

export interface PriceWatch {
  id: string;
  racket_id: number;
  target_price: number;
  active: boolean;
  created_at: string;
}

const priceWatchService = {
  async listWatches(racketId?: number): Promise<PriceWatch[]> {
    const url = racketId
      ? `${buildApiUrl(API_ENDPOINTS.PRICE_WATCH)}?racket_id=${racketId}`
      : buildApiUrl(API_ENDPOINTS.PRICE_WATCH);
    const response = await fetch(url, {
      credentials: 'include',
      headers: getCommonHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener alertas');
    }
    return response.json();
  },

  async createWatch(racketId: number, targetPrice: number): Promise<PriceWatch> {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.PRICE_WATCH), {
      method: 'POST',
      credentials: 'include',
      headers: getCommonHeaders(),
      body: JSON.stringify({ racket_id: racketId, target_price: targetPrice }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear alerta');
    }
    return response.json();
  },

  async deleteWatch(watchId: string): Promise<void> {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.PRICE_WATCH_BY_ID(watchId)), {
      method: 'DELETE',
      credentials: 'include',
      headers: getCommonHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar alerta');
    }
  },
};

export default priceWatchService;
