/**
 * WhatsSound — Crear Sesión (DJ)
 * Formulario completo: nombre, género, permisos, cover, tips
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const GENRES = [
  { label: 'Reggaetón', emoji: '🔥' },
  { label: 'Pop', emoji: '🎤' },
  { label: 'Rock', emoji: '🎸' },
  { label: 'Techno', emoji: '🎛️' },
  { label: 'Lo-Fi', emoji: '🌙' },
  { label: 'Hip Hop', emoji: '🎧' },
  { label: 'Indie', emoji: '🌿' },
  { label: 'Jazz', emoji: '🎷' },
  { label: 'Latina', emoji: '💃' },
  { label: 'Electrónica', emoji: '⚡' },
  { label: 'R&B', emoji: '🎵' },
  { label: 'Clásica', emoji: '🎻' },
];

const WHO_OPTIONS = [
  { id: 'everyone', label: 'Todos', icon: 'globe-outline' as const },
  { id: 'vip', label: 'Solo VIP', icon: 'star-outline' as const },
  { id: 'nobody', label: 'Nadie', icon: 'lock-closed-outline' as const },
];

export default function CreateSessionScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowRequests, setAllowRequests] = useState(true);
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [allowChat, setAllowChat] = useState(true);
  const [whoCanRequest, setWhoCanRequest] = useState('everyone');
  const [loading, setLoading] = useState(false);

  const canCreate = name.trim().length > 0 && selectedGenre.length > 0;

  const handleCreate = async () => {
    if (!canCreate) return;
    setLoading(true);
    // In real app: createSession(name, genre, settings)
    setTimeout(() => {
      setLoading(false);
      router.replace('/session/dj-panel' as any);
    }, 800);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear sesión</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Cover photo placeholder */}
      <TouchableOpacity style={styles.coverPlaceholder}>
        <View style={styles.coverIconBg}>
          <Ionicons name="camera" size={28} color={colors.primary} />
        </View>
        <Text style={styles.coverText}>Añadir foto de portada</Text>
        <Text style={styles.coverHint}>Opcional · Aparecerá en la sesión</Text>
      </TouchableOpacity>

      {/* Session name */}
      <Text style={styles.label}>NOMBRE DE LA SESIÓN</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="headset-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          placeholder="Ej: Viernes Latino 🔥"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          maxLength={30}
        />
        <Text style={styles.charCount}>{name.length}/30</Text>
      </View>

      {/* Genre selection */}
      <Text style={styles.label}>GÉNERO PRINCIPAL</Text>
      <View style={styles.genreGrid}>
        {GENRES.map(genre => (
          <TouchableOpacity
            key={genre.label}
            style={[styles.genreChip, selectedGenre === genre.label && styles.genreChipSelected]}
            onPress={() => setSelectedGenre(genre.label)}
          >
            <Text style={styles.genreEmoji}>{genre.emoji}</Text>
            <Text style={[styles.genreText, selectedGenre === genre.label && styles.genreTextSelected]}>
              {genre.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Who can request */}
      <Text style={styles.label}>¿QUIÉN PUEDE PEDIR CANCIONES?</Text>
      <View style={styles.whoRow}>
        {WHO_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.whoOption, whoCanRequest === opt.id && styles.whoOptionSelected]}
            onPress={() => setWhoCanRequest(opt.id)}
          >
            <Ionicons
              name={opt.icon}
              size={20}
              color={whoCanRequest === opt.id ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.whoText, whoCanRequest === opt.id && styles.whoTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Settings */}
      <Text style={styles.label}>CONFIGURACIÓN</Text>
      <View style={styles.settingsCard}>
        <SettingRow
          icon="globe-outline"
          label="Sesión pública"
          subtitle="Cualquiera puede unirse"
          value={isPublic}
          onChange={setIsPublic}
        />
        <SettingRow
          icon="musical-notes-outline"
          label="Permitir peticiones"
          subtitle="Los oyentes pueden pedir canciones"
          value={allowRequests}
          onChange={setAllowRequests}
        />
        <SettingRow
          icon="cash-outline"
          label="Tips activados"
          subtitle="Los oyentes pueden enviar propinas"
          value={tipsEnabled}
          onChange={setTipsEnabled}
        />
        <SettingRow
          icon="chatbubble-outline"
          label="Chat habilitado"
          subtitle="Chat en tiempo real"
          value={allowChat}
          onChange={setAllowChat}
          last
        />
      </View>

      {/* Create button */}
      <TouchableOpacity
        style={[styles.createBtn, !canCreate && styles.createBtnDisabled]}
        onPress={handleCreate}
        disabled={!canCreate || loading}
      >
        {loading ? (
          <Text style={styles.createBtnText}>Creando sesión...</Text>
        ) : (
          <>
            <Ionicons name="headset" size={24} color={colors.textOnPrimary} />
            <Text style={styles.createBtnText}>Crear sesión</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Al crear una sesión, aceptas las condiciones de uso de WhatsSound
      </Text>
    </ScrollView>
  );
}

// ─── Setting Row Component ──────────────────────────────────
const SettingRow = ({ icon, label, subtitle, value, onChange, last }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) => (
  <View style={[styles.settingRow, last && { borderBottomWidth: 0 }]}>
    <Ionicons name={icon} size={20} color={colors.textSecondary} />
    <View style={styles.settingInfo}>
      <Text style={styles.settingText}>{label}</Text>
      <Text style={styles.settingSubtext}>{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: colors.surfaceLight, true: colors.primary + '60' }}
      thumbColor={value ? colors.primary : colors.textMuted}
    />
  </View>
);

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.h3, color: colors.textPrimary },

  // Cover
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  coverIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  coverHint: { ...typography.caption, color: colors.textMuted },

  // Labels
  label: {
    ...typography.captionBold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 16,
  },
  charCount: { ...typography.caption, color: colors.textMuted, fontSize: 11 },

  // Genres
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  genreChipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  genreEmoji: { fontSize: 14 },
  genreText: { ...typography.bodySmall, color: colors.textSecondary },
  genreTextSelected: { color: colors.primary, fontWeight: '600' },

  // Who can request
  whoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  whoOption: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  whoOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  whoText: { ...typography.captionBold, color: colors.textMuted, fontSize: 12 },
  whoTextSelected: { color: colors.primary },

  // Settings
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  settingInfo: { flex: 1 },
  settingText: { ...typography.body, color: colors.textPrimary, fontSize: 15 },
  settingSubtext: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginTop: 1 },

  // Create button
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  createBtnDisabled: {
    backgroundColor: colors.surfaceLight,
    opacity: 0.5,
  },
  createBtnText: {
    ...typography.h3,
    color: colors.textOnPrimary,
    fontSize: 18,
  },

  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 11,
  },
});
