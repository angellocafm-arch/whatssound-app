/**
 * WhatsSound — Detalle de Canción
 * Referencia: 19-detalle-cancion.png
 * Carátula grande, stats, barra progreso, votar/propina/spotify, comentarios
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const COMMENTS = [
  { name: 'Carlos M.', color: '#FF5722', text: 'Temazo!! 🔥🔥', time: 'hace 2 min' },
  { name: 'Ana R.', color: '#009688', text: 'Súbele volumen porfa 🙏', time: 'hace 5 min' },
  { name: 'Laura G.', color: '#E91E63', text: 'La pedí yo! 🎉', time: 'hace 8 min' },
];

export default function SongDetailScreen() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Detalle</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Album art */}
        <View style={s.albumArt}>
          <Ionicons name="musical-notes" size={64} color="rgba(255,255,255,0.5)" />
        </View>

        {/* Song info */}
        <Text style={s.title}>Dakiti</Text>
        <Text style={s.artist}>Bad Bunny, Jhay Cortez</Text>

        {/* Stats */}
        <View style={s.statsRow}>
          <Text style={s.stat}>👍 12 votos</Text>
          <Text style={s.stat}>💰 2 propinas</Text>
          <Text style={s.stat}>👤 Laura G.</Text>
        </View>

        {/* Progress bar */}
        <View style={s.progressContainer}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: '36%' }]} />
          </View>
          <View style={s.progressTimes}>
            <Text style={s.timeText}>1:12</Text>
            <Text style={s.timeText}>3:25</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="thumbs-up" size={20} color="#fff" />
            <Text style={s.actionText}>Votar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.warning + '30' }]}>
            <Ionicons name="cash" size={20} color={colors.warning} />
            <Text style={[s.actionText, { color: colors.warning }]}>Propina</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.surfaceLight }]}>
            <Ionicons name="headset" size={20} color={colors.primary} />
            <Text style={[s.actionText, { color: colors.primary }]}>Spotify</Text>
          </TouchableOpacity>
        </View>

        {/* Comments */}
        <View style={s.divider} />
        <Text style={s.commentsTitle}>Comentarios (3)</Text>
        {COMMENTS.map((c, i) => (
          <View key={i} style={s.commentRow}>
            <View style={[s.commentAvatar, { backgroundColor: c.color }]}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{c.name[0]}</Text>
            </View>
            <View style={[s.commentBubble, { backgroundColor: c.color + '25' }]}>
              <Text style={s.commentName}>{c.name}</Text>
              <Text style={s.commentText}>{c.text}</Text>
              <Text style={s.commentTime}>{c.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  content: { padding: spacing.base, alignItems: 'center', paddingBottom: 40 },
  albumArt: {
    width: 240, height: 240, borderRadius: borderRadius.xl,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
    // Gradient-like background
    backgroundColor: '#9C27B0',
    shadowColor: '#9C27B0', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16,
  },
  title: { ...typography.h2, color: colors.textPrimary, fontSize: 22 },
  artist: { ...typography.body, color: colors.textSecondary, fontSize: 15, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  stat: { ...typography.caption, color: colors.textMuted, fontSize: 12 },
  progressContainer: { width: '100%', marginBottom: spacing.lg },
  progressTrack: { height: 4, backgroundColor: colors.surfaceLight, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: colors.accent, borderRadius: 2 },
  progressTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  actionBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: borderRadius.full, alignItems: 'center', gap: 4 },
  actionText: { ...typography.captionBold, color: '#fff', fontSize: 12 },
  divider: { width: '100%', height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  commentsTitle: { ...typography.bodyBold, color: colors.textSecondary, fontSize: 14, alignSelf: 'flex-start', marginBottom: spacing.md },
  commentRow: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'flex-start', marginBottom: spacing.sm },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  commentBubble: { borderRadius: borderRadius.lg, padding: spacing.sm, paddingHorizontal: spacing.md, maxWidth: '80%' },
  commentName: { ...typography.captionBold, color: colors.primary, fontSize: 12 },
  commentText: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 14 },
  commentTime: { ...typography.caption, color: colors.textMuted, fontSize: 10, marginTop: 2 },
});
