/**
 * WhatsSound — Multi Sessions Component
 * Lista de salas/sesiones múltiples para Business tier
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export interface MultiSession {
  name: string;
  status: 'live' | 'scheduled' | 'ended';
  listeners: number;
  dj: string;
  time?: string;
}

interface MultiSessionsProps {
  sessions: MultiSession[];
  onAddSession?: () => void;
  onSessionPress?: (session: MultiSession) => void;
}

export const MultiSessions: React.FC<MultiSessionsProps> = ({
  sessions,
  onAddSession,
  onSessionPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📡 Salas activas</Text>
        {onAddSession && (
          <TouchableOpacity style={styles.addBtn} onPress={onAddSession}>
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addBtnText}>Nueva sala</Text>
          </TouchableOpacity>
        )}
      </View>

      {sessions.map((session, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.sessionCard}
          onPress={() => onSessionPress?.(session)}
        >
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionName}>{session.name}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    session.status === 'live' ? '#10B98120' : colors.primary + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: session.status === 'live' ? '#10B981' : colors.primary },
                ]}
              >
                {session.status === 'live' ? '🔴 EN VIVO' : `⏰ ${session.time}`}
              </Text>
            </View>
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionDJ}>DJ: {session.dj}</Text>
            {session.status === 'live' && (
              <Text style={styles.sessionListeners}>
                👥 {session.listeners} oyentes
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  sessionCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sessionName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDJ: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sessionListeners: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default MultiSessions;
