/**
 * WhatsSound — PlanCard
 * Card de plan con borde luminoso animado
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PlanCardProps {
  name: string;
  icon: string;
  price: string;
  priceNote?: string;
  description: string;
  features: PlanFeature[];
  highlighted?: boolean;
  badge?: string;
  color: string;
}

export function PlanCard({
  name,
  icon,
  price,
  priceNote,
  description,
  features,
  highlighted = false,
  badge,
  color,
}: PlanCardProps) {
  return (
    <View style={[styles.container, highlighted && styles.highlighted]}>
      {/* Animated border - CSS animation for web */}
      <View style={[styles.borderGlow, { borderColor: color + '40' }]}>
        {Platform.OS === 'web' && (
          <div 
            className="glow-trail" 
            style={{ 
              '--glow-color': color,
              position: 'absolute',
              inset: 0,
              borderRadius: 20,
              overflow: 'hidden',
            } as any}
          />
        )}
      </View>

      <View style={[styles.content, highlighted && styles.contentHighlighted]}>
        {badge && (
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}

        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color }]}>{price}</Text>
        </View>
        {priceNote && (
          <Text style={styles.priceNote}>{priceNote}</Text>
        )}

        <View style={styles.divider} />

        <View style={styles.features}>
          {features.slice(0, 4).map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Ionicons
                name={feature.included ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={feature.included ? color : colors.textMuted + '50'}
              />
              <Text style={[
                styles.featureText,
                !feature.included && styles.featureDisabled,
              ]}>
                {feature.text}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    position: 'relative',
  },
  highlighted: {
    transform: [{ scale: 1.02 }],
  },
  borderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    overflow: 'hidden',
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    minHeight: 280,
  },
  contentHighlighted: {
    backgroundColor: colors.primary + '08',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    ...typography.captionBold,
    color: '#fff',
    fontSize: 10,
  },
  icon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 18,
  },
  description: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  priceRow: {
    alignItems: 'center',
  },
  price: {
    ...typography.h2,
    fontSize: 24,
    fontWeight: '800',
  },
  priceNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 10,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  features: {
    gap: spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    fontSize: 11,
  },
  featureDisabled: {
    color: colors.textMuted + '80',
  },
});

export default PlanCard;
