/**
 * WhatsSound — DecibelCalculator
 * Calculadora interactiva de cuántos dB puedes ganar
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

const HOURS_OPTIONS = [1, 2, 3, 4, 5, 6];

export function DecibelCalculator() {
  const [selectedHours, setSelectedHours] = useState(2);

  const monthlyDb = selectedHours * 60 * 30; // hours * minutes * days
  const goldenBoosts = Math.floor(monthlyDb / 100);
  const proMonths = Math.floor(monthlyDb / 2000);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cuánto podrías ganar?</Text>
      <Text style={styles.subtitle}>Horas de música al día:</Text>

      <View style={styles.optionsRow}>
        {HOURS_OPTIONS.map(hours => (
          <TouchableOpacity
            key={hours}
            style={[
              styles.option,
              selectedHours === hours && styles.optionSelected,
            ]}
            onPress={() => setSelectedHours(hours)}
          >
            <Text style={[
              styles.optionText,
              selectedHours === hours && styles.optionTextSelected,
            ]}>
              {hours}h
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.resultsCard}>
        <View style={styles.resultMain}>
          <Ionicons name="volume-high" size={28} color={colors.primary} />
          <Text style={styles.resultValue}>{monthlyDb.toLocaleString()}</Text>
          <Text style={styles.resultUnit}>dB/mes</Text>
        </View>

        <View style={styles.resultsDivider} />

        <View style={styles.resultsSecondary}>
          <View style={styles.resultItem}>
            <Ionicons name="trophy" size={20} color="#FFD700" />
            <Text style={styles.resultItemValue}>{goldenBoosts}</Text>
            <Text style={styles.resultItemLabel}>Golden Boosts</Text>
          </View>
          <View style={styles.resultItem}>
            <Ionicons name="star" size={20} color={colors.accent} />
            <Text style={styles.resultItemValue}>{proMonths}</Text>
            <Text style={styles.resultItemLabel}>meses Pro</Text>
          </View>
        </View>
      </View>

      <Text style={styles.hint}>
        💡 Solo escuchando música desbloqueas todo
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },
  optionTextSelected: {
    color: '#fff',
  },
  resultsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  resultMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  resultValue: {
    ...typography.h1,
    fontSize: 40,
    color: colors.primary,
    fontWeight: '800',
  },
  resultUnit: {
    ...typography.body,
    color: colors.textMuted,
  },
  resultsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  resultsSecondary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  resultItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultItemValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  resultItemLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default DecibelCalculator;
