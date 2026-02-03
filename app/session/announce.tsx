/**
 * WhatsSound — DJ Anunciar (Modal)
 * Conectado a Supabase - envía mensaje al chat de sesión
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';
import { isTestMode, getOrCreateTestUser } from '../../src/lib/demo';

export default function AnnounceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const [message, setMessage] = useState('');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !params.sessionId) return;

    setLoading(true);

    try {
      // Obtener user id (DJ)
      let userId: string;
      let userName: string;
      
      if (isTestMode()) {
        const testProfile = await getOrCreateTestUser();
        if (!testProfile) {
          Alert.alert('Error', 'No se pudo obtener usuario');
          setLoading(false);
          return;
        }
        userId = testProfile.id;
        userName = testProfile.display_name;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          Alert.alert('Error', 'Debes iniciar sesión');
          setLoading(false);
          return;
        }
        userId = user.id;
        const { data: profile } = await supabase
          .from('ws_profiles')
          .select('display_name, dj_name')
          .eq('id', user.id)
          .single();
        userName = profile?.dj_name || profile?.display_name || 'DJ';
      }

      // Crear mensaje de anuncio en el chat
      const { error } = await supabase
        .from('ws_messages')
        .insert({
          session_id: params.sessionId,
          user_id: userId,
          content: message.trim(),
          message_type: 'announcement', // Tipo especial para anuncios
          is_seed: false,
        });

      if (error) {
        console.error('Error sending announcement:', error);
        Alert.alert('Error', 'No se pudo enviar el anuncio');
        setLoading(false);
        return;
      }

      // TODO: Si pushEnabled, enviar notificación push a todos los miembros
      // Esto requeriría integración con Firebase/Expo Push

      Alert.alert(
        '¡Anuncio enviado!',
        'Todos los oyentes verán tu mensaje',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      console.error('Error:', e);
      Alert.alert('Error', 'Algo salió mal');
    }

    setLoading(false);
  };

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
        <Text style={s.charCount}>{message.length}/200</Text>

        {/* Preview */}
        {message.trim() && (
          <>
            <Text style={s.previewLabel}>Se verá así en el chat:</Text>
            <View style={s.preview}>
              <Text style={s.previewTag}>📣 Anuncio del DJ</Text>
              <Text style={s.previewText}>{message}</Text>
            </View>
          </>
        )}

        {/* Push toggle */}
        <View style={s.toggleRow}>
          <View>
            <Text style={s.toggleLabel}>Con notificación push</Text>
            <Text style={s.toggleHint}>Todos recibirán una notificación</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: colors.border, true: colors.primary + '60' }}
            thumbColor={pushEnabled ? colors.primary : colors.textMuted}
          />
        </View>

        {/* Buttons */}
        <View style={s.buttons}>
          <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} disabled={loading}>
            <Text style={s.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.sendBtn, (!message.trim() || loading) && { opacity: 0.5 }]} 
            onPress={handleSend}
            disabled={!message.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.sendText}>Enviar</Text>
            )}
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
    minHeight: 100, textAlignVertical: 'top',
  },
  charCount: { ...typography.caption, color: colors.textMuted, alignSelf: 'flex-end', marginTop: -8 },
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
  toggleHint: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  buttons: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  cancelBtn: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center' },
  cancelText: { ...typography.button, color: colors.textSecondary, fontSize: 14 },
  sendBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center' },
  sendText: { ...typography.button, color: '#fff', fontSize: 14 },
});
