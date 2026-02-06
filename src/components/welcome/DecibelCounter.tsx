/**
 * WhatsSound — DecibelCounter
 * Contador animado de decibelios que sube en tiempo real
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface DecibelCounterProps {
  initialValue?: number;
  incrementPerSecond?: number;
}

export function DecibelCounter({
  initialValue = 247,
  incrementPerSecond = 0.5,
}: DecibelCounterProps) {
  const [value, setValue] = useState(initialValue);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(v => v + 1);
      
      // Pulse animation when incrementing
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1000 / incrementPerSecond);

    return () => clearInterval(interval);
  }, [incrementPerSecond]);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="volume-high" size={32} color={colors.primary} />
      </View>
      <Animated.View style={[styles.valueContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.value}>{Math.floor(value)}</Text>
        <Text style={styles.unit}>dB</Text>
      </Animated.View>
      <Text style={styles.increment}>+1 cada minuto</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    ...typography.h1,
    fontSize: 56,
    color: colors.primary,
    fontWeight: '800',
  },
  unit: {
    ...typography.h2,
    color: colors.primary,
    marginLeft: spacing.xs,
    opacity: 0.8,
  },
  increment: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

export default DecibelCounter;
