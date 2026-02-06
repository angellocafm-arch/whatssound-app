/**
 * WhatsSound — NeonCard
 * Card con borde de neón animado
 * Web: animación CSS | Native: borde estático con glow
 */

import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

interface NeonCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export function NeonCard({
  children,
  style,
  glowColor = colors.primary,
  intensity = 'medium',
}: NeonCardProps) {
  // Siempre usar View para compatibilidad
  return (
    <View style={[
      styles.card, 
      { 
        borderColor: glowColor + '40',
        shadowColor: glowColor,
        shadowOpacity: intensity === 'high' ? 0.4 : intensity === 'medium' ? 0.2 : 0.1,
      }, 
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    // Shadow for glow effect
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 3,
  },
});

export default NeonCard;
