/**
 * WhatsSound — usePushNotifications Hook
 * Gestión de notificaciones push en el cliente
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { 
  registerPushToken, 
  getPendingNotifications, 
  markNotificationRead,
  NotificationType 
} from '../lib/push-notifications';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

interface UsePushNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  registerForPush: () => Promise<boolean>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePushNotifications(userId?: string): UsePushNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const pending = await getPendingNotifications(userId);
      setNotifications(pending.map(n => ({
        id: n.id,
        type: n.type as NotificationType,
        title: n.title,
        body: n.body,
        data: n.data,
        read: n.status === 'sent',
        createdAt: new Date(n.created_at),
      })));
      setError(null);
    } catch (e) {
      setError('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Registrar token de push
  const registerForPush = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      // Web Push API (futuro)
      console.log('[Push] Web push not implemented yet');
      return false;
    }

    try {
      // En producción: usar expo-notifications
      // import * as Notifications from 'expo-notifications';
      // const { status } = await Notifications.requestPermissionsAsync();
      // const token = (await Notifications.getExpoPushTokenAsync()).data;
      
      // Mock para desarrollo
      const mockToken = `ExponentPushToken[mock_${Date.now()}]`;
      
      if (userId) {
        const success = await registerPushToken(userId, mockToken, {
          platform: Platform.OS,
          deviceId: 'mock-device',
        });
        return success;
      }
      return false;
    } catch (e) {
      console.error('[Push] Registration error:', e);
      return false;
    }
  }, [userId]);

  // Marcar como leída
  const markAsRead = useCallback(async (id: string) => {
    const success = await markNotificationRead(id);
    if (success) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    }
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => markNotificationRead(n.id)));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [notifications]);

  // Suscripción a nuevas notificaciones en tiempo real
  useEffect(() => {
    if (!userId) return;

    loadNotifications();

    // Realtime subscription
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ws_notifications_log',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as any;
          setNotifications(prev => [{
            id: newNotif.id,
            type: newNotif.type as NotificationType,
            title: newNotif.title,
            body: newNotif.body,
            data: newNotif.data,
            read: false,
            createdAt: new Date(newNotif.created_at),
          }, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    registerForPush,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}

/**
 * Hook simple para badge de notificaciones
 */
export function useNotificationBadge(userId?: string): number {
  const { unreadCount } = usePushNotifications(userId);
  return unreadCount;
}
