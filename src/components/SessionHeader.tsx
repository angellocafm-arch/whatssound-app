/**
 * SessionHeader — Header bar with session/DJ info, back button, EN VIVO badge
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';

export interface SessionHeaderProps {
  sessionName: string;
  djName: string;
  displayName: string;
  listenerCount: number;
  isDM: boolean;
  isGroup: boolean;
  isChatMode: boolean;
  onBack: () => void;
  onQueuePress: () => void;
  onDJPanelPress: () => void;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  sessionName, djName, displayName, listenerCount,
  isDM, isGroup, isChatMode,
  onBack, onQueuePress, onDJPanelPress,
}) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
      <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
    </TouchableOpacity>
    {isGroup ? (
      <View style={styles.groupAvatar}>
        <Ionicons name="people" size={18} color={colors.primary} />
      </View>
    ) : (
      <Avatar name={isDM ? displayName : djName} size="sm" online />
    )}
    <View style={styles.headerInfo}>
      <Text style={styles.sessionName}>{isChatMode ? displayName : sessionName}</Text>
      <Text style={styles.djName}>
        {isDM ? 'En línea' : isGroup ? `${listenerCount} miembros` : `${djName} · ${listenerCount} oyentes`}
      </Text>
    </View>
    {!isChatMode && <Badge text="EN VIVO" variant="live" dot />}
    {!isChatMode && (
      <TouchableOpacity style={styles.headerBtn} onPress={onQueuePress}>
        <Ionicons name="musical-notes" size={22} color={colors.primary} />
      </TouchableOpacity>
    )}
    {!isChatMode && (
      <TouchableOpacity style={styles.headerBtn} onPress={onDJPanelPress}>
        <Ionicons name="disc" size={22} color={colors.accent} />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    gap: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  groupAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  headerInfo: { flex: 1 },
  sessionName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  djName: { ...typography.caption, color: colors.textSecondary },
  headerBtn: { padding: spacing.xs },
});
