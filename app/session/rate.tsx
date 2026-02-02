/**
 * WhatsSound — Valorar Sesión / DJ
 * Modal con estrellas + comentario
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

export default function RateScreen() {
  const router = useRouter();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => router.back()}>
        <View style={s.card}>
          <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
          <Text style={s.successTitle}>¡Gracias!</Text>
          <Text style={s.successSub}>Tu valoración ayuda a otros usuarios</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => router.back()}>
      <TouchableOpacity style={s.card} activeOpacity={1}>
        <Text style={s.title}>¿Qué te pareció la sesión?</Text>
        <Text style={s.djName}>DJ Carlos Madrid</Text>
        <Text style={s.sessionName}>Viernes Latino 🔥</Text>

        <View style={s.starsRow}>
          {[1,2,3,4,5].map(n => (
            <TouchableOpacity key={n} onPress={() => setStars(n)}>
              <Ionicons name={n <= stars ? 'star' : 'star-outline'} size={40} color={n <= stars ? colors.warning : colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.starsLabel}>{stars === 0 ? 'Toca para valorar' : stars <= 2 ? 'Mejorable' : stars <= 3 ? 'Bien' : stars === 4 ? 'Muy bien' : '¡Increíble!'}</Text>

        <TextInput
          style={s.input}
          placeholder="Deja un comentario (opcional)"
          placeholderTextColor={colors.textMuted}
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={200}
        />

        <View style={s.buttons}>
          <TouchableOpacity style={s.skipBtn} onPress={() => router.back()}>
            <Text style={s.skipText}>Saltar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.sendBtn, stars === 0 && { opacity: 0.4 }]} onPress={() => stars > 0 && setSent(true)}>
            <Text style={s.sendText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl, width: '100%', maxWidth: 340, alignItems: 'center', gap: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  djName: { ...typography.bodyBold, color: colors.primary, fontSize: 15 },
  sessionName: { ...typography.bodySmall, color: colors.textSecondary, fontSize: 13 },
  starsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  starsLabel: { ...typography.caption, color: colors.textMuted, fontSize: 13 },
  input: { width: '100%', backgroundColor: colors.surfaceDark, borderRadius: borderRadius.lg, padding: spacing.md, color: colors.textPrimary, fontSize: 14, minHeight: 70, textAlignVertical: 'top', marginTop: spacing.sm },
  buttons: { flexDirection: 'row', gap: spacing.sm, width: '100%', marginTop: spacing.md },
  skipBtn: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center' },
  skipText: { ...typography.button, color: colors.textMuted, fontSize: 14 },
  sendBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center' },
  sendText: { ...typography.button, color: '#fff', fontSize: 14 },
  successTitle: { ...typography.h2, color: colors.textPrimary, fontSize: 22 },
  successSub: { ...typography.bodySmall, color: colors.textSecondary, fontSize: 14 },
});
