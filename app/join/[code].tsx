/**
 * WhatsSound — Deep Link Landing
 * Referencia: 38-deep-link.png
 * "Abre en WhatsSound" + preview sesión + fallback install
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

export default function DeepLinkScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();

  return (
    <View style={s.container}>
      {/* Logo */}
      <View style={s.logoWrap}>
        <Ionicons name="headset" size={48} color={colors.primary} />
      </View>
      <Text style={s.brand}>WhatsSound</Text>

      {/* Session preview */}
      <View style={s.card}>
        <View style={s.sessionIcon}>
          <Ionicons name="radio" size={28} color={colors.primary} />
        </View>
        <Text style={s.sessionName}>Viernes Latino 🔥</Text>
        <Text style={s.sessionInfo}>DJ Carlos Madrid · Reggaeton</Text>
        <View style={s.statsRow}>
          <Text style={s.stat}>👥 47 personas</Text>
          <Text style={s.stat}>🎵 En vivo</Text>
        </View>
        <Text style={s.code}>Código: {code || 'WSND-4521'}</Text>
      </View>

      {/* Open button */}
      <TouchableOpacity style={s.openBtn}>
        <Ionicons name="headset" size={20} color="#fff" />
        <Text style={s.openText}>Abrir en WhatsSound</Text>
      </TouchableOpacity>

      {/* Install */}
      <Text style={s.orText}>¿No tienes la app?</Text>
      <View style={s.storeRow}>
        <TouchableOpacity style={s.storeBtn}>
          <Ionicons name="logo-apple" size={20} color="#fff" />
          <Text style={s.storeText}>App Store</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.storeBtn}>
          <Ionicons name="logo-google-playstore" size={20} color="#fff" />
          <Text style={s.storeText}>Google Play</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  logoWrap: { width: 80, height: 80, borderRadius: 20, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  brand: { ...typography.h1, color: colors.textPrimary, fontSize: 28, marginBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl, width: '100%', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  sessionIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  sessionName: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  sessionInfo: { ...typography.bodySmall, color: colors.textSecondary, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: spacing.lg },
  stat: { ...typography.captionBold, color: colors.textMuted, fontSize: 12 },
  code: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginTop: spacing.sm },
  openBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: borderRadius.lg, width: '100%', justifyContent: 'center', marginBottom: spacing.lg },
  openText: { ...typography.button, color: '#fff', fontSize: 16 },
  orText: { ...typography.bodySmall, color: colors.textMuted, marginBottom: spacing.md },
  storeRow: { flexDirection: 'row', gap: spacing.sm },
  storeBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surface, paddingHorizontal: 20, paddingVertical: 12, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
  storeText: { ...typography.buttonSmall, color: colors.textPrimary, fontSize: 13 },
});
