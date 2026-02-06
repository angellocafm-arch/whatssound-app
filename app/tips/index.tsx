/**
 * WhatsSound — Historial de Volumen
 * Referencia: 27-historial-volumen.png
 * Tabs: Recibidas / Enviadas + Balance + Lista + Retirar fondos
 * 
 * CONECTADO A SUPABASE: carga decibelios reales de ws_tips
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { getUserTipsSent, getUserTipsReceived, getDJBalance, getPaymentStatus } from '../../src/lib/tips';
import { isTestMode, getOrCreateTestUser, DEMO_DJ } from '../../src/lib/demo';
import { supabase } from '../../src/lib/supabase';

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

export default function TipsHistoryScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [isDJ, setIsDJ] = useState(false);
  
  const [receivedTips, setReceivedTips] = useState<any[]>([]);
  const [sentTips, setSentTips] = useState<any[]>([]);
  const [balance, setBalance] = useState({ total: 0, available: 0, pending: 0, thisMonth: 0 });

  const paymentStatus = getPaymentStatus();

  // Get current user
  useEffect(() => {
    (async () => {
      if (isTestMode()) {
        const testProfile = await getOrCreateTestUser();
        if (testProfile) {
          setUserId(testProfile.id);
          setIsDJ(testProfile.is_dj);
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data: profile } = await supabase
            .from('ws_profiles')
            .select('is_dj')
            .eq('id', user.id)
            .single();
          setIsDJ(profile?.is_dj || false);
        }
      }
    })();
  }, []);

  // Load tips
  const loadTips = async () => {
    if (!userId) return;
    
    try {
      // Load received tips (for DJs)
      if (isDJ) {
        const received = await getUserTipsReceived(userId);
        setReceivedTips(received.map((t: { id: string; amount: number; created_at: string; from_user?: { display_name: string }; to_user?: { display_name: string } }) => ({
          id: t.id,
          name: t.is_anonymous ? 'Anónimo' : (t.sender?.display_name || 'Usuario'),
          song: t.song ? `${t.song.title} — ${t.song.artist}` : t.message || 'Volumen general',
          amount: t.amount,
          time: timeAgo(t.created_at),
          status: t.status,
        })));

        // Load balance
        const bal = await getDJBalance(userId);
        setBalance(bal);
      }

      // Load sent tips (for everyone)
      const sent = await getUserTipsSent(userId);
      setSentTips(sent.map((t: { id: string; amount: number; created_at: string; from_user?: { display_name: string }; to_user?: { display_name: string } }) => ({
        id: t.id,
        name: t.receiver?.dj_name || t.receiver?.display_name || 'DJ',
        song: t.session?.name || t.message || 'Volumen general',
        amount: t.amount,
        time: timeAgo(t.created_at),
        status: t.status,
      })));
    } catch (e) {
      console.error('Error loading tips:', e);
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (userId) loadTips();
  }, [userId, isDJ]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTips();
  };

  const tips = tab === 'received' ? receivedTips : sentTips;

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Volumen</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Test mode banner */}
      {!paymentStatus.enabled && (
        <View style={s.testBanner}>
          <Ionicons name="flask" size={14} color={colors.warning} />
          <Text style={s.testBannerText}>Modo demo: las decibelios son simulados</Text>
        </View>
      )}

      {/* Tabs */}
      {isDJ && (
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, tab === 'received' && s.tabActive]} onPress={() => setTab('received')}>
            <Text style={[s.tabText, tab === 'received' && s.tabTextActive]}>Recibidas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === 'sent' && s.tabActive]} onPress={() => setTab('sent')}>
            <Text style={[s.tabText, tab === 'sent' && s.tabTextActive]}>Enviadas</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Balance card (only for DJs on received tab) */}
        {isDJ && tab === 'received' && (
          <View style={s.balanceCard}>
            <Text style={s.balanceLabel}>Decibelios recibidos</Text>
            <Text style={s.balanceAmount}>{balance.available.toFixed(0)} dB</Text>
            <View style={s.balanceStats}>
              <View style={s.balanceStat}>
                <Text style={s.balanceStatValue}>{balance.thisMonth.toFixed(0)} dB</Text>
                <Text style={s.balanceStatLabel}>Este mes</Text>
              </View>
              {balance.pending > 0 && (
                <View style={s.balanceStat}>
                  <Text style={s.balanceStatValue}>{balance.pending.toFixed(0)} dB</Text>
                  <Text style={s.balanceStatLabel}>Pendiente</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tips list */}
        {tips.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="cash-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>
              {tab === 'received' ? 'No has recibido decibelios aún' : 'No has enviado decibelios aún'}
            </Text>
            <Text style={s.emptySub}>
              {tab === 'received' 
                ? 'Cuando alguien te envíe decibelios, aparecerá aquí'
                : 'Apoya a tus DJs favoritos con decibelios'}
            </Text>
          </View>
        ) : (
          tips.map((tip, i) => (
            <View key={tip.id || i} style={s.tipRow}>
              <View style={s.tipAvatar}>
                <Text style={s.tipAvatarText}>
                  {tip.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.tipName}>{tip.name}</Text>
                <Text style={s.tipSong}>🎵 {tip.song}</Text>
                {tip.status === 'test' && (
                  <View style={s.testBadge}>
                    <Text style={s.testBadgeText}>Demo</Text>
                  </View>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.tipAmount}>{tab === 'received' ? '+' : '-'}{tip.amount} dB</Text>
                <Text style={s.tipTime}>{tip.time}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Retirar fondos button (only for DJs) */}
      {isDJ && tab === 'received' && balance.available > 0 && (
        <View style={s.footer}>
          <TouchableOpacity style={s.withdrawBtn} onPress={() => router.push('/tips/payments' as any)}>
            <Text style={s.withdrawText}>Retirar fondos</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  
  testBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning + '15',
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.base,
    borderRadius: borderRadius.md,
  },
  testBannerText: { ...typography.caption, color: colors.warning },
  
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { ...typography.bodyBold, color: colors.textMuted, fontSize: 14 },
  tabTextActive: { color: colors.primary },
  
  content: { padding: spacing.base, gap: spacing.sm, paddingBottom: 100 },
  
  balanceCard: {
    borderRadius: borderRadius.xl, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.md,
    backgroundColor: '#1a8d4e',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  balanceLabel: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  balanceAmount: { ...typography.h1, color: '#fff', fontSize: 42, marginVertical: spacing.sm },
  balanceStats: { flexDirection: 'row', gap: spacing.xl },
  balanceStat: { alignItems: 'center' },
  balanceStatValue: { ...typography.bodyBold, color: 'rgba(255,255,255,0.9)', fontSize: 16 },
  balanceStatLabel: { ...typography.caption, color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 16, textAlign: 'center' },
  emptySub: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center' },
  
  tipRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border + '50',
  },
  tipAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  tipAvatarText: { ...typography.captionBold, color: colors.primary, fontSize: 14 },
  tipName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  tipSong: { ...typography.caption, color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  tipAmount: { ...typography.bodyBold, color: colors.primary, fontSize: 15 },
  tipTime: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginTop: 2 },
  
  testBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  testBadgeText: { ...typography.caption, color: colors.warning, fontSize: 10 },
  
  footer: { padding: spacing.base, paddingBottom: 30 },
  withdrawBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 16, alignItems: 'center' },
  withdrawText: { ...typography.button, color: '#fff', fontSize: 16 },
});
