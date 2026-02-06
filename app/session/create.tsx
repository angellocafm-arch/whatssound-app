/**
 * WhatsSound — Crear Sesión
 * Conectado a Supabase
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { createSession } from '../../src/lib/sessions';
import { isTestMode } from '../../src/lib/demo';

const GENRES = ['Reggaeton', 'Pop', 'Techno', 'Rock', 'Latin', 'Indie', 'Mix', 'House', 'Hip Hop', 'R&B', 'Trap', 'Lo-Fi'];

export default function CreateSessionScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set(['Reggaeton', 'Latin']));
  const [isPublic, setIsPublic] = useState(true);
  const [allowRequests, setAllowRequests] = useState(true);
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [maxSongs, setMaxSongs] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleGenre = (g: string) => {
    const next = new Set(selectedGenres);
    if (next.has(g)) {
      next.delete(g);
    } else if (next.size < 5) {
      next.add(g);
    }
    setSelectedGenres(next);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Introduce un nombre para la sesión');
      return;
    }
    if (selectedGenres.size === 0) {
      setError('Selecciona al menos un género');
      return;
    }

    setLoading(true);
    setError('');

    const result = await createSession({
      name: name.trim(),
      description: description.trim() || undefined,
      genres: Array.from(selectedGenres),
      isPublic,
      allowRequests,
      tipsEnabled,
      maxSongsPerUser: maxSongs,
    });

    setLoading(false);

    if (result.ok && result.session) {
      // Ir a la sesión creada
      router.replace(`/session/${result.session.id}` as any);
    } else {
      setError(result.error || 'Error al crear la sesión');
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nueva sesión</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Test mode badge */}
        {isTestMode() && (
          <View style={s.testBadge}>
            <Ionicons name="flask" size={14} color={colors.warning} />
            <Text style={s.testBadgeText}>Modo demo</Text>
          </View>
        )}

        {/* Error */}
        {error ? (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Cover photo */}
        <TouchableOpacity style={s.coverUpload}>
          <Ionicons name="camera" size={32} color={colors.textMuted} />
          <Text style={s.coverText}>Añadir foto de portada</Text>
        </TouchableOpacity>

        {/* Name */}
        <Text style={s.label}>Nombre de la sesión *</Text>
        <TextInput
          style={s.input}
          placeholder="Ej: Viernes Latino 🔥"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          maxLength={50}
        />

        {/* Description */}
        <Text style={s.label}>Descripción (opcional)</Text>
        <TextInput
          style={[s.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="¿De qué va esta sesión?"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          maxLength={200}
          multiline
        />

        {/* Genres */}
        <Text style={s.label}>Género musical * (máx 5)</Text>
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
        <View style={s.section}>
          <Text style={s.sectionTitle}>Configuración</Text>
          
          <View style={s.toggleRow}>
            <View style={s.toggleInfo}>
              <Text style={s.toggleLabel}>Sesión pública</Text>
              <Text style={s.toggleHint}>Visible en Descubrir</Text>
            </View>
            <Switch 
              value={isPublic} 
              onValueChange={setIsPublic} 
              trackColor={{false: colors.border, true: colors.primary+'60'}} 
              thumbColor={isPublic ? colors.primary : colors.textMuted} 
            />
          </View>
          
          <View style={s.toggleRow}>
            <View style={s.toggleInfo}>
              <Text style={s.toggleLabel}>Permitir peticiones</Text>
              <Text style={s.toggleHint}>Los oyentes pueden pedir canciones</Text>
            </View>
            <Switch 
              value={allowRequests} 
              onValueChange={setAllowRequests} 
              trackColor={{false: colors.border, true: colors.primary+'60'}} 
              thumbColor={allowRequests ? colors.primary : colors.textMuted} 
            />
          </View>
          
          <View style={s.toggleRow}>
            <View style={s.toggleInfo}>
              <Text style={s.toggleLabel}>Volumen habilitado</Text>
              <Text style={s.toggleHint}>Recibe decibelios de tus oyentes</Text>
            </View>
            <Switch 
              value={tipsEnabled} 
              onValueChange={setTipsEnabled} 
              trackColor={{false: colors.border, true: colors.primary+'60'}} 
              thumbColor={tipsEnabled ? colors.primary : colors.textMuted} 
            />
          </View>
        </View>

        {/* Max songs slider */}
        <View style={s.sliderSection}>
          <View style={s.sliderHeader}>
            <Text style={s.toggleLabel}>Máx. canciones por persona</Text>
            <Text style={s.sliderVal}>{maxSongs}</Text>
          </View>
          <View style={s.sliderTrack}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity 
                key={n} 
                style={[s.sliderDot, n <= maxSongs && s.sliderDotActive]} 
                onPress={() => setMaxSongs(n)} 
              >
                <Text style={[s.sliderDotText, n <= maxSongs && s.sliderDotTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Create button */}
        <TouchableOpacity 
          style={[s.createBtn, loading && { opacity: 0.6 }]} 
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.createText}>Crear sesión 🎧</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[s.createBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm }]}
          onPress={() => router.push('/session/announce')}
        >
          <Text style={[s.createText, { color: colors.textPrimary }]}>📢 Anunciar primero</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  content: { padding: spacing.base, paddingBottom: 60 },
  
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning + '15',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  testBadgeText: { ...typography.caption, color: colors.warning },
  
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.error, flex: 1 },
  
  coverUpload: {
    height: 140, backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginBottom: spacing.md,
  },
  coverText: { ...typography.bodySmall, color: colors.textMuted, fontSize: 14 },
  
  label: { ...typography.captionBold, color: colors.textSecondary, fontSize: 13, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, color: colors.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  
  genresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  genrePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  genrePillActive: { backgroundColor: colors.primary + '15', borderColor: colors.primary },
  genreText: { ...typography.captionBold, color: colors.textMuted, fontSize: 13 },
  genreTextActive: { color: colors.primary },
  
  section: { marginTop: spacing.xl },
  sectionTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 16, marginBottom: spacing.sm },
  
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border + '40',
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 15 },
  toggleHint: { ...typography.caption, color: colors.textMuted, fontSize: 12, marginTop: 2 },
  
  sliderSection: { marginTop: spacing.xl },
  sliderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sliderVal: { ...typography.bodyBold, color: colors.primary, fontSize: 18 },
  sliderTrack: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md },
  sliderDot: { 
    width: 44, height: 44, borderRadius: 22, 
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  sliderDotActive: { backgroundColor: colors.primary + '15', borderColor: colors.primary },
  sliderDotText: { ...typography.bodyBold, color: colors.textMuted, fontSize: 16 },
  sliderDotTextActive: { color: colors.primary },
  
  createBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 18, alignItems: 'center', marginTop: spacing.xl },
  createText: { ...typography.button, color: '#fff', fontSize: 17 },
});
