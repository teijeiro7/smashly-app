import { API_URL } from '../config/api';
import { supabase } from '../lib/supabase';

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
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
