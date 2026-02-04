/**
 * WhatsSound — Config Notificaciones
 * Ajustes de qué notificaciones recibir
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

interface NotifToggle {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  default: boolean;
}

const NOTIF_SETTINGS: { section: string; items: NotifToggle[] }[] = [
  {
    section: 'SESIONES',
    items: [
      { key: 'session_start', title: 'Sesión iniciada', subtitle: 'Cuando alguien de tu grupo inicia música', icon: 'headset', default: true },
      { key: 'session_end', title: 'Sesión terminada', subtitle: 'Resumen cuando termina una sesión', icon: 'stop-circle', default: true },
      { key: 'song_played', title: 'Tu canción suena', subtitle: 'Cuando reproducen tu canción pedida', icon: 'musical-note', default: true },
    ],
  },
  {
    section: 'PROPINAS',
    items: [
      { key: 'tip_received', title: 'Volumen recibido', subtitle: 'Cuando recibes una decibelios como DJ', icon: 'cash', default: true },
      { key: 'tip_message', title: 'Mensaje con propina', subtitle: 'Cuando una decibelios incluyen mensaje', icon: 'chatbox', default: true },
    ],
  },
  {
    section: 'SOCIAL',
    items: [
      { key: 'new_follower', title: 'Nuevo seguidor', subtitle: 'Cuando alguien te sigue', icon: 'person-add', default: true },
      { key: 'mention', title: 'Menciones', subtitle: 'Cuando te mencionan en un chat', icon: 'at', default: true },
      { key: 'group_invite', title: 'Invitaciones a grupo', subtitle: 'Cuando te invitan a un grupo', icon: 'people', default: true },
    ],
  },
  {
    section: 'EVENTOS',
    items: [
      { key: 'event_reminder', title: 'Recordatorios', subtitle: 'Antes de un evento que te interesa', icon: 'alarm', default: true },
      { key: 'event_new', title: 'Nuevos eventos', subtitle: 'De DJs que sigues', icon: 'calendar', default: false },
    ],
  },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_SETTINGS.flatMap(s => s.items.map(i => [i.key, i.default])))
  );

  const toggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 24 }} />
      </View>

      {NOTIF_SETTINGS.map(section => (
        <View key={section.section}>
          <Text style={styles.sectionLabel}>{section.section}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, i) => (
              <View key={item.key} style={[styles.row, i < section.items.length - 1 && styles.rowBorder]}>
                <Ionicons name={item.icon as any} size={20} color={colors.textSecondary} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowSub}>{item.subtitle}</Text>
                </View>
                <Switch
                  value={settings[item.key]}
                  onValueChange={() => toggle(item.key)}
                  trackColor={{ false: colors.surfaceLight, true: colors.primary + '60' }}
                  thumbColor={settings[item.key] ? colors.primary : colors.textMuted}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['3xl'] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  sectionLabel: { ...typography.captionBold, color: colors.textMuted, letterSpacing: 0.5, paddingHorizontal: spacing.base, marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionCard: { backgroundColor: colors.surface, marginHorizontal: spacing.base, borderRadius: borderRadius.xl, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: colors.divider },
  rowInfo: { flex: 1, gap: 1 },
  rowTitle: { ...typography.body, color: colors.textPrimary },
  rowSub: { ...typography.caption, color: colors.textMuted },
});
