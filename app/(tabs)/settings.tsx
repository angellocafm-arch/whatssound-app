/**
 * WhatsSound — Ajustes
 * Configuración completa del usuario
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';
import { useAuthStore } from '../../src/stores/authStore';
import { StreakCard } from '../../src/components/profile/StreakCard';
import { BadgeGrid } from '../../src/components/profile/BadgeGrid';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  chevron?: boolean;
  color?: string;
  onPress?: () => void;
}

const SettingItem = ({ icon, title, subtitle, chevron = true, color, onPress }: SettingItemProps) => (
  <TouchableOpacity style={styles.settingItem} activeOpacity={0.7} onPress={onPress}>
    <Ionicons name={icon as any} size={22} color={color || colors.textSecondary} />
    <View style={styles.settingInfo}>
      <Text style={[styles.settingTitle, color ? { color } : null]}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {chevron && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile card */}
      <TouchableOpacity style={styles.profileCard} onPress={() => router.push('/edit-profile')}>
        <Avatar name={profile?.display_name || user?.email || '?'} size="xl" />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.display_name || 'Usuario'}</Text>
          <Text style={styles.profileBio}>{profile?.bio || user?.email || ''}</Text>
          <Text style={styles.profileEdit}>Editar perfil →</Text>
        </View>
      </TouchableOpacity>

      {/* Streak */}
      <View style={styles.streakSection}>
        <StreakCard />
      </View>

      {/* Badges */}
      <View style={styles.streakSection}>
        <BadgeGrid />
      </View>

      {/* Account */}
      <SectionHeader title="CUENTA" />
      <View style={styles.section}>
        <SettingItem icon="person-outline" title="Perfil de DJ" subtitle="Configura tu perfil como DJ" onPress={() => router.push('/settings/dj-profile')} />
        <SettingItem icon="stats-chart" title="Mi Dashboard" subtitle="Métricas y estadísticas" onPress={() => router.push('/dj-dashboard')} />
        <SettingItem icon="diamond-outline" title="Suscripción" subtitle="Gestiona tu plan" onPress={() => router.push('/subscription')} />
        <SettingItem icon="card-outline" title="Pagos y volumen" subtitle="Métodos de pago, historial" />
        <SettingItem icon="trophy" title="Golden Boosts" subtitle="Tu historial de reconocimientos" onPress={() => router.push('/profile/golden-history')} />
        <SettingItem icon="gift-outline" title="Invitar amigos" subtitle="Comparte tu código y gana" onPress={() => router.push('/invite')} />
        <SettingItem icon="notifications-outline" title="Notificaciones" subtitle="Sesiones, volumen, menciones" onPress={() => router.push('/settings/notifications')} />
        <SettingItem icon="lock-closed-outline" title="Privacidad" subtitle="Quién puede verte" onPress={() => router.push('/settings/privacy')} />
      </View>

      {/* App */}
      <SectionHeader title="APLICACIÓN" />
      <View style={styles.section}>
        <SettingItem icon="color-palette-outline" title="Apariencia" subtitle="Tema oscuro" onPress={() => router.push('/settings/appearance')} />
        <SettingItem icon="language-outline" title="Idioma" subtitle="Español" />
        <SettingItem icon="volume-medium-outline" title="Audio" subtitle="Calidad, auto-play" onPress={() => router.push('/settings/audio')} />
        <SettingItem icon="cloud-download-outline" title="Almacenamiento" subtitle="42 MB usados" onPress={() => router.push('/settings/storage')} />
      </View>

      {/* Support */}
      <SectionHeader title="SOPORTE" />
      <View style={styles.section}>
        <SettingItem icon="help-circle-outline" title="Centro de ayuda" onPress={() => router.push('/settings/help')} />
        <SettingItem icon="chatbox-outline" title="Contactar soporte" onPress={() => router.push('/settings/help')} />
        <SettingItem icon="document-text-outline" title="Términos y condiciones" onPress={() => router.push('/settings/terms')} />
        <SettingItem icon="shield-outline" title="Política de privacidad" onPress={() => router.push('/settings/terms')} />
      </View>

      {/* Danger zone */}
      <View style={[styles.section, { marginTop: spacing.lg }]}>
        <SettingItem icon="log-out-outline" title="Cerrar sesión" chevron={false} color={colors.warning} onPress={handleSignOut} />
        <SettingItem icon="trash-outline" title="Eliminar cuenta" chevron={false} color={colors.error} onPress={() => router.push('/settings/account-actions')} />
      </View>

      {/* Version */}
      <Text style={styles.version}>WhatsSound v2.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['3xl'] },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.base,
    padding: spacing.base, margin: spacing.base,
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
  },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { ...typography.h3, color: colors.textPrimary },
  profileBio: { ...typography.bodySmall, color: colors.textSecondary },
  profileEdit: { ...typography.captionBold, color: colors.primary, marginTop: spacing.xs },
  streakSection: { paddingHorizontal: spacing.base },
  sectionHeader: {
    ...typography.captionBold, color: colors.textMuted, letterSpacing: 0.5,
    paddingHorizontal: spacing.base, paddingTop: spacing.lg, paddingBottom: spacing.xs,
  },
  section: {
    backgroundColor: colors.surface, marginHorizontal: spacing.base,
    borderRadius: borderRadius.xl, overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: colors.divider,
  },
  settingInfo: { flex: 1, gap: 1 },
  settingTitle: { ...typography.body, color: colors.textPrimary },
  settingSubtitle: { ...typography.caption, color: colors.textMuted },
  version: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
