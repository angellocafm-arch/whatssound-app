/**
 * WhatsSound — FloatingReaction
 * Emoji que flota hacia arriba con movimiento ondulante
 * Estilo TikTok Live / Instagram Live
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

interface Props {
  emoji: string;
  startX: number;
  onComplete: () => void;
}

export function FloatingReaction({ emoji, startX, onComplete }: Props) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    // Escala de entrada (pop)
    scale.value = withSequence(
      withTiming(1.3, { duration: 150, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 100 })
    );

    // Movimiento hacia arriba
    translateY.value = withTiming(-350, {
      duration: 2200,
      easing: Easing.out(Easing.cubic),
    });

    // Movimiento ondulante horizontal
    translateX.value = withSequence(
      withTiming(25, { duration: 550, easing: Easing.inOut(Easing.sin) }),
      withTiming(-25, { duration: 550, easing: Easing.inOut(Easing.sin) }),
      withTiming(15, { duration: 550, easing: Easing.inOut(Easing.sin) }),
      withTiming(-10, { duration: 550, easing: Easing.inOut(Easing.sin) })
    );

    // Fade out al final
    opacity.value = withDelay(
      1700,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, { left: startX }, animatedStyle]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
  },
  emoji: {
    fontSize: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default FloatingReaction;
