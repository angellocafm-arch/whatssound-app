/**
 * WhatsSound — Admin: Estadísticas de Decibelios
 * Métricas de engagement y uso del sistema de dB
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';

interface Stats {
  totalDbGenerated: number;
  totalDbTransferred: number;
  totalGoldenBoosts: number;
  avgDbPerSession: number;
  activeUsers: number;
  topDJs: { name: string; dbReceived: number }[];
  topListeners: { name: string; dbEarned: number }[];
}

const DEFAULT_STATS: Stats = {
  totalDbGenerated: 124500,
  totalDbTransferred: 45200,
  totalGoldenBoosts: 234,
  avgDbPerSession: 85,
  activeUsers: 1247,
  topDJs: [
    { name: 'DJ Carlos Madrid', dbReceived: 8500 },
    { name: 'Luna DJ', dbReceived: 6200 },
    { name: 'MC Raúl', dbReceived: 4800 },
    { name: 'Sarah B', dbReceived: 3900 },
    { name: 'Paco Techno', dbReceived: 3100 },
  ],
  topListeners: [
    { name: 'María G.', dbEarned: 2400 },
    { name: 'Javi R.', dbEarned: 1850 },
    { name: 'Laura S.', dbEarned: 1600 },
    { name: 'Pablo M.', dbEarned: 1420 },
    { name: 'Ana L.', dbEarned: 1200 },
  ],
};

export default function RevenueScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(false);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Estadísticas dB</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Main Stats */}
        <Text style={s.title}>🔊 Resumen de Decibelios</Text>
        
        <View style={s.statsGrid}>
          <View style={s.stat}>
            <View style={[s.statIcon, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="headset" size={20} color={colors.primary} />
            </View>
            <Text style={s.statVal}>{(stats.totalDbGenerated / 1000).toFixed(1)}K</Text>
            <Text style={s.statLabel}>dB generados</Text>
            <Text style={s.statTrend}>por escuchar</Text>
          </View>
          <View style={s.stat}>
            <View style={[s.statIcon, { backgroundColor: colors.warning + '18' }]}>
              <Ionicons name="swap-horizontal" size={20} color={colors.warning} />
            </View>
            <Text style={s.statVal}>{(stats.totalDbTransferred / 1000).toFixed(1)}K</Text>
            <Text style={s.statLabel}>dB transferidos</Text>
            <Text style={s.statTrend}>a DJs</Text>
          </View>
          <View style={s.stat}>
            <View style={[s.statIcon, { backgroundColor: '#FFD700' + '18' }]}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
            </View>
            <Text style={s.statVal}>{stats.totalGoldenBoosts}</Text>
            <Text style={s.statLabel}>Golden Boosts</Text>
            <Text style={s.statTrend}>dados</Text>
          </View>
          <View style={s.stat}>
            <View style={[s.statIcon, { backgroundColor: colors.accent + '18' }]}>
              <Ionicons name="flash" size={20} color={colors.accent} />
            </View>
            <Text style={s.statVal}>{stats.avgDbPerSession}</Text>
            <Text style={s.statLabel}>dB promedio</Text>
            <Text style={s.statTrend}>por sesión</Text>
          </View>
        </View>

        {/* Top DJs */}
        <Text style={[s.title, { marginTop: spacing.xl }]}>🎧 Top DJs (dB recibidos)</Text>
        <View style={s.card}>
          {stats.topDJs.map((dj, i) => (
            <View key={i} style={s.rankRow}>
              <Text style={s.rankNum}>{i + 1}</Text>
              <Text style={s.rankName}>{dj.name}</Text>
              <Text style={s.rankValue}>{dj.dbReceived.toLocaleString()} dB</Text>
            </View>
          ))}
        </View>

        {/* Top Listeners */}
        <Text style={[s.title, { marginTop: spacing.lg }]}>🎵 Top Oyentes (dB ganados)</Text>
        <View style={s.card}>
          {stats.topListeners.map((user, i) => (
            <View key={i} style={s.rankRow}>
              <Text style={s.rankNum}>{i + 1}</Text>
              <Text style={s.rankName}>{user.name}</Text>
              <Text style={s.rankValue}>{user.dbEarned.toLocaleString()} dB</Text>
            </View>
          ))}
        </View>

        {/* Info */}
        <View style={s.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.accent} />
          <Text style={s.infoText}>
            Los decibelios son la moneda virtual de WhatsSound. Los usuarios ganan 1 dB por cada minuto que escuchan música. Pueden dar sus dB a los DJs como reconocimiento.
          </Text>
        </View>
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
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: { 
    width: '48%', backgroundColor: colors.surface, borderRadius: borderRadius.lg, 
    padding: spacing.md, alignItems: 'center',
  },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statVal: { ...typography.h2, color: colors.textPrimary, fontSize: 24 },
  statLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  statTrend: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
  
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md },
  rankRow: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border + '30',
  },
  rankNum: { ...typography.bodyBold, color: colors.primary, width: 24 },
  rankName: { ...typography.body, color: colors.textPrimary, flex: 1 },
  rankValue: { ...typography.bodyBold, color: colors.warning },
  
  infoCard: { 
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.accent + '15', borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.xl,
  },
  infoText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1, lineHeight: 20 },
});
