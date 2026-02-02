/**
 * WhatsSound — DJ Stats Detalladas
 * Referencia: 23-dj-stats.png
 * Sesión actual, oyentes/hora (barras), top canciones, propinas, exportar
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const HOURLY = [
  { hour: '22:00', count: 34 },
  { hour: '23:00', count: 89 },
  { hour: '00:00', count: 127 },
  { hour: '01:00', count: 89 },
];

const TOP_SONGS = [
  { pos: 1, title: 'Dakiti', votes: 24 },
  { pos: 2, title: 'Titi Me Preguntó', votes: 19 },
  { pos: 3, title: 'Yonaguni', votes: 15 },
  { pos: 4, title: 'Pepas', votes: 12 },
  { pos: 5, title: 'La Noche de Anoche', votes: 9 },
];

const TIPPERS = [
  { name: 'Laura G.', amount: '€10.00' },
  { name: 'Carlos M.', amount: '€5.00' },
  { name: 'Ana R.', amount: '€15.00' },
  { name: 'Otros (4)', amount: '€17.50' },
];

const maxCount = Math.max(...HOURLY.map(h => h.count));

export default function StatsScreen() {
  const router = useRouter();

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Estadísticas</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Session current */}
        <View style={s.card}>
          <Text style={s.cardLabel}>SESIÓN ACTUAL</Text>
          <View style={s.sessionStats}>
            <View>
              <Text style={s.bigStat}>2h 34m</Text>
              <Text style={s.bigStatLabel}>Duración</Text>
            </View>
            <View>
              <Text style={[s.bigStat, { color: colors.primary }]}>127</Text>
              <Text style={s.bigStatLabel}>Pico oyentes</Text>
            </View>
            <View>
              <Text style={s.bigStat}>89</Text>
              <Text style={s.bigStatLabel}>Ahora</Text>
            </View>
          </View>
        </View>

        {/* Listeners by hour */}
        <View style={s.card}>
          <Text style={s.cardLabel}>OYENTES POR HORA</Text>
          {HOURLY.map((h, i) => (
            <View key={i} style={s.barRow}>
              <Text style={s.barHour}>{h.hour}</Text>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${(h.count / maxCount) * 100}%` }]}>
                  <Text style={s.barCount}>{h.count}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Top songs */}
        <View style={s.card}>
          <Text style={s.cardLabel}>TOP CANCIONES</Text>
          {TOP_SONGS.map(song => (
            <View key={song.pos} style={s.songRow}>
              <Text style={s.songPos}>{song.pos}</Text>
              <Text style={s.songTitle}>{song.title}</Text>
              <View style={s.votesRow}>
                <Ionicons name="thumbs-up" size={14} color={colors.textMuted} />
                <Text style={s.votesText}>{song.votes}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={s.card}>
          <Text style={s.cardLabel}>PROPINAS</Text>
          <View style={s.tipsHeader}>
            <Text style={s.tipsTotal}>€47.50</Text>
            <Text style={s.tipsLabel}>total recibido</Text>
          </View>
          {TIPPERS.map((t, i) => (
            <View key={i} style={s.tipperRow}>
              <Text style={s.tipperName}>{t.name}</Text>
              <Text style={s.tipperAmount}>{t.amount}</Text>
            </View>
          ))}
        </View>

        {/* Export */}
        <TouchableOpacity style={s.exportBtn}>
          <Text style={s.exportText}>📊 Exportar stats</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  content: { padding: spacing.base, gap: spacing.md, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base, borderWidth: 1, borderColor: colors.border },
  cardLabel: { ...typography.captionBold, color: colors.textMuted, letterSpacing: 0.8, fontSize: 11, marginBottom: spacing.md },
  sessionStats: { flexDirection: 'row', justifyContent: 'space-between' },
  bigStat: { ...typography.h2, color: colors.textPrimary, fontSize: 22 },
  bigStatLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  barHour: { ...typography.caption, color: colors.textMuted, fontSize: 12, width: 40 },
  barTrack: { flex: 1, height: 28, backgroundColor: colors.surfaceDark, borderRadius: borderRadius.sm },
  barFill: { height: 28, backgroundColor: colors.primary, borderRadius: borderRadius.sm, justifyContent: 'center', paddingLeft: spacing.sm, minWidth: 50 },
  barCount: { ...typography.captionBold, color: '#fff', fontSize: 12 },
  songRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border + '40' },
  songPos: { ...typography.bodyBold, color: colors.primary, fontSize: 15, width: 24 },
  songTitle: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 14, flex: 1 },
  votesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  votesText: { ...typography.caption, color: colors.textMuted, fontSize: 12 },
  tipsHeader: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.md },
  tipsTotal: { ...typography.h1, color: colors.primary, fontSize: 32 },
  tipsLabel: { ...typography.bodySmall, color: colors.textMuted, fontSize: 13 },
  tipperRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border + '40' },
  tipperName: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 14 },
  tipperAmount: { ...typography.bodyBold, color: colors.primary, fontSize: 14 },
  exportBtn: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: colors.primary,
  },
  exportText: { ...typography.button, color: colors.primary, fontSize: 15 },
});
