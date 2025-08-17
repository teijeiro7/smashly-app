import { supabase } from "../config/supabase";
import { RacketCharacteristics, RacketSpecifications } from "../types/racket";

// Interfaz para las palas en Supabase
export interface RacketDB {
  id?: number;
  nombre: string;
  marca: string;
  modelo: string;
  precio_actual: number;
  precio_original?: number | null;
  descuento_porcentaje: number;
  enlace: string;
  imagen: string;
  es_bestseller: boolean;
  en_oferta: boolean;
  scrapeado_en: string;
  fuente: string;
  created_at?: string;
  updated_at?: string;
  // Nuevos campos para características detalladas
  descripcion?: string;
  caracteristicas?: RacketCharacteristics;
  especificaciones?: RacketSpecifications;
}

export class RacketService {
  /**
   * Obtiene todas las palas de la base de datos
   */
  static async getAllRackets(): Promise<RacketDB[]> {
    try {
      const { data, error } = await supabase
        .from("palas_padel")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching rackets from Supabase:", error);
        throw new Error(
          `Error al cargar las palas desde Supabase: ${error.message}`
        );
      }

      console.log(
        `Successfully loaded ${data?.length || 0} rackets from Supabase`
      );
      return data || [];
    } catch (error: any) {
      console.error("Failed to connect to Supabase:", error);
      throw error;
    }
  }

  /**
   * Obtiene palas con paginación
   */
  static async getRacketsWithPagination(
    page: number = 0,
    limit: number = 50
  ): Promise<RacketDB[]> {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from("palas_padel")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching rackets with pagination:", error);
      throw new Error(`Error al cargar las palas: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtiene una pala por su ID
   */
  static async getRacketById(id: number): Promise<RacketDB | null> {
    const { data, error } = await supabase
      .from("palas_padel")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching racket by ID:", error);
      throw new Error(`Error al cargar la pala: ${error.message}`);
    }

    return data;
  }

  /**
   * Obtiene una pala por su nombre (para compatibilidad con URLs existentes)
   */
  static async getRacketByName(nombre: string): Promise<RacketDB | null> {
    const { data, error } = await supabase
      .from("palas_padel")
      .select("*")
      .eq("nombre", nombre)
      .single();

    if (error) {
      console.error("Error fetching racket by name:", error);
      // No lanzamos error aquí porque podría ser que simplemente no existe
      return null;
    }

    return data;
  }

  /**
   * Busca palas por texto en nombre, marca o modelo
   */
  static async searchRackets(query: string): Promise<RacketDB[]> {
    const { data, error } = await supabase
      .from("palas_padel")
      .select("*")
      .or(
        `nombre.ilike.%${query}%,marca.ilike.%${query}%,modelo.ilike.%${query}%`
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching rackets:", error);
      throw new Error(`Error al buscar palas: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtiene palas por marca
   */
  static async getRacketsByBrand(marca: string): Promise<RacketDB[]> {
    const { data, error } = await supabase
      .from("palas_padel")
      .select("*")
      .eq("marca", marca)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rackets by brand:", error);
      throw new Error(`Error al cargar palas por marca: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtiene palas bestseller
   */
  static async getBestsellerRackets(): Promise<RacketDB[]> {
    const { data, error } = await supabase
      .from("palas_padel")
      .select("*")
      .eq("es_bestseller", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bestseller rackets:", error);
      throw new Error(`Error al cargar palas bestseller: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtiene palas en oferta
   */
  static async getRacketsOnSale(): Promise<RacketDB[]> {
    const { data, error } = await supabase
      .from("palas_padel")
      .select("*")
      .eq("en_oferta", true)
      .order("descuento_porcentaje", { ascending: false });

    if (error) {
      console.error("Error fetching rackets on sale:", error);
      throw new Error(`Error al cargar palas en oferta: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtiene todas las marcas únicas
   */
  static async getUniqueBrands(): Promise<string[]> {
    const { data, error } = await supabase
      .from("palas_padel")
      .select("marca")
      .order("marca");

    if (error) {
      console.error("Error fetching brands:", error);
      throw new Error(`Error al cargar marcas: ${error.message}`);
    }

    // Extraer marcas únicas
    const uniqueBrands = [...new Set(data?.map((item) => item.marca) || [])];
    return uniqueBrands;
  }

  /**
   * Obtiene estadísticas básicas
   */
  static async getStats(): Promise<{
    total: number;
    bestsellers: number;
    onSale: number;
    brands: number;
  }> {
    const [totalResult, bestsellersResult, onSaleResult, brandsResult] =
      await Promise.all([
        supabase
          .from("palas_padel")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("palas_padel")
          .select("id", { count: "exact", head: true })
          .eq("es_bestseller", true),
        supabase
          .from("palas_padel")
          .select("id", { count: "exact", head: true })
          .eq("en_oferta", true),
        supabase.from("palas_padel").select("marca"),
      ]);

    const uniqueBrands = [
      ...new Set(brandsResult.data?.map((item) => item.marca) || []),
    ];

    return {
      total: totalResult.count || 0,
      bestsellers: bestsellersResult.count || 0,
      onSale: onSaleResult.count || 0,
      brands: uniqueBrands.length,
    };
  }
}
