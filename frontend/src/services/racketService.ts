import { supabase } from '../lib/supabase';
import { Racket } from '../types/racket';
import { API_ENDPOINTS, buildApiUrl, getCommonHeaders, ApiResponse } from '../config/api';

// ── Price history types (aggregated on backend, keep on Express for now) ──────
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

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
  }
  const data: ApiResponse<T> = await response.json();
  if (!data.success) throw new Error(data.message || data.error || 'Error desconocido');
  return data.data as T;
}

export class RacketService {
  static async getAllRackets(): Promise<Racket[]> {
    const { data, error } = await supabase
      .from('rackets')
      .select('*')
      .order('es_bestseller', { ascending: false })
      .order('nombre');

    if (error) throw new Error(error.message);
    return (data ?? []) as Racket[];
  }

  // Alias used by RacketsContext — TanStack Query caches this, ETag no longer needed
  static async getAllRacketsCached(): Promise<Racket[]> {
    return RacketService.getAllRackets();
  }

  static async getRacketsWithPagination(page = 0, limit = 50): Promise<Racket[]> {
    const from = page * limit;
    const { data, error } = await supabase
      .from('rackets')
      .select('*')
      .order('nombre')
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);
    return (data ?? []) as Racket[];
  }

  static async getRacketById(id: number): Promise<Racket | null> {
    const { data, error } = await supabase
      .from('rackets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Racket | null;
  }

  static async getRacketByName(nombre: string): Promise<Racket | null> {
    const { data, error } = await supabase
      .from('rackets')
      .select('*')
      .ilike('nombre', nombre)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Racket | null;
  }

  static async searchRackets(
    query: string,
    filters?: Record<string, string>,
    pagination?: { page?: number; limit?: number }
  ): Promise<{ data: Racket[]; pagination?: any }> {
    const page = pagination?.page ?? 0;
    const limit = pagination?.limit ?? 50;
    const from = page * limit;

    let q = supabase.from('rackets').select('*', { count: 'exact' });

    if (query) {
      q = q.or(`nombre.ilike.%${query}%,marca.ilike.%${query}%,modelo.ilike.%${query}%`);
    }

    if (filters) {
      const filterMap: Record<string, string> = {
        brand: 'marca',
        forma: 'caracteristicas_forma',
        balance: 'caracteristicas_balance',
        nivel: 'caracteristicas_nivel_de_juego',
      };
      for (const [key, value] of Object.entries(filters)) {
        if (!value) continue;
        const col = filterMap[key] ?? key;
        q = q.eq(col, value);
      }
    }

    const { data, count, error } = await q
      .order('es_bestseller', { ascending: false })
      .order('nombre')
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);

    return {
      data: (data ?? []) as Racket[],
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    };
  }

  static async getRacketsByBrand(marca: string): Promise<Racket[]> {
    const { data, error } = await supabase
      .from('rackets')
      .select('*')
      .eq('marca', marca)
      .order('nombre');

    if (error) throw new Error(error.message);
    return (data ?? []) as Racket[];
  }

  static async getBestsellerRackets(): Promise<Racket[]> {
    const { data, error } = await supabase
      .from('rackets')
      .select('*')
      .eq('es_bestseller', true)
      .order('nombre');

    if (error) throw new Error(error.message);
    return (data ?? []) as Racket[];
  }

  static async getRacketsOnSale(): Promise<Racket[]> {
    const { data, error } = await supabase
      .from('rackets')
      .select('*')
      .eq('en_oferta', true)
      .order('nombre');

    if (error) throw new Error(error.message);
    return (data ?? []) as Racket[];
  }

  static async getUniqueBrands(): Promise<string[]> {
    const { data, error } = await supabase
      .from('rackets')
      .select('marca')
      .order('marca');

    if (error) throw new Error(error.message);
    const brands = [...new Set((data ?? []).map((r: any) => r.marca).filter(Boolean))];
    return brands as string[];
  }

  static async getStats(): Promise<{ total: number; bestsellers: number; onSale: number; brands: number }> {
    const [totalRes, bestsellersRes, onSaleRes, brandsRes] = await Promise.all([
      supabase.from('rackets').select('*', { count: 'exact', head: true }),
      supabase.from('rackets').select('*', { count: 'exact', head: true }).eq('es_bestseller', true),
      supabase.from('rackets').select('*', { count: 'exact', head: true }).eq('en_oferta', true),
      supabase.from('rackets').select('marca'),
    ]);

    const uniqueBrands = new Set((brandsRes.data ?? []).map((r: any) => r.marca).filter(Boolean));

    return {
      total: totalRes.count ?? 0,
      bestsellers: bestsellersRes.count ?? 0,
      onSale: onSaleRes.count ?? 0,
      brands: uniqueBrands.size,
    };
  }

  // ── Admin mutations — service-role bypass handled in Vercel functions (Phase 4) ──
  static async updateRacket(id: number, updates: Partial<Racket>): Promise<Racket> {
    const { data, error } = await supabase
      .from('rackets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Racket;
  }

  static async deleteRacket(id: number): Promise<void> {
    const { error } = await supabase.from('rackets').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  static async bulkUpdateRackets(
    field: string,
    oldValue: any,
    newValue: any
  ): Promise<{ updatedCount: number }> {
    const { data, error } = await supabase
      .from('rackets')
      .update({ [field]: newValue })
      .eq(field, oldValue)
      .select('id');

    if (error) throw new Error(error.message);
    return { updatedCount: data?.length ?? 0 };
  }

  // ── Price history: aggregation kept on Express until Phase 4 Vercel function ──
  static async getPriceHistory(
    racketId: number,
    days = 90,
    store?: string
  ): Promise<PriceHistoryResult | null> {
    try {
      const params: Record<string, any> = { days };
      if (store) params.store = store;

      const url = buildApiUrl(API_ENDPOINTS.RACKETS_PRICE_HISTORY(racketId), params);
      const response = await fetch(url, { method: 'GET', headers: getCommonHeaders() });
      return await handleApiResponse<PriceHistoryResult>(response);
    } catch {
      return null;
    }
  }
}
