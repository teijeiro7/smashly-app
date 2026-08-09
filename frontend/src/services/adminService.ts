import { API_ENDPOINTS, buildApiUrl, getAuthHeaders, ApiResponse } from '../config/api';
import { supabase } from '../lib/supabase';

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

// Interfaces
export interface AdminMetrics {
  totalUsers: number;
  totalRackets: number;
  totalStores: number;
  totalReviews: number;
  pendingRequests: number;
  activeUsers: number;
  totalFavorites: number;
}

export interface AdminUser {
  id: string;
  email: string;
  nickname: string;
  full_name?: string;
  role: 'Admin' | 'Player' | 'Store';
  created_at: string;
}

export interface StoreRequest {
  id: string;
  store_name: string;
  legal_name: string;
  cif_nif: string;
  contact_email: string;
  phone_number: string;
  website_url?: string;
  logo_url?: string;
  short_description?: string;
  location: string;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string;
  admin_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface RacketRequest {
  id: number;
  nombre: string;
  marca: string;
  precio_actual: number;
  forma?: string;
  balance?: string;
  status: 'pending' | 'approved' | 'rejected';
  requester?: string;
  requestDate?: string;
}

export interface Brand {
  name: string;
  country?: string;
  racketCount: number;
}

export interface Category {
  name: string;
  description: string;
  racketCount: number;
}

export class AdminService {
  /**
   * Obtiene las métricas del dashboard de admin
   */
  static async getDashboardMetrics(): Promise<AdminMetrics> {
    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.ADMIN.METRICS, {
      method: 'GET',
      headers,
    });

    return handleApiResponse<AdminMetrics>(response);
  }

  /**
   * Obtiene todos los usuarios
   */
  static async getAllUsers(): Promise<AdminUser[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.ADMIN.USERS, {
      method: 'GET',
      headers,
    });

    return handleApiResponse<AdminUser[]>(response);
  }

  /**
   * Actualiza el rol de un usuario
   */
  static async updateUserRole(userId: string, role: 'Admin' | 'Player'): Promise<AdminUser> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ role }),
    });

    return handleApiResponse<AdminUser>(response);
  }

  /**
   * Elimina un usuario
   */
  static async deleteUser(userId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`, {
      method: 'DELETE',
      headers,
    });

    await handleApiResponse<void>(response);
  }

  /**
   * Obtiene todas las solicitudes de tiendas
   */
  static async getStoreRequests(): Promise<StoreRequest[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(buildApiUrl(API_ENDPOINTS.STORES), {
      method: 'GET',
      headers,
    });

    return handleApiResponse<StoreRequest[]>(response);
  }

  /**
   * Aprueba una solicitud de tienda
   */
  static async approveStoreRequest(requestId: number): Promise<StoreRequest> {
    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.ADMIN.STORE_REQUESTS}/${requestId}/approve`),
      {
        method: 'POST',
        headers: await getAuthHeaders(),
      }
    );

    return handleApiResponse<StoreRequest>(response);
  }

  /**
   * Rechaza una solicitud de tienda
   */
  static async rejectStoreRequest(requestId: number): Promise<StoreRequest> {
    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.ADMIN.STORE_REQUESTS}/${requestId}/reject`),
      {
        method: 'POST',
        headers: await getAuthHeaders(),
      }
    );

    return handleApiResponse<StoreRequest>(response);
  }

  /**
   * Obtiene todas las solicitudes de palas
   */
  static async getRacketRequests(): Promise<RacketRequest[]> {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.RACKET_REQUESTS), {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    return handleApiResponse<RacketRequest[]>(response);
  }

  /**
   * Aprueba una solicitud de pala
   */
  static async approveRacketRequest(requestId: number): Promise<RacketRequest> {
    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.ADMIN.RACKET_REQUESTS}/${requestId}/approve`),
      {
        method: 'POST',
        headers: await getAuthHeaders(),
      }
    );

    return handleApiResponse<RacketRequest>(response);
  }

  /**
   * Rechaza una solicitud de pala
   */
  static async rejectRacketRequest(requestId: number): Promise<RacketRequest> {
    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.ADMIN.RACKET_REQUESTS}/${requestId}/reject`),
      {
        method: 'POST',
        headers: await getAuthHeaders(),
      }
    );

    return handleApiResponse<RacketRequest>(response);
  }

  /**
   * Crea una nueva pala
   */
  static async createRacket(racketData: any): Promise<any> {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.RACKETS), {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(racketData),
    });

    return handleApiResponse<any>(response);
  }

  /**
   * Actualiza una pala existente
   */
  static async updateRacket(racketId: number, racketData: any): Promise<any> {
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.RACKETS}/${racketId}`), {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(racketData),
    });

    return handleApiResponse<any>(response);
  }

  /**
   * Elimina una pala
   */
  static async deleteRacket(racketId: number): Promise<void> {
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.RACKETS}/${racketId}`), {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });

    await handleApiResponse<void>(response);
  }

  /**
   * Verifica/aprueba una tienda
   */
  static async verifyStore(storeId: string): Promise<any> {
    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.ADMIN.VERIFY_STORE(storeId), {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'verified' }),
    });

    return handleApiResponse<any>(response);
  }

  /**
   * Rechaza una solicitud de tienda
   */
  static async rejectStore(storeId: string, reason?: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.ADMIN.REJECT_STORE(storeId), {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'rejected', rejection_reason: reason || '' }),
    });

    await handleApiResponse<void>(response);
  }

  /**
   * Obtiene la actividad reciente del sistema
   */
  static async getRecentActivity(limit: number = 10): Promise<Activity[]> {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.RECENT_ACTIVITY, { limit }), {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    return handleApiResponse<Activity[]>(response);
  }

  /**
   * Obtiene la cantidad de conflictos de palas pendientes de revisión (optimizado)
   */
  static async getRacketConflictsCount(): Promise<number> {
    try {
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.ADMIN.CONFLICTS, { countOnly: 'true' }),
        {
          method: 'GET',
          headers: await getAuthHeaders(),
        }
      );

      const res = await handleApiResponse<{ count: number }>(response);
      return res?.count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Obtiene los conflictos de palas pendientes de revisión
   */
  static async getRacketConflicts(): Promise<any[]> {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.CONFLICTS), {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    return handleApiResponse<any[]>(response);
  }

  /**
   * Resuelve un conflicto de pala
   */
  static async resolveRacketConflict(
    racketId: number,
    action: 'replace' | 'reject' | 'keep_both'
  ): Promise<void> {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.RESOLVE_CONFLICT(racketId)), {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ action }),
    });

    await handleApiResponse<void>(response);
  }

  /**
   * Obtiene todas las marcas con el conteo de palas.
   * /api/v1/admin/brands no existe (backend/api fue retirado) — se agrega
   * directamente sobre `rackets`, que tiene lectura pública por RLS.
   */
  static async getBrands(): Promise<Brand[]> {
    // rackets uses English column names (brand, not marca — see
    // api/_lib/racket-mapper.ts for the full story).
    const { data, error } = await supabase.from('rackets').select('brand');
    if (error) throw error;

    // Grouped case-insensitively — the real data has casing variants of the
    // same brand (e.g. "Lok" / "LOK") that would otherwise show up as two
    // separate rows with split counts.
    const groups = groupCaseInsensitive((data ?? []).map((r: any) => r.brand));

    return Array.from(groups.values())
      .map(({ display, count }) => ({ name: display, racketCount: count }))
      .sort((a, b) => b.racketCount - a.racketCount);
  }

  /**
   * Obtiene todas las categorías (formas) con el conteo de palas.
   * Same situation as getBrands — aggregated client-side over
   * characteristics_shape instead of calling the dead REST endpoint.
   * Descriptions reused from the domain rules already authored in
   * api/comparison.ts's buildComparisonPrompt (REGLAS DE DOMINIO).
   */
  static async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('rackets').select('characteristics_shape');
    if (error) throw error;

    const groups = groupCaseInsensitive((data ?? []).map((r: any) => r.characteristics_shape));

    return Array.from(groups.values())
      .map(({ display, count }) => ({
        name: display,
        description: SHAPE_DESCRIPTIONS[display.toLowerCase()] || '',
        racketCount: count,
      }))
      .sort((a, b) => b.racketCount - a.racketCount);
  }
}

/** Groups raw string values case-insensitively, keeping the first-seen casing for display. */
function groupCaseInsensitive(values: unknown[]): Map<string, { display: string; count: number }> {
  const groups = new Map<string, { display: string; count: number }>();
  values.forEach(value => {
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw) return;
    const key = raw.toLowerCase();
    const existing = groups.get(key);
    if (existing) existing.count += 1;
    else groups.set(key, { display: raw, count: 1 });
  });
  return groups;
}

const SHAPE_DESCRIPTIONS: Record<string, string> = {
  diamante: 'Balance alto, máxima potencia. Mayor riesgo de epicondilitis.',
  redonda: 'Balance bajo, máximo control y punto dulce amplio. Ideal con lesiones.',
  lágrima: 'Polivalente, balance medio. Equilibrio entre potencia y control.',
  lagrima: 'Polivalente, balance medio. Equilibrio entre potencia y control.',
};

export interface Activity {
  id: string;
  type: 'user' | 'racket' | 'review' | 'store';
  title: string;
  time: string;
  icon: string;
}
