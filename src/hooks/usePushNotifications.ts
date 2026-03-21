/**
 * WhatsSound — usePushNotifications Hook
 * Gestión de notificaciones push en el cliente
 * 
 * Al montar: obtiene token real de Expo (nativo) o null (web)
 * y lo registra en ws_push_tokens via Supabase.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { 
  getExpoPushToken,
  registerPushToken,
  deactivatePushToken,
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
  pushToken: string | null;
  pushPermission: 'granted' | 'denied' | 'undetermined' | null;
  registerForPush: () => Promise<boolean>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePushNotifications(userId?: string): UsePushNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [pushPermission, setPushPermission] = useState<'granted' | 'denied' | 'undetermined' | null>(null);
  const registeredRef = useRef(false);

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

  // Registrar token de push (real)
  const registerForPush = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Obtener token real de Expo (null en web)
      const token = await getExpoPushToken();
      
      if (!token) {
        // Web o permisos denegados — no es un error, simplemente no aplica
        if (Platform.OS === 'web') {
          setPushPermission('undetermined');
        } else {
          setPushPermission('denied');
        }
        return false;
      }

      setPushToken(token);
      setPushPermission('granted');

      // Registrar en BD
      const success = await registerPushToken(userId, token, {
        platform: Platform.OS,
        registeredAt: new Date().toISOString(),
      });

      if (success) {
        console.log('[Push] Token registered for user:', userId);
      }

      return success;
    } catch (e) {
      console.error('[Push] Registration error:', e);
      setError('Error al registrar notificaciones push');
      return false;
    }
  }, [userId]);

  // Auto-registrar al montar (una sola vez por userId)
  useEffect(() => {
    if (!userId || registeredRef.current) return;
    registeredRef.current = true;
    registerForPush();
  }, [userId, registerForPush]);

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

          // Mostrar notificación local si la app está en primer plano (nativo)
          if (Platform.OS !== 'web') {
            showLocalNotification(newNotif.title, newNotif.body);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadNotifications]);

  // Limpiar token al desmontar (no desactivar — podría ser unmount temporal)
  // La desactivación real se hace en logout

  return {
    notifications,
    unreadCount,
    loading,
    error,
    pushToken,
    pushPermission,
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

/**
 * Mostrar notificación local cuando la app está en primer plano (nativo)
 */
async function showLocalNotification(title: string, body: string) {
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: null, // Inmediata
    });
  } catch {
    // expo-notifications no disponible — ignorar silenciosamente
  }
}
