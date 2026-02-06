/**
 * WhatsSound — GlowingBorderCard
 * Card con animación de luz verde recorriendo el borde
 * Sentido antihorario con estela luminosa
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  Platform,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

interface GlowingBorderCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  duration?: number;
  highlighted?: boolean;
}

export function GlowingBorderCard({
  children,
  style,
  glowColor = colors.primary,
  duration = 3000,
  highlighted = false,
}: GlowingBorderCardProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [duration]);

  // Interpolate position around the border (counterclockwise)
  // 0 = top-left, 0.25 = bottom-left, 0.5 = bottom-right, 0.75 = top-right, 1 = top-left
  const glowPosition = animatedValue.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0%', '0%', '100%', '100%', '0%'],
  });

  const glowPositionY = animatedValue.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0%', '100%', '100%', '0%', '0%'],
  });

  // For web, we use CSS animations which are smoother
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.glowBorder, highlighted && styles.highlightedBorder]}>
          <View style={styles.glowTrack}>
            <View 
              style={[
                styles.glowDot,
                { backgroundColor: glowColor },
              ]} 
            />
          </View>
        </View>
        <View style={[styles.content, highlighted && styles.highlightedContent]}>
          {children}
        </View>
      </View>
    );
  }

  // For native, simplified glow effect
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.staticBorder, { borderColor: glowColor + '40' }, highlighted && styles.highlightedBorder]}>
        <View style={[styles.content, highlighted && styles.highlightedContent]}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  highlightedBorder: {
    borderColor: colors.primary + '60',
    borderWidth: 2,
  },
  glowTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    // Animation handled by CSS on web
    animation: 'glowMove 3s linear infinite',
  },
  staticBorder: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl - 1,
    overflow: 'hidden',
  },
  highlightedContent: {
    backgroundColor: colors.primary + '08',
  },
});

export default GlowingBorderCard;
