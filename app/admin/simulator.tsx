/**
 * WhatsSound — Admin Simulator
 * Simula plataformas externas (Stripe, Push) para demo
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import { supabase } from '../../src/lib/supabase';
import { confirmPayment, failPayment, formatCents } from '../../src/lib/payments';

type Tab = 'payments' | 'push' | 'log';

interface PendingTransaction {
  id: string;
  type: 'tip' | 'golden_boost' | 'permanent_sponsor';
  status: string;
  amount_cents: number;
  fee_cents: number;
  net_cents: number;
  metadata: any;
  created_at: string;
  from_user: { username: string; display_name: string } | null;
  to_user: { username: string; display_name: string; dj_name?: string } | null;
}

interface PendingNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  status: string;
  created_at: string;
  user: { username: string; display_name: string } | null;
}

interface AuditEntry {
  id: string;
  action: string;
  metadata: any;
  created_at: string;
}

export default function SimulatorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('payments');
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Data
  const [pendingPayments, setPendingPayments] = useState<PendingTransaction[]>([]);
  const [pendingPush, setPendingPush] = useState<PendingNotification[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const loadData = useCallback(async () => {
    // Cargar pagos pendientes
    const { data: payments } = await supabase
      .from('ws_transactions')
      .select(`
        *,
        from_user:from_user_id(username, display_name),
        to_user:to_user_id(username, display_name, dj_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    setPendingPayments(payments || []);

    // Cargar push pendientes
    const { data: notifications } = await supabase
      .from('ws_notifications_log')
      .select(`
        *,
        user:user_id(username, display_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    setPendingPush(notifications || []);

    // Cargar audit log
    const { data: audit } = await supabase
      .from('ws_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    setAuditLog(audit || []);
  }, []);

  useEffect(() => {
    loadData();
    
    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel('simulator-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ws_transactions' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ws_notifications_log' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleConfirmPayment = async (id: string) => {
    setProcessing(id);
    const result = await confirmPayment(id);
    setProcessing(null);
    
    if (result.success) {
      Alert.alert('✅ Pago confirmado', 'La transacción ha sido procesada');
      loadData();
    } else {
      Alert.alert('Error', result.error || 'No se pudo confirmar');
    }
  };

  const handleFailPayment = async (id: string) => {
    Alert.alert(
      '❌ Simular Fallo',
      'Selecciona la razón:',
      [
        { text: 'Tarjeta rechazada', onPress: () => doFailPayment(id, 'card_declined') },
        { text: 'Fondos insuficientes', onPress: () => doFailPayment(id, 'insufficient_funds') },
        { text: 'Error de red', onPress: () => doFailPayment(id, 'network_error') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const doFailPayment = async (id: string, reason: string) => {
    setProcessing(id);
    const result = await failPayment(id, reason);
    setProcessing(null);
    
    if (result.success) {
      Alert.alert('❌ Pago fallido', `Marcado como fallido: ${reason}`);
      loadData();
    }
  };

  const handleMarkPushSent = async (id: string) => {
    setProcessing(id);
    
    await supabase
      .from('ws_notifications_log')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', id);
    
    setProcessing(null);
    loadData();
  };

  const handleSendAllPush = async () => {
    const ids = pendingPush.map(p => p.id);
    
    await supabase
      .from('ws_notifications_log')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .in('id', ids);
    
    Alert.alert('📤 Enviadas', `${ids.length} notificaciones marcadas como enviadas`);
    loadData();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'tip': return '💸 PROPINA';
      case 'golden_boost': return '⭐ GOLDEN BOOST';
      case 'permanent_sponsor': return '💎 PATROCINIO';
      case 'dj_live': return '📺 DJ EN VIVO';
      case 'tip_received': return '💰 PROPINA RECIBIDA';
      case 'mention': return '💬 MENCIÓN';
      case 'golden_boost_received': return '⭐ BOOST RECIBIDO';
      default: return type;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    return `hace ${hours}h`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>🎛️ Simulador</Text>
        <Pressable onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingPayments.length}</Text>
          <Text style={styles.statLabel}>💳 Pagos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingPush.length}</Text>
          <Text style={styles.statLabel}>🔔 Push</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
          onPress={() => setActiveTab('payments')}
        >
          <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
            💳 Pagos
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'push' && styles.tabActive]}
          onPress={() => setActiveTab('push')}
        >
          <Text style={[styles.tabText, activeTab === 'push' && styles.tabTextActive]}>
            🔔 Push
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'log' && styles.tabActive]}
          onPress={() => setActiveTab('log')}
        >
          <Text style={[styles.tabText, activeTab === 'log' && styles.tabTextActive]}>
            📋 Log
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Tab: Pagos */}
        {activeTab === 'payments' && (
          <View style={styles.section}>
            {pendingPayments.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>💳</Text>
                <Text style={styles.emptyText}>No hay pagos pendientes</Text>
              </View>
            ) : (
              pendingPayments.map((tx) => (
                <View key={tx.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardType}>{getTypeLabel(tx.type)}</Text>
                    <Text style={styles.cardTime}>{getTimeAgo(tx.created_at)}</Text>
                  </View>
                  
                  <Text style={styles.cardUsers}>
                    De: @{tx.from_user?.username || '?'} → Para: {tx.to_user?.dj_name || tx.to_user?.username || 'WhatsSound'}
                  </Text>
                  
                  <View style={styles.cardAmounts}>
                    <Text style={styles.cardAmount}>
                      Monto: {formatCents(tx.amount_cents)}
                    </Text>
                    <Text style={styles.cardFee}>
                      Comisión: {formatCents(tx.fee_cents)}
                    </Text>
                    <Text style={styles.cardNet}>
                      Neto: {formatCents(tx.net_cents)}
                    </Text>
                  </View>
                  
                  {tx.metadata?.message && (
                    <Text style={styles.cardMessage}>"{tx.metadata.message}"</Text>
                  )}
                  
                  <View style={styles.cardActions}>
                    <Pressable
                      style={[styles.actionButton, styles.confirmButton]}
                      onPress={() => handleConfirmPayment(tx.id)}
                      disabled={processing === tx.id}
                    >
                      {processing === tx.id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.actionText}>✅ Confirmar</Text>
                      )}
                    </Pressable>
                    <Pressable
                      style={[styles.actionButton, styles.failButton]}
                      onPress={() => handleFailPayment(tx.id)}
                      disabled={processing === tx.id}
                    >
                      <Text style={styles.actionText}>❌ Fallar</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab: Push */}
        {activeTab === 'push' && (
          <View style={styles.section}>
            {pendingPush.length > 0 && (
              <Pressable style={styles.sendAllButton} onPress={handleSendAllPush}>
                <Text style={styles.sendAllText}>📤 Enviar TODAS ({pendingPush.length})</Text>
              </Pressable>
            )}
            
            {pendingPush.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🔔</Text>
                <Text style={styles.emptyText}>No hay push pendientes</Text>
              </View>
            ) : (
              pendingPush.map((notif) => (
                <View key={notif.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardType}>{getTypeLabel(notif.type)}</Text>
                    <Text style={styles.cardTime}>{getTimeAgo(notif.created_at)}</Text>
                  </View>
                  
                  <Text style={styles.cardUsers}>
                    Para: @{notif.user?.username || '?'}
                  </Text>
                  
                  <Text style={styles.pushTitle}>{notif.title}</Text>
                  <Text style={styles.pushBody}>{notif.body}</Text>
                  
                  <Pressable
                    style={[styles.actionButton, styles.sendButton]}
                    onPress={() => handleMarkPushSent(notif.id)}
                    disabled={processing === notif.id}
                  >
                    {processing === notif.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.actionText}>📤 Marcar enviado</Text>
                    )}
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab: Log */}
        {activeTab === 'log' && (
          <View style={styles.section}>
            {auditLog.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No hay logs</Text>
              </View>
            ) : (
              auditLog.map((entry) => (
                <View key={entry.id} style={styles.logEntry}>
                  <Text style={styles.logTime}>
                    {new Date(entry.created_at).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.logAction}>
                    {entry.action === 'payment_created' && '🟡 Pago creado'}
                    {entry.action === 'payment_confirmed' && '✅ Pago confirmado'}
                    {entry.action === 'payment_failed' && '❌ Pago fallido'}
                    {!['payment_created', 'payment_confirmed', 'payment_failed'].includes(entry.action) && entry.action}
                  </Text>
                  {entry.metadata?.amount_cents && (
                    <Text style={styles.logDetail}>
                      {formatCents(entry.metadata.amount_cents)} - {entry.metadata.type}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  refreshButton: {
    padding: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h1,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.md,
    gap: spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107', // Pending = amarillo
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardType: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  cardTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cardUsers: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardAmounts: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  cardAmount: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  cardFee: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardNet: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '600',
  },
  cardMessage: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  failButton: {
    backgroundColor: '#F44336',
  },
  sendButton: {
    backgroundColor: colors.primary,
  },
  actionText: {
    ...typography.buttonSmall,
    color: '#FFF',
  },
  sendAllButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendAllText: {
    ...typography.button,
    color: '#FFF',
  },
  pushTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  pushBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  logEntry: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logTime: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 70,
  },
  logAction: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
  },
  logDetail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
