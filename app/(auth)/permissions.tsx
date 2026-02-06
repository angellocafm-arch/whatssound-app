/**
 * WhatsSound — Permisos (Onboarding)
 * Referencia: 41-permisos.png
 * Notificaciones, contactos, micrófono
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const PERMISSIONS = [
  { icon: 'notifications' as const, title: 'Notificaciones', desc: 'Te avisamos cuando empiecen sesiones que sigues o alguien te mencione', enabled: true },
  { icon: 'people' as const, title: 'Contactos', desc: 'Encuentra amigos que ya usan WhatsSound', enabled: false },
  { icon: 'mic' as const, title: 'Micrófono', desc: 'Para hablar en directo en sesiones (walkie-talkie)', enabled: false },
];

export default function PermissionsScreen() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <View style={s.top}>
        <View style={s.iconWrap}>
          <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
        </View>
        <Text style={s.title}>Últimos permisos</Text>
        <Text style={s.subtitle}>Puedes cambiarlos en cualquier momento desde Ajustes</Text>
      </View>

      <View style={s.permsList}>
        {PERMISSIONS.map((p, i) => (
          <Pressable key={i} style={s.permRow}>
            <View style={s.permIcon}>
              <Ionicons name={p.icon} size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.permTitle}>{p.title}</Text>
              <Text style={s.permDesc}>{p.desc}</Text>
            </View>
            <Pressable style={[s.permBtn, p.enabled && s.permBtnActive]}>
              <Text style={[s.permBtnText, p.enabled && s.permBtnTextActive]}>
                {p.enabled ? 'Activado' : 'Activar'}
              </Text>
            </Pressable>
          </Pressable>
        ))}
      </View>

      <View style={s.bottom}>
        <Pressable style={s.continueBtn} onPress={() => router.replace('/(tabs)/chats' as any)}>
          <Text style={s.continueText}>Empezar a usar WhatsSound 🎧</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/(tabs)/chats' as any)}>
          <Text style={s.skipText}>Saltar por ahora</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  top: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.textPrimary, fontSize: 22 },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', fontSize: 14, marginTop: spacing.xs },
  permsList: { gap: spacing.md, flex: 1 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base },
  permIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  permTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  permDesc: { ...typography.caption, color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  permBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: colors.surfaceLight },
  permBtnActive: { backgroundColor: colors.primary + '20' },
  permBtnText: { ...typography.captionBold, color: colors.textMuted, fontSize: 12 },
  permBtnTextActive: { color: colors.primary },
  bottom: { gap: spacing.md, alignItems: 'center' },
  continueBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 16, width: '100%', alignItems: 'center' },
  continueText: { ...typography.button, color: '#fff', fontSize: 16 },
  skipText: { ...typography.bodySmall, color: colors.textMuted, fontSize: 14 },
});
