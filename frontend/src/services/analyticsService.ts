import { API_URL } from '../config/api';
import { supabase } from '../lib/supabase';

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

export interface TimelinePoint {
  date: string;
  views: number;
  clicks: number;
}

export interface TimelineResponse {
  period: string;
  current: TimelinePoint[];
  previous: TimelinePoint[];
}

export async function trackEvent(storeId: string, event: 'view' | 'click'): Promise<void> {
  try {
    const token = await getToken();
    await fetch(`${API_URL}/api/v1/analytics/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ store_id: storeId, event }),
    });
  } catch {
    // silently fail — analytics shouldn't break the page
  }
}

export async function fetchAnalyticsTimeline(
  storeId: string,
  token: string,
  period: '7d' | '30d' | '90d' = '30d',
): Promise<TimelineResponse> {
  const res = await fetch(`${API_URL}/api/v1/analytics/store/${storeId}/timeline?period=${period}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch analytics' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}
