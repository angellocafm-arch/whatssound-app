/**
 * WhatsSound — BadgeGrid
 * Muestra los badges/logros del usuario
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useBadges, Badge } from '../../hooks';

interface Props {
  userId?: string;
  compact?: boolean;
}

export function BadgeGrid({ userId, compact = false }: Props) {
  const { allBadges, earnedBadges, loading } = useBadges();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const isEarned = (badgeId: string) => earnedBadges.some(b => b.id === badgeId);

  if (loading) return null;
  if (allBadges.length === 0) return null;

  // Versión compacta: solo mostrar badges ganados
  if (compact) {
    if (earnedBadges.length === 0) return null;
    
    return (
      <View style={styles.compactContainer}>
        {earnedBadges.slice(0, 5).map((badge) => (
          <View key={badge.id} style={styles.compactBadge}>
            <Text style={styles.compactIcon}>{badge.icon}</Text>
          </View>
        ))}
        {earnedBadges.length > 5 && (
          <View style={styles.compactMore}>
            <Text style={styles.compactMoreText}>+{earnedBadges.length - 5}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Tus Logros</Text>
      <Text style={styles.subtitle}>
        {earnedBadges.length} de {allBadges.length} conseguidos
      </Text>

      <View style={styles.grid}>
        {allBadges.map((badge) => {
          const earned = isEarned(badge.id);
          return (
            <TouchableOpacity
              key={badge.id}
              style={[styles.badgeItem, !earned && styles.badgeItemLocked]}
              onPress={() => setSelectedBadge(badge)}
              activeOpacity={0.7}
            >
              <Text style={[styles.badgeIcon, !earned && styles.badgeIconLocked]}>
                {badge.icon}
              </Text>
              <Text 
                style={[styles.badgeName, !earned && styles.badgeNameLocked]}
                numberOfLines={2}
              >
                {badge.name}
              </Text>
              {earned && (
                <View style={styles.earnedIndicator}>
                  <Text style={styles.earnedCheck}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modal de detalle */}
      <Modal
        visible={!!selectedBadge}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setSelectedBadge(null)}
        >
          <View style={styles.modalContent}>
            {selectedBadge && (
              <>
                <Text style={styles.modalIcon}>{selectedBadge.icon}</Text>
                <Text style={styles.modalTitle}>{selectedBadge.name}</Text>
                <Text style={styles.modalDescription}>
                  {selectedBadge.description}
                </Text>
                {isEarned(selectedBadge.id) ? (
                  <View style={styles.modalEarned}>
                    <Text style={styles.modalEarnedText}>✓ Conseguido</Text>
                  </View>
                ) : (
                  <View style={styles.modalLocked}>
                    <Text style={styles.modalLockedText}>🔒 Por desbloquear</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginVertical: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    position: 'relative',
  },
  badgeItemLocked: {
    opacity: 0.4,
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  badgeIconLocked: {
    filter: 'grayscale(100%)',
  },
  badgeName: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: colors.textMuted,
  },
  earnedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnedCheck: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Compact
  compactContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  compactBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactIcon: {
    fontSize: 14,
  },
  compactMore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactMoreText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 10,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalEarned: {
    backgroundColor: '#22c55e20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  modalEarnedText: {
    ...typography.captionBold,
    color: '#22c55e',
  },
  modalLocked: {
    backgroundColor: colors.textMuted + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  modalLockedText: {
    ...typography.captionBold,
    color: colors.textMuted,
  },
});

export default BadgeGrid;
