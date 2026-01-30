/**
 * WhatsSound — Configuración perfil DJ
 * Nombre artístico, bio, géneros, redes, toggles
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

const GENRES = ['Reggaeton', 'Pop', 'EDM', 'Rock', 'Jazz', 'Techno', 'Hip-Hop', 'Latina'];

export default function DJProfileScreen() {
  const router = useRouter();
  const [artistName, setArtistName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['EDM', 'Techno']);
  const [instagram, setInstagram] = useState('');
  const [soundcloud, setSoundcloud] = useState('');
  const [mixcloud, setMixcloud] = useState('');
  const [acceptTips, setAcceptTips] = useState(false);
  const [showLive, setShowLive] = useState(true);

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  };

  const handleSave = () => {
    Alert.alert('Guardado', 'Tu perfil DJ se ha actualizado correctamente.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil DJ</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Nombre artístico */}
      <Text style={styles.label}>Nombre artístico</Text>
      <TextInput
        style={styles.input}
        value={artistName}
        onChangeText={setArtistName}
        placeholder="Ej: DJ Neon"
        placeholderTextColor={colors.textMuted}
      />

      {/* Bio */}
      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        value={bio}
        onChangeText={setBio}
        placeholder="Cuéntale al mundo quién eres..."
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={200}
      />
      <Text style={styles.charCount}>{bio.length}/200</Text>

      {/* Géneros favoritos */}
      <Text style={styles.label}>Géneros favoritos</Text>
      <View style={styles.chips}>
        {GENRES.map(g => {
          const active = selectedGenres.includes(g);
          return (
            <TouchableOpacity
              key={g}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleGenre(g)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Redes sociales */}
      <Text style={styles.sectionTitle}>Redes sociales</Text>

      <View style={styles.socialRow}>
        <Ionicons name="logo-instagram" size={20} color="#E4405F" />
        <TextInput
          style={styles.socialInput}
          value={instagram}
          onChangeText={setInstagram}
          placeholder="@tu_usuario"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.socialRow}>
        <Ionicons name="cloud-outline" size={20} color="#FF5500" />
        <TextInput
          style={styles.socialInput}
          value={soundcloud}
          onChangeText={setSoundcloud}
          placeholder="soundcloud.com/..."
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.socialRow}>
        <Ionicons name="disc-outline" size={20} color={colors.accent} />
        <TextInput
          style={styles.socialInput}
          value={mixcloud}
          onChangeText={setMixcloud}
          placeholder="mixcloud.com/..."
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Toggles */}
      <Text style={styles.sectionTitle}>Preferencias</Text>

      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>Aceptar propinas</Text>
          <Text style={styles.toggleDesc}>Permite que fans te envíen propinas durante sesiones</Text>
        </View>
        <Switch
          value={acceptTips}
          onValueChange={setAcceptTips}
          trackColor={{ false: colors.surfaceLight, true: colors.primaryDark }}
          thumbColor={acceptTips ? colors.primary : colors.textMuted}
        />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>Mostrar en vivo</Text>
          <Text style={styles.toggleDesc}>Aparece como DJ disponible para sesiones en vivo</Text>
        </View>
        <Switch
          value={showLive}
          onValueChange={setShowLive}
          trackColor={{ false: colors.surfaceLight, true: colors.primaryDark }}
          thumbColor={showLive ? colors.primary : colors.textMuted}
        />
      </View>

      {/* Guardar */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Guardar cambios</Text>
      </TouchableOpacity>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
  },
  bioInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  charCount: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  chipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  socialInput: {
    flex: 1,
    padding: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  toggleDesc: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveBtnText: {
    ...typography.body,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
});
