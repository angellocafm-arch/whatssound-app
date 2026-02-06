/**
 * WhatsSound — Historial de Decibelios
 * Balance de dB ganados, enviados y recibidos
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const HISTORY = [
  { type: 'earned', desc: 'Escuchando a DJ Carlos', date: 'Hoy 22:30', amount: '+45 dB' },
  { type: 'sent', desc: 'Enviado a Luna DJ', date: 'Hoy 21:15', amount: '-20 dB' },
  { type: 'earned', desc: 'Escuchando Techno Session', date: 'Ayer 23:00', amount: '+62 dB' },
  { type: 'received', desc: 'Recibido de @angel', date: 'Ayer 20:30', amount: '+15 dB' },
  { type: 'sent', desc: 'Golden Boost a MC Raúl', date: '3 feb', amount: '-100 dB' },
];

export default function PaymentsScreen() {
  const router = useRouter();

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mis Decibelios</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Balance */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>Balance actual</Text>
          <Text style={s.balanceAmount}>247 dB</Text>
          <Text style={s.balanceHint}>Ganas 1 dB por cada minuto escuchando</Text>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Ionicons name="headset" size={24} color={colors.primary} />
            <Text style={s.statValue}>1,240</Text>
            <Text style={s.statLabel}>dB ganados</Text>
          </View>
          <View style={s.statBox}>
            <Ionicons name="heart" size={24} color={colors.error} />
            <Text style={s.statValue}>520</Text>
            <Text style={s.statLabel}>dB enviados</Text>
          </View>
          <View style={s.statBox}>
            <Ionicons name="star" size={24} color={colors.warning} />
            <Text style={s.statValue}>3</Text>
            <Text style={s.statLabel}>Golden Boosts</Text>
          </View>
        </View>

        {/* Info */}
        <View style={s.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.accent} />
          <Text style={s.infoText}>
            Los decibelios son tu moneda de reconocimiento. Escucha música para ganarlos y dáselos a tus DJs favoritos.
          </Text>
        </View>

        {/* Historial */}
        <Text style={s.sectionLabel}>HISTORIAL</Text>
        {HISTORY.map((h, i) => (
          <View key={i} style={s.historyRow}>
            <View style={[s.historyIcon, h.type === 'earned' && s.iconEarned, h.type === 'sent' && s.iconSent, h.type === 'received' && s.iconReceived]}>
              <Ionicons 
                name={h.type === 'earned' ? 'headset' : h.type === 'sent' ? 'arrow-up' : 'arrow-down'} 
                size={18} 
                color={h.type === 'earned' ? colors.primary : h.type === 'sent' ? colors.error : colors.success} 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.historyDesc}>{h.desc}</Text>
              <Text style={s.historyDate}>{h.date}</Text>
            </View>
            <Text style={[s.historyAmount, h.type === 'sent' && s.amountSent]}>{h.amount}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  content: { padding: spacing.base, paddingBottom: 40 },
  
  balanceCard: {
    backgroundColor: colors.primary, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  balanceLabel: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)' },
  balanceAmount: { ...typography.h1, color: '#fff', fontSize: 48, marginVertical: spacing.xs },
  balanceHint: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  
  statsRow: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.sm },
  statBox: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center' },
  statValue: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.xs },
  statLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  
  infoCard: { 
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.accent + '15', borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.lg,
  },
  infoText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1, lineHeight: 20 },
  
  sectionLabel: { ...typography.captionBold, color: colors.textMuted, letterSpacing: 0.8, marginTop: spacing.xl, marginBottom: spacing.md, fontSize: 11 },
  
  historyRow: { 
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border + '30',
  },
  historyIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconEarned: { backgroundColor: colors.primary + '20' },
  iconSent: { backgroundColor: colors.error + '20' },
  iconReceived: { backgroundColor: colors.success + '20' },
  historyDesc: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 14 },
  historyDate: { ...typography.caption, color: colors.textMuted, fontSize: 12, marginTop: 2 },
  historyAmount: { ...typography.bodyBold, color: colors.primary, fontSize: 15 },
  amountSent: { color: colors.textMuted },
});
