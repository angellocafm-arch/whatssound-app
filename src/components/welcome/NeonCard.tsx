/**
 * WhatsSound — NeonCard
 * Card con borde de neón animado (punto de luz recorriendo)
 * Funciona en web con CSS animations
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
  const dotSize = intensity === 'high' ? 14 : intensity === 'medium' ? 10 : 6;
  const blurSize = intensity === 'high' ? 30 : intensity === 'medium' ? 20 : 10;

  if (Platform.OS === 'web') {
    return (
      <div style={{ position: 'relative', ...style as any }}>
        {/* Border track */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            border: `1px solid ${glowColor}30`,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {/* Moving dot */}
          <div
            style={{
              position: 'absolute',
              width: dotSize,
              height: dotSize,
              background: glowColor,
              borderRadius: '50%',
              boxShadow: `0 0 ${blurSize}px ${glowColor}, 0 0 ${blurSize * 2}px ${glowColor}, 0 0 ${blurSize * 3}px ${glowColor}`,
              animation: 'neonDotMove 4s linear infinite',
            }}
          />
          {/* Trail 1 */}
          <div
            style={{
              position: 'absolute',
              width: dotSize * 0.7,
              height: dotSize * 0.7,
              background: glowColor,
              borderRadius: '50%',
              opacity: 0.6,
              filter: 'blur(3px)',
              boxShadow: `0 0 ${blurSize * 0.7}px ${glowColor}`,
              animation: 'neonDotMove 4s linear infinite',
              animationDelay: '-0.15s',
            }}
          />
          {/* Trail 2 */}
          <div
            style={{
              position: 'absolute',
              width: dotSize * 0.5,
              height: dotSize * 0.5,
              background: glowColor,
              borderRadius: '50%',
              opacity: 0.3,
              filter: 'blur(5px)',
              animation: 'neonDotMove 4s linear infinite',
              animationDelay: '-0.3s',
            }}
          />
        </div>
        {/* Content */}
        <View style={[styles.content, style]}>
          {children}
        </View>
        {/* Inject keyframes */}
        <style>{`
          @keyframes neonDotMove {
            0% { top: 0; left: 0; }
            25% { top: 0; left: calc(100% - ${dotSize}px); }
            50% { top: calc(100% - ${dotSize}px); left: calc(100% - ${dotSize}px); }
            75% { top: calc(100% - ${dotSize}px); left: 0; }
            100% { top: 0; left: 0; }
          }
        `}</style>
      </div>
    );
  }

  // Native fallback - just a subtle border
  return (
    <View style={[styles.nativeCard, { borderColor: glowColor + '40' }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  nativeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default NeonCard;
