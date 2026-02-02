/**
 * WhatsSound — Historial de Propinas
 * Referencia: 27-historial-propinas.png
 * Tabs: Recibidas / Enviadas + Balance + Lista + Retirar fondos
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { LinearGradient } from 'expo-linear-gradient';

const RECEIVED = [
  { name: 'Laura García', song: 'Pepas — Farruko', amount: 5, time: 'Hace 10 min' },
  { name: 'Carlos Ruiz', song: 'Yandel 150 — Yandel', amount: 10, time: 'Hace 1h' },
  { name: 'Ana Martín', song: 'La Jumpa — Arcángel', amount: 2, time: 'Hace 3h' },
  { name: 'Pedro López', song: 'Quevedo Bzrp 52', amount: 5, time: 'Ayer' },
  { name: 'Sofía Vega', song: 'Titi Me Preguntó', amount: 1, time: 'Ayer' },
  { name: 'Miguel Torres', song: 'Efecto — Bad Bunny', amount: 2, time: 'Hace 2 días' },
];

const SENT = [
  { name: 'DJ Luna', song: 'Session Chill Beats', amount: 5, time: 'Hace 2h' },
  { name: 'DJ Carlos Madrid', song: 'Viernes Latino', amount: 2, time: 'Ayer' },
  { name: 'Sarah B', song: 'Deep House Sunset', amount: 3, time: 'Hace 3 días' },
];

export default function TipsHistoryScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const tips = tab === 'received' ? RECEIVED : SENT;
  const balance = 47.50;
  const thisMonth = 32.00;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Propinas</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'received' && s.tabActive]} onPress={() => setTab('received')}>
          <Text style={[s.tabText, tab === 'received' && s.tabTextActive]}>Recibidas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'sent' && s.tabActive]} onPress={() => setTab('sent')}>
          <Text style={[s.tabText, tab === 'sent' && s.tabTextActive]}>Enviadas</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Balance card */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>Balance total</Text>
          <Text style={s.balanceAmount}>€{balance.toFixed(2)}</Text>
          <Text style={s.balanceMonth}>Este mes: +€{thisMonth.toFixed(2)}</Text>
        </View>

        {/* Tips list */}
        {tips.map((tip, i) => (
          <View key={i} style={s.tipRow}>
            <View style={s.tipAvatar}>
              <Text style={s.tipAvatarText}>{tip.name.split(' ').map(w => w[0]).join('')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.tipName}>{tip.name}</Text>
              <Text style={s.tipSong}>🎵 {tip.song}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.tipAmount}>{tab === 'received' ? '+' : '-'}€{tip.amount}</Text>
              <Text style={s.tipTime}>{tip.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Retirar fondos button */}
      {tab === 'received' && (
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
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { ...typography.bodyBold, color: colors.textMuted, fontSize: 14 },
  tabTextActive: { color: colors.primary },
  content: { padding: spacing.base, gap: spacing.sm },
  balanceCard: {
    borderRadius: borderRadius.xl, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.md,
    backgroundColor: '#1a8d4e',
    // Gradient simulado con background
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  balanceLabel: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  balanceAmount: { ...typography.h1, color: '#fff', fontSize: 42, marginVertical: spacing.sm },
  balanceMonth: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', fontSize: 13 },
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
  footer: { padding: spacing.base, paddingBottom: 30 },
  withdrawBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 16, alignItems: 'center' },
  withdrawText: { ...typography.button, color: '#fff', fontSize: 16 },
});
