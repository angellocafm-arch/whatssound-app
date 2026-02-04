/**
 * WhatsSound — Onboarding Emocional
 * Presentación de la app enfocada en la experiencia colectiva
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ViewToken,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Button } from '../../src/components/ui/Button';

const { width, height } = Dimensions.get('window');

// Slides emocionales - enfocados en el "momento mágico"
const slides = [
  {
    id: '1',
    emoji: '🎧',
    preTitle: 'Imagina esto...',
    title: '47 personas escuchando\nla misma canción',
    description: 'Ahora mismo. Contigo.',
    background: '#1a1a2e',
    accentColor: colors.primary,
  },
  {
    id: '2',
    emoji: '🔥',
    preTitle: 'Siente la energía',
    title: 'Las reacciones\nflotan en tu pantalla',
    description: 'Porque la música se vive mejor acompañado.',
    background: '#2d132c',
    accentColor: '#FF6B6B',
  },
  {
    id: '3',
    emoji: '🎵',
    preTitle: 'Tu turno',
    title: 'Pide tu canción\ny mira cómo sube',
    description: 'Vota, apoya, celebra. La playlist la hacemos todos.',
    background: '#0f3460',
    accentColor: '#4ECDC4',
  },
  {
    id: '4',
    emoji: '✨',
    preTitle: '¿Listo?',
    title: 'Tu próxima sesión\nte está esperando',
    description: '',
    background: colors.background,
    accentColor: colors.primary,
    isFinal: true,
  },
];

// Componente de slide individual
const Slide = ({ item, index, scrollX }: { item: typeof slides[0]; index: number; scrollX: SharedValue<number> }) => {
  const emojiScale = useSharedValue(1);
  const emojiRotate = useSharedValue(0);

  useEffect(() => {
    // Animación de entrada del emoji
    emojiScale.value = withSequence(
      withTiming(0.8, { duration: 0 }),
      withTiming(1.2, { duration: 300, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 200 })
    );

    // Pequeña rotación continua
    emojiRotate.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2000 }),
        withTiming(5, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: emojiScale.value },
      { rotate: `${emojiRotate.value}deg` }
    ],
  }));

  // Animación de parallax para el contenido
  const contentStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const translateY = interpolate(scrollX.value, inputRange, [50, 0, -50]);
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0]);
    return { transform: [{ translateY }], opacity };
  });

  return (
    <View style={[styles.slide, { width, backgroundColor: item.background }]}>
      <Animated.View style={contentStyle}>
        {/* Emoji grande animado */}
        <Animated.Text style={[styles.emoji, emojiStyle]}>
          {item.emoji}
        </Animated.Text>

        {/* Pre-título */}
        {item.preTitle && (
          <Text style={[styles.preTitle, { color: item.accentColor }]}>
            {item.preTitle}
          </Text>
        )}

        {/* Título principal */}
        <Text style={styles.title}>{item.title}</Text>

        {/* Descripción */}
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        {/* Elemento visual específico por slide */}
        {index === 0 && <ListenersBubble accentColor={item.accentColor} />}
        {index === 1 && <FloatingReactionsDemo />}
        {index === 2 && <VoteDemo accentColor={item.accentColor} />}
      </Animated.View>
    </View>
  );
};

// Mini componente: burbujas de oyentes
const ListenersBubble = ({ accentColor }: { accentColor: string }) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(500, withTiming(1, { duration: 400, easing: Easing.out(Easing.back(2)) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.listenersBubble, { borderColor: accentColor }, style]}>
      <View style={styles.avatarsRow}>
        <Text style={styles.miniEmoji}>🎧</Text>
        <Text style={[styles.miniEmoji, { marginLeft: -8 }]}>😊</Text>
        <Text style={[styles.miniEmoji, { marginLeft: -8 }]}>🎵</Text>
        <Text style={[styles.miniEmoji, { marginLeft: -8 }]}>💃</Text>
      </View>
      <Text style={styles.listenersText}>+43 más escuchando</Text>
    </Animated.View>
  );
};

// Mini componente: reacciones flotantes demo
const FloatingReactionsDemo = () => {
  const emojis = ['🔥', '❤️', '👏', '😂', '🔥', '❤️'];
  
  return (
    <View style={styles.reactionsDemo}>
      {emojis.map((emoji, i) => (
        <FloatingEmoji key={i} emoji={emoji} delay={i * 200} />
      ))}
    </View>
  );
};

const FloatingEmoji = ({ emoji, delay }: { emoji: string; delay: number }) => {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const x = Math.random() * 60 - 30;

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(1200, withTiming(0, { duration: 500 }))
    ));
    y.value = withDelay(delay, withTiming(-100, { duration: 2000 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { translateX: x }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.floatingEmoji, style]}>{emoji}</Animated.Text>
  );
};

// Mini componente: demo de votación
const VoteDemo = ({ accentColor }: { accentColor: string }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(600, withTiming(0.7, { duration: 1000, easing: Easing.out(Easing.cubic) }));
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.voteDemo}>
      <View style={styles.voteSong}>
        <Text style={styles.voteSongText}>🎵 Tu canción</Text>
        <View style={styles.voteBar}>
          <Animated.View style={[styles.voteFill, { backgroundColor: accentColor }, barStyle]} />
        </View>
        <Text style={styles.voteCount}>+12 votos</Text>
      </View>
    </View>
  );
};

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace('/(auth)/genres');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/genres');
  };

  const isLast = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item, index }) => (
          <Slide item={item} index={index} scrollX={scrollX} />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      />

      {/* Dots indicator */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <Button
          title={isLast ? '¡Vamos!' : 'Siguiente'}
          onPress={handleNext}
          fullWidth
          size="lg"
        />
        {!isLast && (
          <Button
            title="Saltar"
            onPress={handleSkip}
            variant="ghost"
            fullWidth
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  emoji: {
    fontSize: 80,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  preTitle: {
    ...typography.caption,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.base,
    fontSize: 28,
    lineHeight: 36,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceLight || '#333',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  buttonsContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    gap: spacing.sm,
  },
  // Listeners bubble
  listenersBubble: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  avatarsRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  miniEmoji: {
    fontSize: 24,
    backgroundColor: colors.surfaceDark || '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  listenersText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  // Reactions demo
  reactionsDemo: {
    height: 120,
    width: 100,
    marginTop: spacing.lg,
    position: 'relative',
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 28,
    bottom: 0,
    left: '50%',
  },
  // Vote demo
  voteDemo: {
    marginTop: spacing.lg,
    width: '80%',
  },
  voteSong: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  voteSongText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  voteBar: {
    height: 8,
    backgroundColor: colors.surfaceDark || '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  voteFill: {
    height: '100%',
    borderRadius: 4,
  },
  voteCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'right',
  },
});
