import { API_ENDPOINTS, API_URL } from '../config/api';

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

const analyticsService = {
  async trackEvent(storeId: string, event: 'view' | 'click'): Promise<void> {
    try {
      await fetch(`${API_URL}${API_ENDPOINTS.ANALYTICS_TRACK}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId, event }),
      });
    } catch {
      // silently fail — analytics shouldn't break the page
    }
  },

  async fetchTimeline(
    storeId: string,
    token: string,
    period: '7d' | '30d' | '90d' = '30d'
  ): Promise<TimelineResponse> {
    const res = await fetch(
      `${API_URL}${API_ENDPOINTS.ANALYTICS_TIMELINE(storeId)}?period=${period}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch analytics' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  },
};

export default analyticsService;
