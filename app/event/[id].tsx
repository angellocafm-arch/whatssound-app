/**
 * WhatsSound — Detalle de Evento
 * Info completa del evento programado
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { Card } from '../../src/components/ui/Card';

export default function EventDetailScreen() {
  const router = useRouter();
  const [interested, setInterested] = useState(false);
  const [reminder, setReminder] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header image placeholder */}
      <View style={styles.headerBg}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerOverlay}>
          <Badge text="EVENTO PROGRAMADO" variant="primary" />
        </View>
      </View>

      {/* Event info */}
      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>Sábado Urbano 🎶</Text>
        <View style={styles.djRow}>
          <Avatar name="DJ Marcos" size="sm" />
          <Text style={styles.djText}>DJ Marcos</Text>
          <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
        </View>

        {/* Date & time */}
        <Card style={styles.dateCard}>
          <View style={styles.dateRow}>
            <View style={styles.dateIcon}>
              <Ionicons name="calendar" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.dateMain}>Sábado, 1 de Febrero</Text>
              <Text style={styles.dateSub}>22:00 — 02:00 (4 horas)</Text>
            </View>
          </View>
        </Card>

        {/* Details */}
        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="musical-notes" size={18} color={colors.textSecondary} />
            <Text style={styles.detailText}>Urban, Reggaeton, Latin</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="people" size={18} color={colors.textSecondary} />
            <Text style={styles.detailText}>34 interesados · Público</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="chatbubbles" size={18} color={colors.textSecondary} />
            <Text style={styles.detailText}>Chat y peticiones habilitados</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash" size={18} color={colors.textSecondary} />
            <Text style={styles.detailText}>Decibelios activados</Text>
          </View>
        </Card>

        {/* Description */}
        <Text style={styles.sectionLabel}>DESCRIPCIÓN</Text>
        <Text style={styles.description}>
          Sesión de sábado noche con lo mejor del urbano y reggaeton. Pide tus canciones, vota las de otros y dale decibelios al DJ si te mola. ¡Nos vemos! 🔥
        </Text>

        {/* Interested users */}
        <Text style={styles.sectionLabel}>INTERESADOS (34)</Text>
        <View style={styles.interestedRow}>
          {['Laura', 'Carlos', 'Ana', 'Paco', 'Marta'].map(name => (
            <Avatar key={name} name={name} size="sm" />
          ))}
          <View style={styles.moreAvatar}>
            <Text style={styles.moreText}>+29</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Button
            title={interested ? '✓ Interesado' : 'Me interesa'}
            onPress={() => setInterested(!interested)}
            variant={interested ? 'secondary' : 'primary'}
            fullWidth
            size="lg"
          />
        </View>
        <TouchableOpacity
          style={styles.reminderBtn}
          onPress={() => setReminder(!reminder)}
        >
          <Ionicons
            name={reminder ? 'notifications' : 'notifications-outline'}
            size={18}
            color={reminder ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.reminderText, reminder && { color: colors.primary }]}>
            {reminder ? 'Recordatorio activado' : 'Activar recordatorio'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['3xl'] },
  headerBg: { height: 180, backgroundColor: colors.primary + '30', justifyContent: 'space-between' },
  backBtn: { position: 'absolute', top: spacing.base, left: spacing.base, padding: spacing.xs, backgroundColor: colors.background + '80', borderRadius: borderRadius.full, zIndex: 1 },
  headerOverlay: { padding: spacing.base },
  eventInfo: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  eventName: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm },
  djRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  djText: { ...typography.bodyBold, color: colors.textSecondary },
  dateCard: { padding: spacing.base, marginBottom: spacing.md },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dateIcon: { width: 48, height: 48, borderRadius: borderRadius.lg, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  dateMain: { ...typography.bodyBold, color: colors.textPrimary },
  dateSub: { ...typography.bodySmall, color: colors.textSecondary },
  detailsCard: { padding: spacing.base, gap: spacing.md, marginBottom: spacing.lg },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  detailText: { ...typography.body, color: colors.textPrimary },
  sectionLabel: { ...typography.captionBold, color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.sm },
  description: { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.xl },
  interestedRow: { flexDirection: 'row', gap: -8, marginBottom: spacing.xl },
  moreAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  moreText: { ...typography.captionBold, color: colors.textMuted },
  actionsRow: { marginBottom: spacing.md },
  reminderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  reminderText: { ...typography.bodySmall, color: colors.textSecondary },
});
