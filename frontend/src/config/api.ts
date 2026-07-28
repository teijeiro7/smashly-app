/**
 * API Configuration
 * Configuración centralizada para las llamadas a la API REST
 */
import { supabase } from '../lib/supabase';

// URL base de la API
// Por defecto, usa el mismo origen que sirve la SPA (evita CSP y mixed content)
const DEFAULT_ORIGIN =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost:3000';

export const API_URL = (import.meta as any).env?.VITE_API_URL || DEFAULT_ORIGIN;

// Endpoints de la API
export const API_ENDPOINTS = {
  // Rackets
  RACKETS: '/api/v1/rackets',
  RACKETS_BY_ID: (id: number) => `/api/v1/rackets/${id}`,
  RACKETS_BY_NAME: (nombre: string) => `/api/v1/rackets/by-name/${encodeURIComponent(nombre)}`,
  RACKETS_SEARCH: '/api/v1/rackets/search',
  RACKETS_FILTER: '/api/v1/rackets/filter',
  RACKETS_BESTSELLERS: '/api/v1/rackets/bestsellers',
  RACKETS_OFFERS: '/api/v1/rackets/offers',
  RACKETS_BRANDS: '/api/v1/rackets/brands',
  RACKETS_STATS: '/api/v1/rackets/stats',
  RACKETS_BULK_UPDATE: '/api/v1/rackets/bulk-update',
  RACKETS_BY_BRAND: (brand: string) => `/api/v1/rackets/brands/${brand}`,
  RECOMMENDATION_RAG: '/api/recommendations/generate-rag',

  // Users
  USERS_PROFILE: '/api/v1/users/profile',
  USERS_FAVORITES: '/api/v1/users/favorites',
  USERS_FAVORITE_BY_ID: (id: number) => `/api/v1/users/favorites/${id}`,

  // Stores
  STORES: '/api/v1/stores',
  STORES_BY_ID: (id: string) => `/api/v1/stores/${id}`,
  STORES_MY_STORE: '/api/v1/stores/my-store',
  STORES_CATALOG: (storeId: string) => `/api/v1/stores/catalog/${storeId}`,
  STORES_CATALOG_SEARCH: (storeId: string) => `/api/v1/stores/catalog/${storeId}/search`,
  STORES_CATALOG_ITEM: (storeId: string, priceId: string) =>
    `/api/v1/stores/catalog/${storeId}/${priceId}`,

  // Admin
  ADMIN: {
    METRICS: '/api/admin/metrics',
    USERS: '/api/admin/users',
    RACKET_REQUESTS: '/api/v1/admin/racket-requests',
    STORE_REQUESTS: '/api/v1/admin/store-requests',
    RECENT_ACTIVITY: '/api/v1/admin/recent-activity',
    BRANDS: '/api/v1/admin/brands',
    CATEGORIES: '/api/v1/admin/categories',
    VERIFY_STORE: (id: string) => `/api/admin/stores/${id}`,
    REJECT_STORE: (id: string) => `/api/admin/stores/${id}`,
    CONFLICTS: '/api/v1/admin/rackets/conflicts',
    RESOLVE_CONFLICT: (id: number) => `/api/v1/admin/rackets/${id}/resolve`,
    EMBEDDING_STATS: '/api/v1/admin/embeddings/stats',
    REINDEX_KNOWLEDGE: '/api/v1/admin/embeddings/reindex-knowledge',
  },

  // Racket Views
  RACKET_VIEWS: {
    RECENTLY_VIEWED: '/api/v1/racket-views/recently-viewed',
    RECORD_VIEW: (racketId: number) => `/api/v1/racket-views/${racketId}`,
    REMOVE_VIEW: (racketId: number) => `/api/v1/racket-views/${racketId}`,
    CLEAR_HISTORY: '/api/v1/racket-views/clear',
  },

  // Health
  HEALTH: '/api/v1/health',

  // Analytics
  ANALYTICS_TRACK: '/api/v1/analytics/store',
  ANALYTICS_TIMELINE: (storeId: string) => `/api/v1/analytics/store/${storeId}/timeline`,

  // Price Watch
  PRICE_WATCH: '/api/v1/price-watch',
  PRICE_WATCH_BY_ID: (id: string) => `/api/v1/price-watch/${id}`,

  // Notifications
  NOTIFICATIONS: '/api/v1/notifications',
  NOTIFICATIONS_UNREAD_COUNT: '/api/v1/notifications/unread-count',
  NOTIFICATIONS_MARK_READ: (id: string) => `/api/v1/notifications/${id}/read`,
  NOTIFICATIONS_MARK_ALL_READ: '/api/v1/notifications/read-all',
  NOTIFICATIONS_DELETE: (id: string) => `/api/v1/notifications/${id}`,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  // Defaults to RAG on, but VITE_USE_RAG=false lets it be switched back to
  // the deterministic recommender without a code change.
  USE_RAG_RECOMMENDATIONS: (import.meta as any).env?.VITE_USE_RAG !== 'false',
};

/**
 * Helper para construir URLs completas de la API
 */
export const buildApiUrl = (endpoint: string, params?: Record<string, any>): string => {
  // Asegurarse de que API_URL no termine con / y endpoint no comience con /
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let url = `${baseUrl}${path}`;

  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return url;
};

/**
 * Headers de autenticación para llamadas a la API propia.
 * No hay backend de auth ni cookie httpOnly: la sesión de Supabase vive en
 * localStorage (ver frontend/src/lib/supabase.ts) y el access token viaja
 * como `Authorization: Bearer <token>`, que es lo que `api/_lib/auth.ts`
 * (`getAuthUser`) espera en el servidor.
 */
export const getAuthHeaders = async (): Promise<HeadersInit> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
};

/**
 * Tipo para respuestas de la API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Tipo para respuestas paginadas
 */
export interface PaginatedResponse<T = any> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
