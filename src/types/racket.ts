// Base interface for racket data
export interface Racket {
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

// Interface for detailed racket characteristics
export interface RacketCharacteristics {
  marca?: string;
  color?: string;
  color_secundario?: string;
  balance?: string;
  nucleo?: string;
  dureza?: string;
  acabado?: string;
  superficie?: string;
  forma?: string;
  tipo_juego?: string;
  nivel_jugador?: string;
  nivel_juego?: string;
  peso?: string;
  grosor?: string;
  material?: string;
  material_cara?: string;
  material_marco?: string;
  [key: string]: string | undefined; // Para características adicionales
}

// Interface for additional specifications
export interface RacketSpecifications {
  [key: string]: string | number | boolean;
}

// Interface for racket recommendations from AI
export interface RacketRecommendation {
  racketName: string;
  brand: string;
  model: string;
  price: string;
  imageUrl: string;
  whyThisRacket: string;
  technicalSpecs: {
    weight: string;
    balance: string;
    shape: string;
    material: string;
    level: string;
  };
  pros: string[];
  cons: string[];
  matchPercentage: number;
}

// Interface for multiple racket recommendations
export interface MultipleRacketRecommendations {
  recommendations: RacketRecommendation[];
  summary: string;
}

// Interface for racket analysis in comparison
export interface RacketAnalysis {
  name: string;
  keyAttributes: string;
  recommendedFor: string;
  whyThisRacket: string;
  pros: string[];
  cons: string[];
}

// Interface for racket comparison
export interface RacketComparison {
  generalAnalysis: string;
  racketAnalysis: RacketAnalysis[];
  finalRecommendation: string;
}

// Interface for form data in best racket finder
export interface FormData {
  gameLevel: string;
  playingStyle: string;
  weight: string;
  height: string;
  budget: string;
  preferredShape: string;
}

// Interface for FAQ items
export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

// Interface for user profile (for future use)
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  gameLevel: string;
  playingStyle: string;
  favoriteRackets: string[];
  preferences: {
    budget: number;
    weight: string;
    shape: string;
  };
}

// Enum for playing levels
export enum PlayingLevel {
  BEGINNER = "Principiante",
  INTERMEDIATE = "Intermedio",
  ADVANCED = "Avanzado",
}

// Enum for playing styles
export enum PlayingStyle {
  DEFENSIVE = "Defensivo",
  VERSATILE = "Polivalente",
  OFFENSIVE = "Ofensivo",
}

// Enum for racket shapes
export enum RacketShape {
  ROUND = "Redonda",
  TEARDROP = "Lágrima",
  DIAMOND = "Diamante",
}

// Type for search filters
export type SearchFilters = {
  brand?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  onSale?: boolean;
  bestseller?: boolean;
  shape?: RacketShape;
};

// Type for sorting options
export type SortOption =
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc"
  | "discount-desc";

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
