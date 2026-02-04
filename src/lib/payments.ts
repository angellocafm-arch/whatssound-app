/**
 * WhatsSound — Payments Service
 * Servicio de pagos simulado para Revenue Ready
 * 
 * En producción: reemplazar mock por Stripe real
 */

import { supabase } from './supabase';

// Tipos
export type TransactionType = 'tip' | 'golden_boost' | 'permanent_sponsor';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  from_user_id: string;
  to_user_id: string | null;
  amount_cents: number;
  fee_cents: number;
  net_cents: number;
  metadata: {
    message?: string;
    session_id?: string;
    purchase?: boolean;
  };
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// Constantes
export const COMMISSION_RATE = 0.15; // 15% comisión WhatsSound
export const MIN_TIP_CENTS = 100;    // €1 mínimo
export const MAX_TIP_CENTS = 5000;   // €50 máximo
export const GOLDEN_BOOST_CENTS = 499;     // €4.99
export const PERMANENT_SPONSOR_CENTS = 1999; // €19.99

/**
 * Calcula la comisión y el neto
 */
export function calculateFees(amountCents: number, type: TransactionType): { fee: number; net: number } {
  if (type === 'tip') {
    const fee = Math.round(amountCents * COMMISSION_RATE);
    return { fee, net: amountCents - fee };
  }
  // Golden Boost y Permanent Sponsor: 100% para WhatsSound
  return { fee: amountCents, net: 0 };
}

/**
 * Crear una transacción de propina
 */
export async function createTip(
  fromUserId: string,
  toUserId: string,
  amountCents: number,
  message?: string,
  sessionId?: string
): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
  // Validaciones
  if (amountCents < MIN_TIP_CENTS) {
    return { success: false, error: `Mínimo €${(MIN_TIP_CENTS / 100).toFixed(2)}` };
  }
  if (amountCents > MAX_TIP_CENTS) {
    return { success: false, error: `Máximo €${(MAX_TIP_CENTS / 100).toFixed(2)}` };
  }
  if (fromUserId === toUserId) {
    return { success: false, error: 'No puedes enviarte propina a ti mismo' };
  }

  const { fee, net } = calculateFees(amountCents, 'tip');

  const { data, error } = await supabase
    .from('ws_transactions')
    .insert({
      type: 'tip',
      status: 'pending',
      from_user_id: fromUserId,
      to_user_id: toUserId,
      amount_cents: amountCents,
      fee_cents: fee,
      net_cents: net,
      metadata: {
        message: message || null,
        session_id: sessionId || null,
      },
    })
    .select()
    .single();

  if (error) {
    console.error('[Payments] Error creating tip:', error);
    return { success: false, error: 'Error al procesar la propina' };
  }

  // Log de auditoría
  await logAudit('payment_created', fromUserId, 'transaction', data.id, {
    type: 'tip',
    amount_cents: amountCents,
    to_user_id: toUserId,
  });

  return { success: true, transaction: data as Transaction };
}

/**
 * Comprar Golden Boost
 */
export async function purchaseGoldenBoost(
  userId: string
): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
  const { fee, net } = calculateFees(GOLDEN_BOOST_CENTS, 'golden_boost');

  const { data, error } = await supabase
    .from('ws_transactions')
    .insert({
      type: 'golden_boost',
      status: 'pending',
      from_user_id: userId,
      to_user_id: null, // Compra a WhatsSound
      amount_cents: GOLDEN_BOOST_CENTS,
      fee_cents: fee,
      net_cents: net,
      metadata: { purchase: true },
    })
    .select()
    .single();

  if (error) {
    console.error('[Payments] Error purchasing boost:', error);
    return { success: false, error: 'Error al procesar la compra' };
  }

  await logAudit('payment_created', userId, 'transaction', data.id, {
    type: 'golden_boost',
    amount_cents: GOLDEN_BOOST_CENTS,
  });

  return { success: true, transaction: data as Transaction };
}

/**
 * Comprar Patrocinio Permanente
 */
export async function purchasePermanentSponsor(
  fromUserId: string,
  toDjId: string,
  message?: string
): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
  const { fee, net } = calculateFees(PERMANENT_SPONSOR_CENTS, 'permanent_sponsor');

  const { data, error } = await supabase
    .from('ws_transactions')
    .insert({
      type: 'permanent_sponsor',
      status: 'pending',
      from_user_id: fromUserId,
      to_user_id: toDjId,
      amount_cents: PERMANENT_SPONSOR_CENTS,
      fee_cents: fee,
      net_cents: net,
      metadata: { message: message || null },
    })
    .select()
    .single();

  if (error) {
    console.error('[Payments] Error purchasing sponsor:', error);
    return { success: false, error: 'Error al procesar la compra' };
  }

  await logAudit('payment_created', fromUserId, 'transaction', data.id, {
    type: 'permanent_sponsor',
    amount_cents: PERMANENT_SPONSOR_CENTS,
    to_dj_id: toDjId,
  });

  return { success: true, transaction: data as Transaction };
}

/**
 * Confirmar pago (llamado desde Admin Simulator)
 */
export async function confirmPayment(
  transactionId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: tx, error: fetchError } = await supabase
    .from('ws_transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (fetchError || !tx) {
    return { success: false, error: 'Transacción no encontrada' };
  }

  if (tx.status !== 'pending') {
    return { success: false, error: 'La transacción ya fue procesada' };
  }

  // Actualizar estado
  const { error: updateError } = await supabase
    .from('ws_transactions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', transactionId);

  if (updateError) {
    return { success: false, error: 'Error al confirmar el pago' };
  }

  // Efectos secundarios según tipo
  if (tx.type === 'golden_boost' && tx.metadata?.purchase) {
    // Añadir boost al usuario
    await supabase.rpc('increment_golden_boost', { user_id: tx.from_user_id });
  }

  if (tx.type === 'permanent_sponsor' && tx.to_user_id) {
    // Crear registro de patrocinador permanente
    await supabase.from('ws_golden_boost_permanent').insert({
      from_user_id: tx.from_user_id,
      to_dj_id: tx.to_user_id,
      message: tx.metadata?.message || null,
      amount_cents: tx.amount_cents,
    });

    // Incrementar contador del DJ
    await supabase
      .from('ws_profiles')
      .update({ permanent_sponsors_count: supabase.sql`permanent_sponsors_count + 1` })
      .eq('id', tx.to_user_id);
  }

  // Crear notificación para el destinatario (si hay)
  if (tx.to_user_id) {
    await createPaymentNotification(tx);
  }

  await logAudit('payment_confirmed', null, 'transaction', transactionId, {
    type: tx.type,
    amount_cents: tx.amount_cents,
  });

  return { success: true };
}

/**
 * Fallar pago (llamado desde Admin Simulator)
 */
export async function failPayment(
  transactionId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('ws_transactions')
    .update({
      status: 'failed',
      metadata: supabase.sql`metadata || '{"failure_reason": "${reason}"}'::jsonb`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', transactionId)
    .eq('status', 'pending');

  if (error) {
    return { success: false, error: 'Error al marcar como fallido' };
  }

  await logAudit('payment_failed', null, 'transaction', transactionId, { reason });

  return { success: true };
}

/**
 * Obtener transacciones pendientes (para Admin Simulator)
 */
export async function getPendingTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('ws_transactions')
    .select(`
      *,
      from_user:from_user_id(id, username, display_name, avatar_url),
      to_user:to_user_id(id, username, display_name, avatar_url, dj_name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Payments] Error fetching pending:', error);
    return [];
  }

  return data as Transaction[];
}

/**
 * Crear notificación de pago recibido
 */
async function createPaymentNotification(tx: any) {
  const { data: fromUser } = await supabase
    .from('ws_profiles')
    .select('username, display_name')
    .eq('id', tx.from_user_id)
    .single();

  const username = fromUser?.username || 'Alguien';
  const amount = (tx.amount_cents / 100).toFixed(2);

  let title = '';
  let body = '';
  let type: 'tip_received' | 'golden_boost_received' = 'tip_received';

  if (tx.type === 'tip') {
    title = '¡Nueva propina! 🎉';
    body = `@${username} te envió €${amount}`;
    if (tx.metadata?.message) {
      body += `: "${tx.metadata.message}"`;
    }
    type = 'tip_received';
  } else if (tx.type === 'permanent_sponsor') {
    title = '¡Nuevo patrocinador permanente! 💎';
    body = `@${username} se convirtió en tu patrocinador`;
    type = 'tip_received';
  }

  await supabase.from('ws_notifications_log').insert({
    user_id: tx.to_user_id,
    type,
    title,
    body,
    data: {
      transaction_id: tx.id,
      from_user: username,
      amount_cents: tx.amount_cents,
    },
  });
}

/**
 * Log de auditoría
 */
async function logAudit(
  action: string,
  userId: string | null,
  resourceType: string,
  resourceId: string,
  metadata: any
) {
  await supabase.from('ws_audit_log').insert({
    action,
    user_id: userId,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
  });
}

/**
 * Formatear centavos a euros
 */
export function formatCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}
