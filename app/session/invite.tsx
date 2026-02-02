/**
 * WhatsSound — Invitación a Sesión (Push/In-app)
 * Referencia: 30-invitacion-sesion.png
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

export default function InviteScreen() {
  const router = useRouter();

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => router.back()}>
      <TouchableOpacity style={s.card} activeOpacity={1}>
        <View style={s.djAvatar}>
          <Ionicons name="headset" size={36} color="#fff" />
        </View>
        <Text style={s.inviteText}>DJ Carlos Madrid te invita</Text>
        <Text style={s.sessionName}>Viernes Latino 🔥</Text>
        <Text style={s.genre}>Reggaeton · Latin</Text>

        <View style={s.statsRow}>
          <View style={s.stat}>
            <Ionicons name="people" size={16} color={colors.primary} />
            <Text style={s.statText}>47 personas</Text>
          </View>
          <View style={s.stat}>
            <Ionicons name="musical-notes" size={16} color={colors.primary} />
            <Text style={s.statText}>12 canciones</Text>
          </View>
        </View>

        <View style={s.nowPlaying}>
          <Ionicons name="play-circle" size={16} color={colors.primary} />
          <Text style={s.nowPlayingText}>Sonando ahora: Dakiti — Bad Bunny</Text>
        </View>

        <View style={s.buttons}>
          <TouchableOpacity style={s.declineBtn} onPress={() => router.back()}>
            <Text style={s.declineText}>Ahora no</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.joinBtn} onPress={() => router.replace('/session/mock-5' as any)}>
            <Ionicons name="headset" size={16} color="#fff" />
            <Text style={s.joinText}>Unirme</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl, width: '100%', maxWidth: 340, alignItems: 'center', gap: spacing.sm },
  djAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E91E63', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  inviteText: { ...typography.bodySmall, color: colors.textSecondary, fontSize: 14 },
  sessionName: { ...typography.h2, color: colors.textPrimary, fontSize: 22 },
  genre: { ...typography.caption, color: colors.textMuted, fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.sm },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...typography.captionBold, color: colors.textSecondary, fontSize: 12 },
  nowPlaying: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary + '10', padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg, marginTop: spacing.sm },
  nowPlayingText: { ...typography.caption, color: colors.primary, fontSize: 12 },
  buttons: { flexDirection: 'row', gap: spacing.sm, width: '100%', marginTop: spacing.md },
  declineBtn: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center' },
  declineText: { ...typography.button, color: colors.textMuted, fontSize: 14 },
  joinBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  joinText: { ...typography.button, color: '#fff', fontSize: 14 },
});
