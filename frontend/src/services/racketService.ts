import { supabase } from '../lib/supabase';
import { Racket } from '../types/racket';

// ── Price history types ───────────────────────────────────────────────────────
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

// ── DB → Frontend mapper ──────────────────────────────────────────────────────
// The Supabase DB uses English column names; the frontend Racket type uses Spanish.
// This mapper translates and computes derived fields (best price).

function parseImages(imgs: unknown): string[] {
  if (!imgs) return [];
  if (typeof imgs === 'string') {
    try {
      return parseImages(JSON.parse(imgs));
    } catch {
      return imgs.startsWith('http') ? [imgs.trim()] : [];
    }
  }
  if (Array.isArray(imgs)) return imgs.flatMap(parseImages);
  return [];
}

function calculateBestPrice(raw: any): {
  precio_actual: number;
  precio_original: number | null;
  descuento_porcentaje: number;
  enlace: string;
  fuente: string;
} {
  const stores = [
    {
      name: 'padelnuestro',
      current_price: raw.padelnuestro_actual_price,
      original_price: raw.padelnuestro_original_price,
      discount_percentage: raw.padelnuestro_discount_percentage,
      link: raw.padelnuestro_link,
    },
    {
      name: 'padelmarket',
      current_price: raw.padelmarket_actual_price,
      original_price: raw.padelmarket_original_price,
      discount_percentage: raw.padelmarket_discount_percentage,
      link: raw.padelmarket_link,
    },
    {
      name: 'padelproshop',
      current_price: raw.padelproshop_actual_price,
      original_price: raw.padelproshop_original_price,
      discount_percentage: raw.padelproshop_discount_percentage,
      link: raw.padelproshop_link,
    },
  ].filter(s => s.current_price != null && s.current_price > 0);

  if (stores.length === 0) {
    return {
      precio_actual: 0,
      precio_original: null,
      descuento_porcentaje: 0,
      enlace: '',
      fuente: raw.comparison_only ? 'Solo comparación' : 'No disponible',
    };
  }

  const best = stores.reduce((a, b) => (b.current_price! < a.current_price! ? b : a));
  return {
    precio_actual: best.current_price!,
    precio_original: best.original_price ?? null,
    descuento_porcentaje: best.discount_percentage ?? 0,
    enlace: best.link ?? '',
    fuente: best.name,
  };
}

function mapDbToFrontend(raw: any): Racket {
  const specs = raw.specs ?? {};
  const images = parseImages(raw.images);
  const bestPrice = calculateBestPrice(raw);

  return {
    id: raw.id,
    nombre: raw.name ?? '',
    marca: raw.brand ?? '',
    modelo: raw.model ?? '',
    imagenes: images,
    en_oferta: raw.on_offer ?? false,
    scrapeado_en: raw.created_at,
    descripcion: raw.description ?? null,

    caracteristicas_marca: raw.characteristics_brand ?? specs.marca ?? raw.brand ?? null,
    caracteristicas_color: raw.characteristics_color ?? specs.color ?? null,
    caracteristicas_color_2: raw.characteristics_color_2 ?? null,
    caracteristicas_producto: raw.characteristics_product ?? specs.producto ?? 'Palas',
    caracteristicas_balance: raw.characteristics_balance ?? specs.balance ?? null,
    caracteristicas_nucleo: raw.characteristics_core ?? specs.nucleo ?? null,
    caracteristicas_cara: raw.characteristics_face ?? specs.cara ?? null,
    caracteristicas_formato: raw.characteristics_format ?? specs.formato ?? specs.forma ?? null,
    caracteristicas_dureza: raw.characteristics_hardness ?? specs.dureza ?? null,
    caracteristicas_nivel_de_juego: raw.characteristics_game_level ?? specs.nivel_de_juego ?? null,
    caracteristicas_acabado: raw.characteristics_finish ?? specs.acabado ?? null,
    caracteristicas_forma: raw.characteristics_shape ?? specs.forma ?? null,
    caracteristicas_superficie: raw.characteristics_surface ?? specs.superficie ?? null,
    caracteristicas_tipo_de_juego: raw.characteristics_game_type ?? specs.tipo_de_juego ?? null,
    caracteristicas_coleccion_jugadores: raw.characteristics_player_collection ?? null,
    caracteristicas_jugador: raw.characteristics_player ?? specs.jugador ?? null,

    especificaciones: specs,

    padelnuestro_precio_actual: raw.padelnuestro_actual_price ?? null,
    padelnuestro_precio_original: raw.padelnuestro_original_price ?? null,
    padelnuestro_descuento_porcentaje: raw.padelnuestro_discount_percentage ?? null,
    padelnuestro_enlace: raw.padelnuestro_link ?? null,

    padelmarket_precio_actual: raw.padelmarket_actual_price ?? null,
    padelmarket_precio_original: raw.padelmarket_original_price ?? null,
    padelmarket_descuento_porcentaje: raw.padelmarket_discount_percentage ?? null,
    padelmarket_enlace: raw.padelmarket_link ?? null,

    padelproshop_precio_actual: raw.padelproshop_actual_price ?? null,
    padelproshop_precio_original: raw.padelproshop_original_price ?? null,
    padelproshop_descuento_porcentaje: raw.padelproshop_discount_percentage ?? null,
    padelproshop_enlace: raw.padelproshop_link ?? null,

    created_at: raw.created_at,
    updated_at: raw.updated_at,
    view_count: raw.view_count ?? 0,

    ...bestPrice,

    radar_potencia: raw.radar_potencia ?? null,
    radar_control: raw.radar_control ?? null,
    radar_manejabilidad: raw.radar_manejabilidad ?? null,
    radar_punto_dulce: raw.radar_punto_dulce ?? null,
    radar_salida_bola: raw.radar_salida_bola ?? null,

    testea_potencia: raw.testea_potencia ?? null,
    testea_control: raw.testea_control ?? null,
    testea_manejabilidad: raw.testea_manejabilidad ?? null,
    testea_confort: raw.testea_confort ?? null,
    testea_iniciacion: raw.testea_iniciacion ?? null,
    peso: raw.peso ?? null,

    solo_comparacion: raw.comparison_only ?? false,
    comparison_only: raw.comparison_only ?? false,
    store_id: raw.store_id ?? null,
  } as Racket;
}

// ── Service ───────────────────────────────────────────────────────────────────
const racketService = {
  async getAllRackets(): Promise<Racket[]> {
    const { data, error } = await supabase.from('rackets').select('*').order('name');

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapDbToFrontend);
  },

  // Alias used by RacketsContext — TanStack Query caches this
  async getAllRacketsCached(): Promise<Racket[]> {
    return racketService.getAllRackets();
  },

  async getRacketsWithPagination(page = 0, limit = 50): Promise<Racket[]> {
    const from = page * limit;
    const { data, error } = await supabase
      .from('rackets')
      .select('*')
      .order('name')
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapDbToFrontend);
  },

  async getRacketById(id: number): Promise<Racket | null> {
    const { data, error } = await supabase.from('rackets').select('*').eq('id', id).maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapDbToFrontend(data) : null;
  },

  async getRacketsByIds(ids: number[]): Promise<Racket[]> {
    const { data, error } = await supabase.from('rackets').select('*').in('id', ids);

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapDbToFrontend);
  },

  async getRacketByName(nombre: string): Promise<Racket | null> {
    const { data, error } = await supabase
      .from('rackets')
      .select('*')
      .ilike('name', nombre)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapDbToFrontend(data) : null;
  },

  async searchRackets(
    query: string,
    filters?: Record<string, string>,
    pagination?: { page?: number; limit?: number }
  ): Promise<{ data: Racket[]; pagination?: any }> {
    const page = pagination?.page ?? 0;
    const limit = pagination?.limit ?? 50;
    const from = page * limit;

    let q = supabase.from('rackets').select('*', { count: 'exact' });

    if (query) {
      q = q.or(`name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%`);
    }

    if (filters) {
      const filterMap: Record<string, string> = {
        brand: 'brand',
        marca: 'brand',
        shape: 'caracteristicas_forma',
        forma: 'caracteristicas_forma',
        balance: 'caracteristicas_balance',
        core: 'caracteristicas_nucleo',
        nucleo: 'caracteristicas_nucleo',
        face: 'caracteristicas_cara',
        cara: 'caracteristicas_cara',
        hardness: 'caracteristicas_dureza',
        dureza: 'caracteristicas_dureza',
        game_type: 'caracteristicas_tipo_de_juego',
        level: 'caracteristicas_nivel_de_juego',
        nivel: 'caracteristicas_nivel_de_juego',
        on_sale: 'on_offer',
      };
      for (const [key, value] of Object.entries(filters)) {
        if (!value) continue;
        const col = filterMap[key] ?? key;
        q = q.eq(col, value);
      }
    }

    const { data, count, error } = await q.order('name').range(from, from + limit - 1);

    if (error) throw new Error(error.message);

    return {
      data: (data ?? []).map(mapDbToFrontend),
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    };
  },

  async getRacketsByBrand(marca: string): Promise<Racket[]> {
    const { data, error } = await supabase
      .from('rackets')
      .select('*')
      .eq('brand', marca)
      .order('name');

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapDbToFrontend);
  },

  async getBestsellerRackets(): Promise<Racket[]> {
    // es_bestseller does not exist in DB — return top rackets by name
    const { data, error } = await supabase.from('rackets').select('*').order('name').limit(20);

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapDbToFrontend);
  },

  async getRacketsOnSale(): Promise<Racket[]> {
    const { data, error } = await supabase
      .from('rackets')
      .select('*')
      .eq('on_offer', true)
      .order('name');

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapDbToFrontend);
  },

  async getUniqueBrands(): Promise<string[]> {
    const { data, error } = await supabase.from('rackets').select('brand').order('brand');

    if (error) throw new Error(error.message);
    const brands = [...new Set((data ?? []).map((r: any) => r.brand).filter(Boolean))];
    return brands as string[];
  },

  async getStats(): Promise<{
    total: number;
    bestsellers: number;
    onSale: number;
    brands: number;
  }> {
    const [totalRes, onSaleRes, brandsRes] = await Promise.all([
      supabase.from('rackets').select('*', { count: 'exact', head: true }),
      supabase.from('rackets').select('*', { count: 'exact', head: true }).eq('on_offer', true),
      supabase.from('rackets').select('brand'),
    ]);

    const uniqueBrands = new Set((brandsRes.data ?? []).map((r: any) => r.brand).filter(Boolean));

    return {
      total: totalRes.count ?? 0,
      bestsellers: 0, // bestseller logic TBD — returning 0 for now
      onSale: onSaleRes.count ?? 0,
      brands: uniqueBrands.size,
    };
  },

  // ── Admin mutations ───────────────────────────────────────────────────────
  async updateRacket(id: number, updates: Partial<Racket>): Promise<Racket> {
    const { data, error } = await supabase
      .from('rackets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapDbToFrontend(data);
  },

  async deleteRacket(id: number): Promise<void> {
    const { error } = await supabase.from('rackets').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async bulkUpdateRackets(
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
  },

  // ── Price history ────────────────────────────────────────────────────────
  // price_history has public RLS SELECT (service-role-only writes, from the
  // scraper's record_price_history()), so this reads straight from Supabase
  // instead of /api/v1/rackets/:id/price-history, whose handler still queries
  // columns the table doesn't have (store_id/created_at instead of
  // store/recorded_at) and therefore always 500s.
  async getPriceHistory(
    racketId: number,
    days = 90,
    store?: string
  ): Promise<PriceHistoryResult | null> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      let query = supabase
        .from('price_history')
        .select('store, price, recorded_at')
        .eq('racket_id', racketId)
        .gte('recorded_at', since.toISOString())
        .order('recorded_at', { ascending: true });

      if (store) query = query.eq('store', store);

      const { data, error } = await query;
      if (error || !data) return null;

      const points: PricePoint[] = data.map((row: any) => ({
        date: row.recorded_at,
        price: row.price,
        store: row.store,
      }));

      const byStore = new Map<string, PricePoint[]>();
      for (const point of points) {
        const list = byStore.get(point.store) ?? [];
        list.push(point);
        byStore.set(point.store, list);
      }

      const stores: StorePriceHistory[] = Array.from(byStore.entries()).map(
        ([storeName, history]) => {
          const prices = history.map(h => h.price);
          return {
            store: storeName,
            history,
            currentPrice: prices.length ? prices[prices.length - 1] : null,
            minPrice: prices.length ? Math.min(...prices) : null,
            maxPrice: prices.length ? Math.max(...prices) : null,
          };
        }
      );

      return { racketId, days, stores, combined: points };
    } catch {
      return null;
    }
  },
};

export default racketService;
