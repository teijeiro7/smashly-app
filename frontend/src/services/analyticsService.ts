import { API_URL } from '../config/api';

export async function trackEvent(storeId: string, event: 'view' | 'click'): Promise<void> {
  try {
    await fetch(`${API_URL}/api/v1/analytics/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_id: storeId, event }),
    });
  } catch {
    // silently fail — analytics shouldn't break the page
  }
}
