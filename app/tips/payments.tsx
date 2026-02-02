/**
 * WhatsSound — Configurar Pagos
 * Referencia: 28-config-pagos.png
 * Balance, métodos de pago, retirar fondos, historial retiros
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const WITHDRAWALS = [
  { dest: 'Retiro a Santander', date: '15 ene 2025', amount: '€85.00' },
  { dest: 'Retiro a Santander', date: '2 ene 2025', amount: '€52.50' },
  { dest: 'Retiro a Santander', date: '18 dic 2024', amount: '€120.00' },
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
        <Text style={s.headerTitle}>Pagos</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Balance */}
        <Text style={s.sectionLabel}>BALANCE</Text>
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>Disponible</Text>
          <Text style={s.balanceAmount}>€47.50</Text>
          <Text style={s.balancePending}>Pendiente de liquidar: €12.00</Text>
        </View>

        {/* Métodos de pago */}
        <Text style={s.sectionLabel}>MÉTODOS DE PAGO</Text>
        <View style={s.card}>
          <View style={s.methodRow}>
            <View style={s.cardIcon}>
              <Ionicons name="card" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.methodName}>Visa ****4532</Text>
              <Text style={s.methodDetail}>Expira 12/26</Text>
            </View>
            <View style={s.defaultBadge}>
              <Text style={s.defaultText}>Por defecto</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={s.card}>
          <View style={s.methodRow}>
            <View style={[s.cardIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="add" size={20} color={colors.primary} />
            </View>
            <Text style={s.addMethod}>Añadir método de pago</Text>
          </View>
        </TouchableOpacity>

        {/* Retirar fondos */}
        <Text style={s.sectionLabel}>RETIRAR FONDOS</Text>
        <View style={s.card}>
          <Text style={s.bankLabel}>Cuenta bancaria vinculada</Text>
          <View style={s.bankRow}>
            <Text style={s.bankIcon}>🏦</Text>
            <View>
              <Text style={s.bankName}>Banco Santander</Text>
              <Text style={s.bankIban}>ES** **** **** **** 7891</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={s.withdrawBtn}>
          <Text style={s.withdrawText}>Retirar €47.50</Text>
        </TouchableOpacity>

        {/* Historial retiros */}
        <Text style={s.sectionLabel}>HISTORIAL DE RETIROS</Text>
        {WITHDRAWALS.map((w, i) => (
          <View key={i} style={s.withdrawRow}>
            <View>
              <Text style={s.withdrawDest}>{w.dest}</Text>
              <Text style={s.withdrawDate}>{w.date}</Text>
            </View>
            <Text style={s.withdrawAmount}>{w.amount}</Text>
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
  sectionLabel: { ...typography.captionBold, color: colors.textMuted, letterSpacing: 0.8, marginTop: spacing.lg, marginBottom: spacing.sm, fontSize: 11 },
  balanceCard: {
    backgroundColor: '#1a8d4e', borderRadius: borderRadius.xl, padding: spacing.xl,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  balanceLabel: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)' },
  balanceAmount: { ...typography.h1, color: '#fff', fontSize: 36, marginVertical: spacing.xs },
  balancePending: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base, marginBottom: spacing.sm },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.accent + '15', alignItems: 'center', justifyContent: 'center' },
  methodName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  methodDetail: { ...typography.caption, color: colors.textMuted, fontSize: 12 },
  defaultBadge: { backgroundColor: colors.primary + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  defaultText: { ...typography.captionBold, color: colors.primary, fontSize: 11 },
  addMethod: { ...typography.bodySmall, color: colors.textSecondary },
  bankLabel: { ...typography.caption, color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bankIcon: { fontSize: 24 },
  bankName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  bankIban: { ...typography.caption, color: colors.textMuted, fontSize: 12 },
  withdrawBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 16, alignItems: 'center', marginTop: spacing.md },
  withdrawText: { ...typography.button, color: '#fff', fontSize: 16 },
  withdrawRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border + '50',
  },
  withdrawDest: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 14 },
  withdrawDate: { ...typography.caption, color: colors.textMuted, fontSize: 12, marginTop: 2 },
  withdrawAmount: { ...typography.bodyBold, color: colors.primary, fontSize: 15 },
});
