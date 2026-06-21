import React, { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Notification } from '../types/notification';
import { NotificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  incrementUnreadCount: () => void;
  addNotification: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  return context;
};

interface NotificationProviderProps { children: ReactNode }

const QUERY_KEY = ['notifications'];

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, error, refetch } = useQuery<Notification[], Error>({
    queryKey: QUERY_KEY,
    queryFn: () => NotificationService.fetchNotifications({ limit: 50 }),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchInterval: isAuthenticated ? 60_000 : false,
    refetchIntervalInBackground: false,
  });

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.is_read).length,
    [notifications]
  );

  const fetchNotifications = useCallback(async () => { await refetch(); }, [refetch]);
  const fetchUnreadCount = useCallback(async () => { await refetch(); }, [refetch]);

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => NotificationService.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      queryClient.setQueryData<Notification[]>(QUERY_KEY, old =>
        (old ?? []).map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => NotificationService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      queryClient.setQueryData<Notification[]>(QUERY_KEY, old =>
        (old ?? []).map(n => ({ ...n, is_read: true }))
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => NotificationService.deleteNotification(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      queryClient.setQueryData<Notification[]>(QUERY_KEY, old =>
        (old ?? []).filter(n => n.id !== id)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const markAsRead = useCallback(async (id: string) => {
    await markAsReadMutation.mutateAsync(id);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    await markAllAsReadMutation.mutateAsync();
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const incrementUnreadCount = useCallback(() => {
    // No-op: unreadCount derived from notifications data
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    queryClient.setQueryData<Notification[]>(QUERY_KEY, old =>
      [notification, ...(old ?? [])]
    );
  }, [queryClient]);

  const value = useMemo<NotificationContextType>(() => ({
    notifications,
    unreadCount,
    loading: isLoading,
    error: error ? error.message : null,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    incrementUnreadCount,
    addNotification,
  }), [
    notifications, unreadCount, isLoading, error,
    fetchNotifications, fetchUnreadCount,
    markAsRead, markAllAsRead, deleteNotification,
    incrementUnreadCount, addNotification,
  ]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
