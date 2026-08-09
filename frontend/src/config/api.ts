/**
 * API Configuration
 * Configuración centralizada para las llamadas a la API REST
 */
import { supabase } from '../lib/supabase';
import { withTimeout } from '../utils/withTimeout';

const GET_SESSION_TIMEOUT_MS = 8000;

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
  RECOMMENDATION_RAG: '/api/recommendations/generate-rag',

  // Users
  USERS_PROFILE: '/api/v1/users/profile',

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
    CATEGORIES: '/api/v1/admin/categories',
    VERIFY_STORE: (id: string) => `/api/admin/stores/${id}`,
    REJECT_STORE: (id: string) => `/api/admin/stores/${id}`,
    CONFLICTS: '/api/v1/admin/rackets/conflicts',
    RESOLVE_CONFLICT: (id: number) => `/api/v1/admin/rackets/${id}/resolve`,
  },

  // Health
  HEALTH: '/api/health',

  // Analytics
  ANALYTICS_TRACK: '/api/v1/analytics/store',
  ANALYTICS_TIMELINE: (storeId: string) => `/api/v1/analytics/store/${storeId}/timeline`,

  // Price Watch
  PRICE_WATCH: '/api/v1/price-watch',
  PRICE_WATCH_BY_ID: (id: string) => `/api/v1/price-watch/${id}`,
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
  // getSession()/refreshSession() share a single-tab lock with every other
  // auth call in the app (see lib/supabase.ts's `processLock` comment); if
  // that lock's queue ever stalls, this would otherwise hang forever with no
  // error — silently blocking every API call. withTimeout bounds it: on
  // timeout, headers come back without a token and the request 401s
  // normally instead of never firing at all.
  let {
    data: { session },
  } = await withTimeout(supabase.auth.getSession(), GET_SESSION_TIMEOUT_MS, () => ({
    data: { session: null },
    error: null,
  }));

  // If session token is expired or expiring within 60 seconds, refresh it
  if (session?.expires_at) {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (session.expires_at - nowInSeconds < 60) {
      const { data: refreshData } = await withTimeout(
        supabase.auth.refreshSession(),
        GET_SESSION_TIMEOUT_MS,
        () => ({ data: { session: null, user: null }, error: null })
      );
      if (refreshData?.session) {
        session = refreshData.session;
      }
    }
  }

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
