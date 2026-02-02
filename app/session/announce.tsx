/**
 * WhatsSound — DJ Anunciar (Modal)
 * Referencia: 22-dj-anunciar.png
 * Megafono, input, preview, toggle push, enviar/cancelar
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

export default function AnnounceScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('¡Última hora! Ronda de shots gratis 🥃🔥');
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => router.back()}>
      <TouchableOpacity style={s.card} activeOpacity={1}>
        {/* Megaphone */}
        <Text style={s.emoji}>📢</Text>
        <Text style={s.title}>Mensaje para todos</Text>

        {/* Input */}
        <TextInput
          style={s.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Escribe tu anuncio..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={200}
        />

        {/* Preview */}
        <Text style={s.previewLabel}>Se verá así en el chat:</Text>
        <View style={s.preview}>
          <Text style={s.previewTag}>📣 Anuncio del DJ</Text>
          <Text style={s.previewText}>{message || '...'}</Text>
        </View>

        {/* Push toggle */}
        <View style={s.toggleRow}>
          <Text style={s.toggleLabel}>Con notificación push</Text>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: colors.border, true: colors.primary + '60' }}
            thumbColor={pushEnabled ? colors.primary : colors.textMuted}
          />
        </View>

        {/* Buttons */}
        <View style={s.buttons}>
          <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
            <Text style={s.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.sendBtn} onPress={() => router.back()}>
            <Text style={s.sendText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    padding: spacing.xl, width: '100%', maxWidth: 340,
    alignItems: 'center', gap: spacing.md,
  },
  emoji: { fontSize: 48 },
  title: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  input: {
    width: '100%', backgroundColor: colors.surfaceLight, borderRadius: borderRadius.lg,
    padding: spacing.md, color: colors.textPrimary, fontSize: 15,
    minHeight: 80, textAlignVertical: 'top',
  },
  previewLabel: { ...typography.caption, color: colors.textMuted, alignSelf: 'flex-start', fontSize: 12 },
  preview: {
    width: '100%', backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.lg, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  previewTag: { ...typography.captionBold, color: colors.primary, fontSize: 11, marginBottom: 4 },
  previewText: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  toggleLabel: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 14 },
  buttons: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  cancelBtn: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center' },
  cancelText: { ...typography.button, color: colors.textSecondary, fontSize: 14 },
  sendBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center' },
  sendText: { ...typography.button, color: '#fff', fontSize: 14 },
});
