// Type definitions for the padel racket JSON data
export interface PadelRacketData {
  nombre: string;
  marca: string;
  modelo: string;
  precio_actual: number;
  precio_original: number | null;
  descuento_porcentaje: number;
  enlace: string;
  imagen: string;
  es_bestseller: boolean;
  en_oferta: boolean;
  scrapeado_en: string;
  fuente: string;
}

export interface PadelRacketJSON {
  palas: PadelRacketData[];
}
