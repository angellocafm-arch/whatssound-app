/**
 * WhatsSound — Enviar Propina (Bottom Sheet style)
 * Referencia: 26-enviar-propina.png
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const AMOUNTS = [1, 2, 5, 10];
const { height: SCREEN_H } = Dimensions.get('window');

export default function SendTipScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(5);
  const [custom, setCustom] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const amount = custom ? Number(custom) : (selected || 0);

  if (sent) {
    return (
      <View style={s.container}>
        <View style={s.overlay} />
        <View style={s.successSheet}>
          <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          <Text style={s.successTitle}>¡Propina enviada!</Text>
          <Text style={s.successAmount}>€{amount}</Text>
          <Text style={s.successSub}>DJ Carlos Madrid te lo agradece 🙌</Text>
          <TouchableOpacity style={s.sendBtn} onPress={() => router.back()}>
            <Text style={s.sendBtnText}>Volver a la sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Overlay oscuro - tap para cerrar */}
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => router.back()} />

      {/* Bottom Sheet */}
      <View style={s.sheet}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Title */}
        <Text style={s.title}>Propina para DJ Carlos Madrid 🎧</Text>
        <Text style={s.subtitle}>Apoya al DJ con una propina</Text>

        {/* Amount pills */}
        <View style={s.amountsRow}>
          {AMOUNTS.map(amt => (
            <TouchableOpacity
              key={amt}
              style={[s.pill, selected === amt && !custom && s.pillSelected]}
              onPress={() => { setSelected(amt); setCustom(''); }}
            >
              <Text style={[s.pillText, selected === amt && !custom && s.pillTextSelected]}>€{amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Otro */}
        <TouchableOpacity
          style={[s.pill, s.pillOtro, custom ? s.pillSelected : {}]}
          onPress={() => { setSelected(null); setCustom(''); }}
        >
          <Text style={[s.pillText, custom ? s.pillTextSelected : {}]}>Otro</Text>
        </TouchableOpacity>

        {custom !== '' || (!selected) ? (
          <TextInput
            style={s.customInput}
            placeholder="€0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={custom}
            onChangeText={(t) => { setCustom(t); setSelected(null); }}
            autoFocus
          />
        ) : null}

        {/* Message */}
        <TextInput
          style={s.messageInput}
          placeholder="¡Gran sesión!"
          placeholderTextColor={colors.textMuted}
          value={message}
          onChangeText={setMessage}
          maxLength={100}
        />

        {/* Note */}
        <Text style={s.note}>Tu propina sube tu canción en la cola ⬆️</Text>

        {/* Send button */}
        <TouchableOpacity
          style={[s.sendBtn, amount <= 0 && { opacity: 0.4 }]}
          onPress={() => amount > 0 && setSent(true)}
          disabled={amount <= 0}
        >
          <Text style={s.sendBtnText}>Enviar propina · €{amount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    paddingBottom: 40,
    gap: spacing.md,
  },
  handle: { width: 40, height: 4, backgroundColor: colors.borderLight, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: -8 },
  amountsRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.full,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  pillSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  pillText: { ...typography.bodyBold, color: colors.textSecondary, fontSize: 15 },
  pillTextSelected: { color: colors.primary },
  pillOtro: { alignSelf: 'flex-start', paddingHorizontal: 24, flex: 0 },
  customInput: {
    backgroundColor: colors.surfaceDark, borderRadius: borderRadius.lg,
    padding: spacing.md, color: colors.textPrimary, fontSize: 18,
    textAlign: 'center', borderWidth: 1, borderColor: colors.border,
  },
  messageInput: {
    backgroundColor: colors.surfaceDark, borderRadius: borderRadius.lg,
    padding: spacing.md, color: colors.textPrimary, fontSize: 15,
  },
  note: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  sendBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  sendBtnText: { ...typography.button, color: '#fff', fontSize: 16 },
  successSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.xl, paddingVertical: 60,
    alignItems: 'center', gap: spacing.md,
  },
  successTitle: { ...typography.h2, color: colors.textPrimary },
  successAmount: { ...typography.h1, color: colors.primary, fontSize: 48 },
  successSub: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
});
