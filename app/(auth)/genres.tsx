/**
 * WhatsSound — Selección de Géneros
 * El usuario elige sus géneros favoritos para personalizar el feed
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Button } from '../../src/components/ui/Button';

const { width } = Dimensions.get('window');

// Géneros con emojis y colores
const GENRES = [
  { id: 'reggaeton', name: 'Reggaetón', emoji: '🔥', color: '#FF6B6B' },
  { id: 'pop', name: 'Pop', emoji: '💖', color: '#FF85C8' },
  { id: 'rock', name: 'Rock', emoji: '🎸', color: '#9B59B6' },
  { id: 'hiphop', name: 'Hip Hop', emoji: '🎤', color: '#3498DB' },
  { id: 'electronic', name: 'Electrónica', emoji: '⚡', color: '#00D4FF' },
  { id: 'latin', name: 'Latin', emoji: '💃', color: '#F39C12' },
  { id: 'indie', name: 'Indie', emoji: '🌿', color: '#2ECC71' },
  { id: 'rnb', name: 'R&B', emoji: '💜', color: '#8E44AD' },
  { id: 'jazz', name: 'Jazz', emoji: '🎷', color: '#D4A574' },
  { id: 'classical', name: 'Clásica', emoji: '🎻', color: '#BDC3C7' },
  { id: 'metal', name: 'Metal', emoji: '🤘', color: '#2C3E50' },
  { id: 'country', name: 'Country', emoji: '🤠', color: '#D35400' },
  { id: 'folk', name: 'Folk', emoji: '🪕', color: '#A67C52' },
  { id: 'soul', name: 'Soul', emoji: '✨', color: '#E74C3C' },
  { id: 'funk', name: 'Funk', emoji: '🕺', color: '#9B59B6' },
  { id: 'kpop', name: 'K-Pop', emoji: '💫', color: '#FF69B4' },
];

const MIN_SELECTION = 3;

interface GenreChipProps {
  genre: typeof GENRES[0];
  selected: boolean;
  onPress: () => void;
}

const GenreChip = ({ genre, selected, onPress }: GenreChipProps) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 50 }),
      withSpring(1, { damping: 15 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.chip,
          selected && { backgroundColor: genre.color + '30', borderColor: genre.color },
          animatedStyle,
        ]}
      >
        <Text style={styles.chipEmoji}>{genre.emoji}</Text>
        <Text style={[styles.chipText, selected && { color: genre.color }]}>
          {genre.name}
        </Text>
        {selected && (
          <Ionicons name="checkmark-circle" size={18} color={genre.color} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function GenresScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleGenre = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    // Guardar géneros seleccionados (en producción: guardar en Supabase)
    console.log('[Genres] Selected:', selected);
    router.replace('/(auth)/login');
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  const canContinue = selected.length >= MIN_SELECTION;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🎵</Text>
        <Text style={styles.title}>¿Qué música te mueve?</Text>
        <Text style={styles.subtitle}>
          Elige al menos {MIN_SELECTION} géneros para personalizar tu experiencia
        </Text>
      </View>

      {/* Selection counter */}
      <View style={styles.counter}>
        <Text style={[styles.counterText, canContinue && styles.counterComplete]}>
          {selected.length} seleccionados
        </Text>
        {canContinue && <Ionicons name="checkmark" size={16} color="#22c55e" />}
      </View>

      {/* Genres grid */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.genresGrid}
        showsVerticalScrollIndicator={false}
      >
        {GENRES.map((genre) => (
          <GenreChip
            key={genre.id}
            genre={genre}
            selected={selected.includes(genre.id)}
            onPress={() => toggleGenre(genre.id)}
          />
        ))}
      </ScrollView>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <Button
          title={canContinue ? 'Continuar' : `Selecciona ${MIN_SELECTION - selected.length} más`}
          onPress={handleContinue}
          fullWidth
          size="lg"
          disabled={!canContinue}
        />
        <Button title="Saltar por ahora" onPress={handleSkip} variant="ghost" fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontSize: 24,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  counterText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
  },
  counterComplete: {
    color: '#22c55e',
  },
  scrollContainer: {
    flex: 1,
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.border,
  },
  chipEmoji: {
    fontSize: 18,
  },
  chipText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  buttonsContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    gap: spacing.sm,
  },
});
