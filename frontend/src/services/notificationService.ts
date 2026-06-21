import { supabase } from '../lib/supabase';
import { Notification, NotificationFilters } from '../types/notification';

export class NotificationService {
  static async fetchNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit ?? 50)) - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Notification[];
  }

  static async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  static async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw new Error(error.message);
    return true;
  }

  static async markAllAsRead(): Promise<number> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)
      .select('id');

    if (error) throw new Error(error.message);
    return data?.length ?? 0;
  }

  static async createNotification(
    type: string,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<Notification | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: session.user.id,
        type,
        title,
        message,
        data: data ?? {},
        is_read: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return notification as Notification;
  }

  static async deleteNotification(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw new Error(error.message);
    return true;
  }

  // No-op: kept for backward compat (localStorage cache removed)
  static clearLocalStorage(): void {}
}
