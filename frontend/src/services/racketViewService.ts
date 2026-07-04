import { supabase } from '../lib/supabase';

export interface RecentlyViewedRacket {
  id: number;
  nombre: string;
  marca: string;
  imagenes?: string[];
  precio_actual?: number;
  viewed_at: string;
}

export class RacketViewService {
  static async recordView(racketId: number): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('racket_views')
      .upsert(
        { user_id: session.user.id, racket_id: racketId, viewed_at: new Date().toISOString() },
        { onConflict: 'user_id,racket_id' }
      );

    if (error) throw new Error(error.message);
  }

  static async getRecentlyViewed(limit: number = 10): Promise<RecentlyViewedRacket[]> {
    const { data, error } = await supabase
      .from('racket_views')
      .select('viewed_at, racket:rackets(id, nombre, marca, imagenes, precio_actual)')
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return (data ?? [])
      .map((row: any) => ({
        ...row.racket,
        viewed_at: row.viewed_at,
      }))
      .filter((r: any) => r.id) as RecentlyViewedRacket[];
  }

  static async removeView(racketId: number): Promise<void> {
    const { error } = await supabase
      .from('racket_views')
      .delete()
      .eq('racket_id', racketId);

    if (error) throw new Error(error.message);
  }

  static async clearHistory(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('racket_views')
      .delete()
      .eq('user_id', session.user.id);

    if (error) throw new Error(error.message);
  }
}
