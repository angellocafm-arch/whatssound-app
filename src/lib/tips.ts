/**
 * WhatsSound — Tips/Propinas System
 * 
 * MODO TEST (default): Todo funciona pero sin dinero real.
 * - Las propinas se guardan en ws_tips con status='test'
 * - Se muestran en el dashboard igual que las reales
 * - Aparecen monedas y números, pero no hay transacción bancaria
 * 
 * MODO PRODUCCIÓN (cuando se conecte pasarela real):
 * - status='pending' → stripe/paypal → status='completed'
 * - Comisión 13% WhatsSound (configurable)
 * 
 * La arquitectura está preparada para activar pagos reales
 * solo cambiando PAYMENTS_ENABLED a true y conectando Stripe.
 */

import { supabase } from './supabase';
import { isTestMode, getTestUserName, getOrCreateTestUser } from './demo';

// ─── Configuration ─────────────────────────────────────────

// Feature flag: cambiar a true para activar pagos reales
export const PAYMENTS_ENABLED = false;

// Comisión WhatsSound (13% por defecto)
export const PLATFORM_FEE_PERCENT = 0.13;

// Mínimo y máximo para propinas
export const TIP_MIN = 1;
export const TIP_MAX = 500;

// Amounts predefinidos
export const TIP_AMOUNTS = [1, 2, 5, 10, 20, 50];

// ─── Types ─────────────────────────────────────────────────

export interface Tip {
  id: string;
  sender_id: string;
  receiver_id: string;
  session_id?: string;
  song_id?: string;
  amount: number;
  message?: string;
  status: 'test' | 'pending' | 'completed' | 'failed' | 'refunded';
  payment_intent_id?: string;
  platform_fee: number;
  net_amount: number;
  is_anonymous: boolean;
  created_at: string;
}

export interface SendTipParams {
  receiverId: string;      // DJ id
  sessionId?: string;      // sesión actual
  songId?: string;         // canción (sube en cola)
  amount: number;
  message?: string;
  isAnonymous?: boolean;
}

export interface TipResult {
  ok: boolean;
  tip?: Tip;
  error?: string;
}

// ─── Send Tip ──────────────────────────────────────────────

export async function sendTip(params: SendTipParams): Promise<TipResult> {
  const { receiverId, sessionId, songId, amount, message, isAnonymous = false } = params;

  // Validaciones
  if (amount < TIP_MIN) {
    return { ok: false, error: `Mínimo €${TIP_MIN}` };
  }
  if (amount > TIP_MAX) {
    return { ok: false, error: `Máximo €${TIP_MAX}` };
  }

  // Obtener sender (usuario actual)
  let senderId: string;
  
  if (isTestMode()) {
    const testProfile = await getOrCreateTestUser();
    if (!testProfile) {
      return { ok: false, error: 'No se pudo obtener el usuario de prueba' };
    }
    senderId = testProfile.id;
  } else {
    // En producción, obtener del auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: 'Debes iniciar sesión para enviar propinas' };
    }
    senderId = user.id;
  }

  // Calcular comisión y neto
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT * 100) / 100;
  const netAmount = Math.round((amount - platformFee) * 100) / 100;

  // Determinar status según modo
  let status: Tip['status'] = 'test';
  
  if (PAYMENTS_ENABLED) {
    // En producción: procesar pago real
    // TODO: Integrar Stripe/PayPal aquí
    // const paymentResult = await processStripePayment(amount, senderId);
    // if (!paymentResult.ok) return { ok: false, error: paymentResult.error };
    // status = 'completed';
    // paymentIntentId = paymentResult.intentId;
    status = 'pending'; // Por ahora queda pendiente hasta integrar Stripe
  }

  // Insertar en base de datos
  const tipData = {
    sender_id: senderId,
    receiver_id: receiverId,
    session_id: sessionId || null,
    song_id: songId || null,
    amount,
    message: message || null,
    status,
    platform_fee: platformFee,
    net_amount: netAmount,
    is_anonymous: isAnonymous,
    is_seed: false,
  };

  const { data, error } = await supabase
    .from('ws_tips')
    .insert(tipData)
    .select()
    .single();

  if (error) {
    console.error('Error sending tip:', error);
    return { ok: false, error: 'Error al enviar la propina. Inténtalo de nuevo.' };
  }

  // Si hay canción asociada, incrementar su prioridad/votos
  if (songId) {
    await boostSongPriority(songId, amount);
  }

  return { ok: true, tip: data as Tip };
}

// ─── Boost Song Priority ───────────────────────────────────

async function boostSongPriority(songId: string, amount: number) {
  // Cada €1 = 1 voto extra
  const boostVotes = Math.floor(amount);
  
  const { error } = await supabase.rpc('boost_song_votes', {
    p_song_id: songId,
    p_votes: boostVotes,
  });

  if (error) {
    // Fallback: incrementar directamente
    await supabase
      .from('ws_songs')
      .update({ boost_votes: boostVotes })
      .eq('id', songId);
  }
}

// ─── Get User Tips ─────────────────────────────────────────

export async function getUserTipsSent(userId: string, limit = 20): Promise<Tip[]> {
  const { data, error } = await supabase
    .from('ws_tips')
    .select(`
      *,
      receiver:ws_profiles!receiver_id(display_name, dj_name, avatar_url),
      session:ws_sessions!session_id(name),
      song:ws_songs!song_id(title, artist)
    `)
    .eq('sender_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching sent tips:', error);
    return [];
  }
  return data as Tip[];
}

export async function getUserTipsReceived(userId: string, limit = 20): Promise<Tip[]> {
  const { data, error } = await supabase
    .from('ws_tips')
    .select(`
      *,
      sender:ws_profiles!sender_id(display_name, avatar_url),
      session:ws_sessions!session_id(name),
      song:ws_songs!song_id(title, artist)
    `)
    .eq('receiver_id', userId)
    .in('status', ['test', 'completed'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching received tips:', error);
    return [];
  }
  return data as Tip[];
}

// ─── Get DJ Balance ────────────────────────────────────────

export async function getDJBalance(djId: string): Promise<{
  total: number;
  available: number;
  pending: number;
  thisMonth: number;
}> {
  const { data: tips, error } = await supabase
    .from('ws_tips')
    .select('amount, net_amount, status, created_at')
    .eq('receiver_id', djId)
    .in('status', ['test', 'completed']);

  if (error || !tips) {
    return { total: 0, available: 0, pending: 0, thisMonth: 0 };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const total = tips.reduce((sum, t) => sum + Number(t.net_amount), 0);
  const available = tips
    .filter(t => t.status === 'completed' || t.status === 'test')
    .reduce((sum, t) => sum + Number(t.net_amount), 0);
  const pending = tips
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.net_amount), 0);
  const thisMonth = tips
    .filter(t => new Date(t.created_at) >= monthStart)
    .reduce((sum, t) => sum + Number(t.net_amount), 0);

  return {
    total: Math.round(total * 100) / 100,
    available: Math.round(available * 100) / 100,
    pending: Math.round(pending * 100) / 100,
    thisMonth: Math.round(thisMonth * 100) / 100,
  };
}

// ─── Get Session Tips ──────────────────────────────────────

export async function getSessionTips(sessionId: string): Promise<{
  total: number;
  count: number;
  topTippers: Array<{ name: string; amount: number }>;
}> {
  const { data: tips, error } = await supabase
    .from('ws_tips')
    .select(`
      amount,
      is_anonymous,
      sender:ws_profiles!sender_id(display_name)
    `)
    .eq('session_id', sessionId)
    .in('status', ['test', 'completed']);

  if (error || !tips) {
    return { total: 0, count: 0, topTippers: [] };
  }

  const total = tips.reduce((sum, t) => sum + Number(t.amount), 0);
  
  // Agrupar por sender
  const tipperMap = new Map<string, number>();
  tips.forEach((t: any) => {
    const name = t.is_anonymous ? 'Anónimo' : (t.sender?.display_name || 'Usuario');
    tipperMap.set(name, (tipperMap.get(name) || 0) + Number(t.amount));
  });

  const topTippers = Array.from(tipperMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    total: Math.round(total * 100) / 100,
    count: tips.length,
    topTippers,
  };
}

// ─── Realtime Subscription ─────────────────────────────────

export function subscribeToDJTips(
  djId: string,
  callback: (tip: Tip) => void
): () => void {
  const channel = supabase
    .channel(`tips:${djId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ws_tips',
        filter: `receiver_id=eq.${djId}`,
      },
      (payload) => {
        callback(payload.new as Tip);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Payment Status Check ──────────────────────────────────

export function getPaymentStatus(): {
  enabled: boolean;
  mode: 'test' | 'production';
  message: string;
} {
  return {
    enabled: PAYMENTS_ENABLED,
    mode: PAYMENTS_ENABLED ? 'production' : 'test',
    message: PAYMENTS_ENABLED
      ? 'Pagos reales activados'
      : 'Modo demo: las propinas se registran pero no hay transacción real',
  };
}
