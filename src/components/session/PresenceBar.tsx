/**
 * WhatsSound — PresenceBar
 * Muestra quién está escuchando: avatares + contador
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePresence, PresenceUser } from '../../hooks/usePresence';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface Props {
  sessionId: string;
  maxAvatars?: number;
}

export function PresenceBar({ sessionId, maxAvatars = 5 }: Props) {
  const { users, count, isConnected } = usePresence(sessionId);

  const visibleUsers = users.slice(0, maxAvatars);
  const extraCount = Math.max(0, count - maxAvatars);

  return (
    <View style={styles.container}>
      {/* Avatares */}
      <View style={styles.avatarsContainer}>
        {visibleUsers.length > 0 ? (
          <>
            {visibleUsers.map((user, index) => (
              <View
                key={user.id}
                style={[
                  styles.avatar,
                  { 
                    marginLeft: index > 0 ? -10 : 0,
                    zIndex: maxAvatars - index,
                  },
                ]}
              >
                {user.avatar ? (
                  <Text style={styles.avatarEmoji}>{user.avatar}</Text>
                ) : (
                  <Text style={styles.avatarInitial}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            ))}
            {extraCount > 0 && (
              <View style={[styles.avatar, styles.extraAvatar, { marginLeft: -10 }]}>
                <Text style={styles.extraText}>+{extraCount}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyAvatar}>
            <Ionicons name="headset-outline" size={16} color={colors.textMuted} />
          </View>
        )}
      </View>

      {/* Contador con indicador live */}
      <View style={styles.countContainer}>
        <View style={[styles.liveDot, !isConnected && styles.disconnectedDot]} />
        <Text style={styles.countText}>
          {count} {count === 1 ? 'escuchando' : 'escuchando'}
        </Text>
      </View>
    </View>
  );
}

/**
 * Versión compacta solo con contador
 */
export function PresenceCount({ sessionId }: { sessionId: string }) {
  const { count, isConnected } = usePresence(sessionId);

  return (
    <View style={styles.compactContainer}>
      <View style={[styles.liveDotSmall, !isConnected && styles.disconnectedDot]} />
      <Text style={styles.compactText}>{count}</Text>
      <Ionicons name="headset" size={14} color={colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarEmoji: {
    fontSize: 16,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  extraAvatar: {
    backgroundColor: colors.surfaceDark || '#2a2a2a',
  },
  extraText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceDark || '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e', // Verde vivo
  },
  disconnectedDot: {
    backgroundColor: colors.textMuted,
  },
  countText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  // Versión compacta
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  compactText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
});

export default PresenceBar;
