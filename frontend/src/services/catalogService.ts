import { API_ENDPOINTS, API_URL } from '../config/api';
import { supabase } from '../lib/supabase';

export interface StorePrice {
  id: string;
  racket_id: number;
  store_id: string;
  price: number | null;
  original_price: number | null;
  discount_percentage: number | null;
  link: string | null;
  currency: string;
  in_stock: boolean;
  is_auto_match: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
  racket?: any;
}

export interface CatalogSearchResult {
  id: number;
  name: string;
  brand: string;
  model: string;
  images: string[];
  _score: number;
}

async function getToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || '';
}

const catalogService = {
  async list(
    storeId: string,
    page = 1,
    limit = 50
  ): Promise<{ data: StorePrice[]; total: number }> {
    const token = await getToken();
    const url = new URL(`${API_URL}${API_ENDPOINTS.STORES_CATALOG(storeId)}`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al cargar el catálogo');
    }

    return res.json();
  },

  async add(
    storeId: string,
    data: {
      racket_id: number;
      price?: number;
      original_price?: number;
      link?: string;
      in_stock?: boolean;
    }
  ): Promise<StorePrice> {
    const token = await getToken();
    const res = await fetch(`${API_URL}${API_ENDPOINTS.STORES_CATALOG(storeId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al añadir al catálogo');
    }

    return res.json();
  },

  async update(
    storeId: string,
    priceId: string,
    data: {
      price?: number;
      original_price?: number;
      link?: string;
      in_stock?: boolean;
    }
  ): Promise<StorePrice> {
    const token = await getToken();
    const res = await fetch(`${API_URL}${API_ENDPOINTS.STORES_CATALOG_ITEM(storeId, priceId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar');
    }

    return res.json();
  },

  async remove(storeId: string, priceId: string): Promise<void> {
    const token = await getToken();
    const res = await fetch(`${API_URL}${API_ENDPOINTS.STORES_CATALOG_ITEM(storeId, priceId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar');
    }
  },

  async search(
    storeId: string,
    query: string,
    page = 1,
    limit = 20
  ): Promise<{ data: CatalogSearchResult[]; total: number }> {
    const token = await getToken();
    const res = await fetch(`${API_URL}${API_ENDPOINTS.STORES_CATALOG_SEARCH(storeId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, page, limit }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al buscar palas');
    }

    return res.json();
  },
};

export default catalogService;
