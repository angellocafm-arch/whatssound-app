/**
 * WhatsSound — AI Suggestions Component
 * Muestra sugerencias de IA para el DJ
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export interface AISuggestion {
  type: 'insight' | 'tip' | 'alert';
  icon: string;
  title: string;
  content: string;
}

interface AISuggestionsProps {
  suggestions: AISuggestion[];
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({ suggestions }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 Sugerencias de IA</Text>
      {suggestions.map((s, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.icon}>{s.icon}</Text>
          <View style={styles.content}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardText}>{s.content}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  cardTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default AISuggestions;
