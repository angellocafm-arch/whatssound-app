/**
 * WhatsSound — Perfil DJ Público
 * Referencia: 37-perfil-dj-publico.png
 * Cómo te ven otros: avatar, stats, sesiones, rating, historial
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const RECENT_SESSIONS = [
  { name: 'Viernes Latino 🔥', date: 'Hoy', listeners: 47, rating: 4.8 },
  { name: 'Reggaeton Mix 🎉', date: 'Sábado', listeners: 96, rating: 4.6 },
  { name: 'Chill Sunday 🌤️', date: 'Domingo', listeners: 23, rating: 4.9 },
];

export default function DJPublicProfile() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Perfil DJ</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Avatar + info */}
        <View style={s.profileTop}>
          <View style={s.avatarRing}>
            <View style={s.avatar}>
              <Ionicons name="headset" size={40} color="#fff" />
            </View>
          </View>
          <Text style={s.name}>DJ Carlos Madrid</Text>
          <View style={s.verifiedRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={s.verified}>Verificado</Text>
          </View>
          <Text style={s.bio}>Amante de la música y DJ amateur 🎧{'\n'}Reggaetón · Latin House · Electrónica</Text>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.stat}><Text style={s.statVal}>47</Text><Text style={s.statLabel}>Sesiones</Text></View>
          <View style={s.stat}><Text style={s.statVal}>1.2K</Text><Text style={s.statLabel}>Seguidores</Text></View>
          <View style={s.stat}><Text style={[s.statVal, {color:colors.warning}]}>4.8★</Text><Text style={s.statLabel}>Rating</Text></View>
          <View style={s.stat}><Text style={s.statVal}>234</Text><Text style={s.statLabel}>Propinas</Text></View>
        </View>

        {/* Follow button */}
        <TouchableOpacity style={s.followBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.followText}>Seguir</Text>
        </TouchableOpacity>

        {/* Recent sessions */}
        <Text style={s.sectionTitle}>Sesiones recientes</Text>
        {RECENT_SESSIONS.map((session, i) => (
          <TouchableOpacity key={i} style={s.sessionCard}>
            <View style={s.sessionIcon}>
              <Ionicons name="radio" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.sessionName}>{session.name}</Text>
              <Text style={s.sessionMeta}>{session.date} · 👥 {session.listeners}</Text>
            </View>
            <View style={s.ratingBadge}>
              <Text style={s.ratingText}>{session.rating}★</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Genres */}
        <Text style={s.sectionTitle}>Géneros</Text>
        <View style={s.genresWrap}>
          {['Reggaetón', 'Latin House', 'Electrónica', 'Dembow', 'Bachata'].map(g => (
            <View key={g} style={s.genrePill}>
              <Text style={s.genreText}>{g}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  content: { padding: spacing.base, paddingBottom: 40 },
  profileTop: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  avatarRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#E91E63', alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.h2, color: colors.textPrimary, fontSize: 22, marginTop: spacing.sm },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verified: { ...typography.captionBold, color: colors.primary, fontSize: 12 },
  bio: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', fontSize: 13, lineHeight: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base, marginBottom: spacing.md },
  stat: { alignItems: 'center' },
  statVal: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  statLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  followBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 14, marginBottom: spacing.lg },
  followText: { ...typography.button, color: '#fff', fontSize: 15 },
  sectionTitle: { ...typography.bodyBold, color: colors.textSecondary, fontSize: 14, marginBottom: spacing.sm, marginTop: spacing.sm },
  sessionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  sessionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  sessionName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 14 },
  sessionMeta: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  ratingBadge: { backgroundColor: colors.warning + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  ratingText: { ...typography.captionBold, color: colors.warning, fontSize: 12 },
  genresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  genrePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.primary + '15' },
  genreText: { ...typography.captionBold, color: colors.primary, fontSize: 12 },
});
