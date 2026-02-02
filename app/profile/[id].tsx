/**
 * WhatsSound — Perfil de Usuario (Modal card)
 * Referencia: 20-perfil-usuario.png
 * Card centrada con avatar, stats, acciones
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

export default function ProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Mock data
  const user = {
    name: 'DJ Marcos',
    role: 'DJ',
    listening: 'Bad Bunny — Dakiti',
    sessions: 47,
    votes: 234,
    tips: 12,
  };

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => router.back()}>
      <TouchableOpacity style={s.card} activeOpacity={1}>
        {/* Avatar */}
        <View style={s.avatarRing}>
          <View style={s.avatar}>
            <Ionicons name="headset" size={40} color="#fff" />
          </View>
        </View>

        {/* Name & Role */}
        <Text style={s.name}>{user.name}</Text>
        <View style={s.roleBadge}>
          <Text style={s.roleText}>{user.role}</Text>
        </View>

        {/* Listening */}
        <View style={s.listeningRow}>
          <View style={s.onlineDot} />
          <Text style={s.listeningText}>{user.listening}</Text>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statVal}>{user.sessions}</Text>
            <Text style={s.statLabel}>Sesiones</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statVal}>{user.votes}</Text>
            <Text style={s.statLabel}>Votos</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statVal}>{user.tips}</Text>
            <Text style={s.statLabel}>Propinas</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actionsGrid}>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="chatbubble" size={16} color="#fff" />
            <Text style={s.actionText}>Mensaje</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.warning + '30' }]}>
            <Ionicons name="star" size={16} color={colors.warning} />
            <Text style={[s.actionText, { color: colors.warning }]}>Dar VIP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.surfaceLight }]}>
            <Ionicons name="volume-mute" size={16} color={colors.textMuted} />
            <Text style={[s.actionText, { color: colors.textMuted }]}>Silenciar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.error + '15' }]}>
            <Ionicons name="ban" size={16} color={colors.error} />
            <Text style={[s.actionText, { color: colors.error }]}>Reportar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    padding: spacing.xl, width: '100%', maxWidth: 340,
    alignItems: 'center', gap: spacing.sm,
  },
  avatarRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#E91E63',
    alignItems: 'center', justifyContent: 'center',
  },
  name: { ...typography.h2, color: colors.textPrimary, fontSize: 20 },
  roleBadge: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 4, borderRadius: borderRadius.full },
  roleText: { ...typography.captionBold, color: '#fff', fontSize: 12 },
  listeningRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  listeningText: { ...typography.bodySmall, color: colors.textSecondary, fontSize: 13 },
  statsRow: {
    flexDirection: 'row', width: '100%', justifyContent: 'space-around',
    paddingVertical: spacing.md, marginTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  stat: { alignItems: 'center' },
  statVal: { ...typography.h3, color: colors.textPrimary, fontSize: 20 },
  statLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, width: '100%', marginTop: spacing.sm },
  actionBtn: {
    flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: 12, borderRadius: borderRadius.lg,
  },
  actionText: { ...typography.buttonSmall, color: '#fff', fontSize: 13 },
});
