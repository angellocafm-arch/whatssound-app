/**
 * WhatsSound — Push Notifications Service
 * Servicio simulado de notificaciones push
 * 
 * En producción: integrar con Expo Push Notifications
 */

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

/**
 * Registrar token de push para un usuario
 * En producción: obtener el token real de Expo
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
 * Enviar notificación a un usuario
 * En simulación: solo guarda en ws_notifications_log
 * En producción: enviaría via Expo Push API
 */
export async function sendPushNotification(
  userId: string,
  notification: PushNotification
): Promise<boolean> {
  const { error } = await supabase
    .from('ws_notifications_log')
    .insert({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      status: 'pending', // En producción sería 'sent' después de Expo
    });

  if (error) {
    console.error('[Push] Error creating notification:', error);
    return false;
  }

  console.log('[Push] Notification queued for:', userId);
  return true;
}

/**
 * Enviar notificación a múltiples usuarios
 */
export async function sendPushToMany(
  userIds: string[],
  notification: PushNotification
): Promise<number> {
  const notifications = userIds.map((userId) => ({
    user_id: userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    status: 'pending',
  }));

  const { error, count } = await supabase
    .from('ws_notifications_log')
    .insert(notifications);

  if (error) {
    console.error('[Push] Error sending to many:', error);
    return 0;
  }

  console.log('[Push] Notifications queued:', count);
  return count || userIds.length;
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
  // Obtener info del DJ
  const { data: dj } = await supabase
    .from('ws_profiles')
    .select('dj_name, display_name')
    .eq('id', djId)
    .single();

  const djName = dj?.dj_name || dj?.display_name || 'DJ';

  // Obtener seguidores del DJ
  const { data: followers } = await supabase
    .from('ws_follows')
    .select('follower_id')
    .eq('following_id', djId);

  if (!followers || followers.length === 0) {
    console.log('[Push] DJ has no followers');
    return 0;
  }

  const followerIds = followers.map((f) => f.follower_id);

  return sendPushToMany(followerIds, {
    type: 'dj_live',
    title: `${djName} está en vivo!`,
    body: `Únete a "${sessionName}" ahora`,
    data: {
      sessionId,
      djId,
      action: 'open_session',
    },
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
  if (message) {
    body += `: "${message}"`;
  }

  return sendPushNotification(djId, {
    type: 'tip_received',
    title: '¡Nueva propina! 🎉',
    body,
    data: {
      fromUser: fromUsername,
      amount: amountCents,
      action: 'open_earnings',
    },
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
    data: {
      sessionId,
      fromUser: fromUsername,
      action: 'open_chat',
    },
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
    data: {
      fromUser: fromUsername,
      totalBoosts,
      action: 'open_profile',
    },
  });
}

/**
 * Notificar que el boost semanal se regeneró (recordatorio domingo)
 * Esta función se llamaría desde un cron job
 */
export async function notifyBoostAvailable(userId: string): Promise<boolean> {
  return sendPushNotification(userId, {
    type: 'boost_available',
    title: '¡Tu Golden Boost se ha regenerado! ⭐',
    body: 'Tienes 1 boost disponible para dar a tu DJ favorito esta semana',
    data: {
      action: 'open_discover',
    },
  });
}

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
