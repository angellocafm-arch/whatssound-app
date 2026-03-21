/**
 * WhatsSound — Push Notifications Service
 * Integra con Expo Push Notifications (nativo) y fallback DB-only (web)
 * 
 * Requisitos nativos (instalar solo para builds iOS/Android):
 *   npx expo install expo-notifications expo-device expo-constants
 * 
 * En web: solo guarda en ws_notifications_log (sin push real)
 */

import { Platform } from 'react-native';
import { supabase } from './supabase';

export type NotificationType = 
  | 'dj_live' 
  | 'tip_received' 
  | 'mention' 
  | 'golden_boost_received' 
  | 'boost_available';

interface PushNotification {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// ========================================
// EXPO PUSH TOKEN (nativo only)
// ========================================

/**
 * Obtener el Expo Push Token real del dispositivo.
 * Retorna null en web o si los paquetes nativos no están instalados.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('[Push] Web platform — push tokens not supported');
    return null;
  }

  try {
    // Dynamic imports — solo se cargan en nativo
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');
    const Constants = await import('expo-constants');

    // Verificar que es un dispositivo físico
    if (!Device.isDevice) {
      console.warn('[Push] Push notifications require a physical device');
      return null;
    }

    // Solicitar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Push notification permissions denied');
      return null;
    }

    // Obtener el token
    const projectId = Constants.default?.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      ...(projectId ? { projectId } : {}),
    });

    console.log('[Push] Got Expo push token:', tokenData.data);

    // Configurar canal de notificaciones en Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'WhatsSound',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
      });
    }

    return tokenData.data;
  } catch (e) {
    // expo-notifications no instalado o error — graceful fallback
    console.warn('[Push] Could not get push token (native modules not available):', e);
    return null;
  }
}

// ========================================
// REGISTRO DE TOKEN EN BD
// ========================================

/**
 * Registrar token de push para un usuario en ws_push_tokens
 */
export async function registerPushToken(
  userId: string,
  token: string,
  deviceInfo?: Record<string, any>
): Promise<boolean> {
  const { error } = await supabase
    .from('ws_push_tokens')
    .upsert({
      user_id: userId,
      expo_push_token: token,
      device_info: deviceInfo || {},
      is_active: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,expo_push_token',
    });

  if (error) {
    console.error('[Push] Error registering token:', error);
    return false;
  }

  return true;
}

/**
 * Desactivar un push token (logout, permisos revocados)
 */
export async function deactivatePushToken(
  userId: string,
  token: string
): Promise<boolean> {
  const { error } = await supabase
    .from('ws_push_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('expo_push_token', token);

  return !error;
}

// ========================================
// ENVIAR PUSH VIA EXPO PUSH API
// ========================================

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

/**
 * Enviar push notification real via Expo Push API
 * Funciona server-side y client-side (no requiere API key)
 */
async function sendExpoPush(messages: ExpoPushMessage[]): Promise<boolean> {
  if (messages.length === 0) return true;

  try {
    // Expo acepta batches de hasta 100
    const chunks: ExpoPushMessage[][] = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        console.error('[Push] Expo API error:', response.status, await response.text());
        return false;
      }
    }

    return true;
  } catch (e) {
    console.error('[Push] Error sending via Expo Push API:', e);
    return false;
  }
}

// ========================================
// ENVIAR NOTIFICACIONES (BD + PUSH)
// ========================================

/**
 * Enviar notificación a un usuario.
 * 1. Guarda en ws_notifications_log
 * 2. Busca tokens activos del usuario
 * 3. Envía push real via Expo API
 */
export async function sendPushNotification(
  userId: string,
  notification: PushNotification
): Promise<boolean> {
  // 1. Guardar en BD
  const { error: logError } = await supabase
    .from('ws_notifications_log')
    .insert({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      status: 'pending',
    });

  if (logError) {
    console.error('[Push] Error creating notification log:', logError);
    return false;
  }

  // 2. Obtener tokens activos del usuario
  const { data: tokens } = await supabase
    .from('ws_push_tokens')
    .select('expo_push_token')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!tokens || tokens.length === 0) {
    // No tiene tokens registrados — notificación queda en BD
    return true;
  }

  // 3. Enviar push real
  const messages: ExpoPushMessage[] = tokens.map(t => ({
    to: t.expo_push_token,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    sound: 'default' as const,
    channelId: 'default',
  }));

  const sent = await sendExpoPush(messages);

  // Actualizar estado en BD
  if (sent) {
    await supabase
      .from('ws_notifications_log')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);
  }

  return sent;
}

/**
 * Enviar notificación a múltiples usuarios
 */
export async function sendPushToMany(
  userIds: string[],
  notification: PushNotification
): Promise<number> {
  if (userIds.length === 0) return 0;

  // 1. Guardar todas en BD
  const notifications = userIds.map((userId) => ({
    user_id: userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    status: 'pending',
  }));

  const { error } = await supabase
    .from('ws_notifications_log')
    .insert(notifications);

  if (error) {
    console.error('[Push] Error sending to many:', error);
    return 0;
  }

  // 2. Obtener tokens activos de todos los usuarios
  const { data: tokens } = await supabase
    .from('ws_push_tokens')
    .select('expo_push_token')
    .in('user_id', userIds)
    .eq('is_active', true);

  if (tokens && tokens.length > 0) {
    const messages: ExpoPushMessage[] = tokens.map(t => ({
      to: t.expo_push_token,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sound: 'default' as const,
      channelId: 'default',
    }));

    await sendExpoPush(messages);
  }

  return userIds.length;
}

// ========================================
// TRIGGERS DE NOTIFICACIÓN
// ========================================

/**
 * Notificar a seguidores que un DJ inició sesión
 */
export async function notifyDJLive(
  djId: string,
  sessionId: string,
  sessionName: string
): Promise<number> {
  const { data: dj } = await supabase
    .from('ws_profiles')
    .select('dj_name, display_name')
    .eq('id', djId)
    .single();

  const djName = dj?.dj_name || dj?.display_name || 'DJ';

  const { data: followers } = await supabase
    .from('ws_follows')
    .select('follower_id')
    .eq('following_id', djId);

  if (!followers || followers.length === 0) return 0;

  const followerIds = followers.map((f) => f.follower_id);

  return sendPushToMany(followerIds, {
    type: 'dj_live',
    title: `${djName} está en vivo!`,
    body: `Únete a "${sessionName}" ahora`,
    data: { sessionId, djId, action: 'open_session' },
  });
}

/**
 * Notificar al DJ que recibió una propina
 */
export async function notifyTipReceived(
  djId: string,
  fromUsername: string,
  amountCents: number,
  message?: string
): Promise<boolean> {
  const amount = (amountCents / 100).toFixed(2);
  let body = `@${fromUsername} te envió €${amount}`;
  if (message) body += `: "${message}"`;

  return sendPushNotification(djId, {
    type: 'tip_received',
    title: '¡Nueva propina! 🎉',
    body,
    data: { fromUser: fromUsername, amount: amountCents, action: 'open_earnings' },
  });
}

/**
 * Notificar a un usuario que fue mencionado en el chat
 */
export async function notifyMention(
  userId: string,
  sessionId: string,
  fromUsername: string,
  messagePreview: string
): Promise<boolean> {
  return sendPushNotification(userId, {
    type: 'mention',
    title: 'Te mencionaron en el chat',
    body: `@${fromUsername}: "${messagePreview}"`,
    data: { sessionId, fromUser: fromUsername, action: 'open_chat' },
  });
}

/**
 * Notificar al DJ que recibió un Golden Boost
 */
export async function notifyGoldenBoostReceived(
  djId: string,
  fromUsername: string,
  totalBoosts: number
): Promise<boolean> {
  return sendPushNotification(djId, {
    type: 'golden_boost_received',
    title: '¡Recibiste un Golden Boost! 🏆',
    body: `@${fromUsername} te dio su Golden Boost`,
    data: { fromUser: fromUsername, totalBoosts, action: 'open_profile' },
  });
}

/**
 * Notificar que el boost semanal se regeneró
 */
export async function notifyBoostAvailable(userId: string): Promise<boolean> {
  return sendPushNotification(userId, {
    type: 'boost_available',
    title: '¡Tu Golden Boost se ha regenerado! ⭐',
    body: 'Tienes 1 boost disponible para dar a tu DJ favorito esta semana',
    data: { action: 'open_discover' },
  });
}

// ========================================
// CONSULTAS
// ========================================

/**
 * Obtener notificaciones pendientes de un usuario
 */
export async function getPendingNotifications(userId: string) {
  const { data, error } = await supabase
    .from('ws_notifications_log')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[Push] Error fetching notifications:', error);
    return [];
  }

  return data || [];
}

/**
 * Marcar notificación como leída
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('ws_notifications_log')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', notificationId);

  return !error;
}
