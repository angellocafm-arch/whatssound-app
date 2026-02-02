/**
 * WhatsSound — Crear Sesión
 * Referencia: 25-crear-sesion.png
 * Foto portada, nombre, género pills, toggles, slider, crear
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const GENRES = ['Reggaeton', 'Pop', 'Techno', 'Rock', 'Latin', 'Indie', 'Mix'];

export default function CreateSessionScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set(['Reggaeton', 'Latin']));
  const [isPublic, setIsPublic] = useState(true);
  const [allowRequests, setAllowRequests] = useState(true);
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [maxSongs, setMaxSongs] = useState(3);

  const toggleGenre = (g: string) => {
    const next = new Set(selectedGenres);
    next.has(g) ? next.delete(g) : next.add(g);
    setSelectedGenres(next);
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nueva sesión</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Cover photo */}
        <TouchableOpacity style={s.coverUpload}>
          <Ionicons name="camera" size={32} color={colors.textMuted} />
          <Text style={s.coverText}>Añadir foto de portada</Text>
        </TouchableOpacity>

        {/* Name */}
        <Text style={s.label}>Nombre de la sesión</Text>
        <TextInput
          style={s.input}
          placeholder="Ej: Noche Latina 🎶"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        {/* Genres */}
        <Text style={s.label}>Género musical</Text>
        <View style={s.genresWrap}>
          {GENRES.map(g => (
            <TouchableOpacity
              key={g}
              style={[s.genrePill, selectedGenres.has(g) && s.genrePillActive]}
              onPress={() => toggleGenre(g)}
            >
              <Text style={[s.genreText, selectedGenres.has(g) && s.genreTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Toggles */}
        <View style={s.toggleRow}>
          <Text style={s.toggleLabel}>Sesión pública</Text>
          <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{false: colors.border, true: colors.primary+'60'}} thumbColor={isPublic ? colors.primary : colors.textMuted} />
        </View>
        <View style={s.toggleRow}>
          <Text style={s.toggleLabel}>Permitir peticiones</Text>
          <Switch value={allowRequests} onValueChange={setAllowRequests} trackColor={{false: colors.border, true: colors.primary+'60'}} thumbColor={allowRequests ? colors.primary : colors.textMuted} />
        </View>
        <View style={s.toggleRow}>
          <Text style={s.toggleLabel}>Propinas habilitadas</Text>
          <Switch value={tipsEnabled} onValueChange={setTipsEnabled} trackColor={{false: colors.border, true: colors.primary+'60'}} thumbColor={tipsEnabled ? colors.primary : colors.textMuted} />
        </View>

        {/* Max songs slider (simplified) */}
        <View style={s.sliderRow}>
          <Text style={s.toggleLabel}>Máx. canciones por persona</Text>
          <Text style={s.sliderVal}>{maxSongs}</Text>
        </View>
        <View style={s.sliderTrack}>
          {[1,2,3,4,5].map(n => (
            <TouchableOpacity key={n} style={[s.sliderDot, n <= maxSongs && s.sliderDotActive]} onPress={() => setMaxSongs(n)} />
          ))}
        </View>

        {/* Create button */}
        <TouchableOpacity style={s.createBtn} onPress={() => router.back()}>
          <Text style={s.createText}>Crear sesión 🎧</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  content: { padding: spacing.base, paddingBottom: 40 },
  coverUpload: {
    height: 160, backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  coverText: { ...typography.bodySmall, color: colors.textMuted, fontSize: 14 },
  label: { ...typography.caption, color: colors.textSecondary, fontSize: 13, marginBottom: spacing.sm, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, color: colors.textPrimary, fontSize: 15,
  },
  genresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  genrePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  genrePillActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  genreText: { ...typography.captionBold, color: colors.textMuted, fontSize: 13 },
  genreTextActive: { color: colors.primary },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border + '40',
  },
  toggleLabel: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 15 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.md },
  sliderVal: { ...typography.bodyBold, color: colors.primary, fontSize: 16 },
  sliderTrack: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  sliderDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.border },
  sliderDotActive: { backgroundColor: colors.primary },
  createBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 18, alignItems: 'center', marginTop: spacing.xl },
  createText: { ...typography.button, color: '#fff', fontSize: 17 },
});
