/**
 * WhatsSound — Panel de Reacciones Expandido (Bottom Sheet)
 * Referencia: 21-reacciones.png
 * Grid de emojis con contadores, populares resaltadas en verde
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const REACTIONS = [
  { emoji: '🔥', count: 48, popular: true },
  { emoji: '❤️', count: 32, popular: true },
  { emoji: '🎵', count: 18, popular: false },
  { emoji: '🙌', count: 27, popular: true },
  { emoji: '👏', count: 14, popular: false },
  { emoji: '😂', count: 9, popular: false },
  { emoji: '💀', count: 5, popular: false },
  { emoji: '🤠', count: 11, popular: false },
  { emoji: '🎤', count: 7, popular: false },
  { emoji: '🎹', count: 3, popular: false },
  { emoji: '🥁', count: 2, popular: false },
  { emoji: '🎸', count: 6, popular: false },
];

export default function ReactionsScreen() {
  const router = useRouter();
  const [reacted, setReacted] = useState<Set<number>>(new Set());

  const handleReact = (idx: number) => {
    setReacted(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => router.back()}>
      <TouchableOpacity style={s.sheet} activeOpacity={1}>
        <View style={s.handle} />
        <Text style={s.title}>Reacciones</Text>
        <View style={s.grid}>
          {REACTIONS.map((r, i) => {
            const isActive = r.popular || reacted.has(i);
            return (
              <TouchableOpacity
                key={i}
                style={[s.reactionBtn, isActive && s.reactionActive]}
                onPress={() => handleReact(i)}
              >
                <Text style={s.emoji}>{r.emoji}</Text>
                <Text style={[s.count, isActive && s.countActive]}>
                  {r.count + (reacted.has(i) ? 1 : 0)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.xl, paddingBottom: 40,
  },
  handle: { width: 40, height: 4, backgroundColor: colors.borderLight, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary, fontSize: 18, textAlign: 'center', marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reactionBtn: {
    width: '23%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceDark, borderRadius: borderRadius.lg,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  reactionActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  emoji: { fontSize: 32, marginBottom: 4 },
  count: { ...typography.captionBold, color: colors.textMuted, fontSize: 13 },
  countActive: { color: colors.primary },
});
