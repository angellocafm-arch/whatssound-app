/**
 * WhatsSound — Pedir Canción
 * Referencia: 18-pedir-cancion.png
 * Búsqueda + resultados con botón Pedir / ✓ Pedida
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const COLORS = ['#E91E63', '#00BCD4', '#FF9800', '#3F51B5', '#009688', '#9C27B0', '#FF5722', '#4CAF50'];

const RESULTS = [
  { id:'1', title: 'Dakiti', artist: 'Bad Bunny, Jhay Cortez', duration: '3:25' },
  { id:'2', title: 'Titi Me Preguntó', artist: 'Bad Bunny', duration: '4:03' },
  { id:'3', title: 'Yonaguni', artist: 'Bad Bunny', duration: '3:27' },
  { id:'4', title: 'Callaíta', artist: 'Bad Bunny', duration: '4:16' },
  { id:'5', title: 'Moscow Mule', artist: 'Bad Bunny', duration: '4:11' },
  { id:'6', title: 'Efecto', artist: 'Bad Bunny', duration: '3:32' },
];

export default function RequestSongScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('bad bunny');
  const [requested, setRequested] = useState<Set<string>>(new Set(['2']));

  const handleRequest = (id: string) => {
    setRequested(prev => new Set(prev).add(id));
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Pedir canción</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={s.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Buscar canción o artista..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      {/* Results */}
      <ScrollView contentContainerStyle={s.results}>
        {RESULTS.map((song, i) => {
          const isRequested = requested.has(song.id);
          return (
            <View key={song.id} style={s.songRow}>
              {/* Album art placeholder */}
              <View style={[s.albumArt, { backgroundColor: COLORS[i % COLORS.length] }]}>
                <Ionicons name="musical-notes" size={18} color="rgba(255,255,255,0.7)" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.songTitle}>{song.title}</Text>
                <Text style={s.songArtist}>{song.artist}</Text>
                <Text style={s.songDuration}>{song.duration}</Text>
              </View>
              {isRequested ? (
                <View style={s.requestedBtn}>
                  <Text style={s.requestedText}>✓ Pedida</Text>
                </View>
              ) : (
                <TouchableOpacity style={s.requestBtn} onPress={() => handleRequest(song.id)}>
                  <Text style={s.requestBtnText}>Pedir</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Footer */}
        <Text style={s.footer}>Powered by <Text style={{ color: colors.primary }}>Deezer</Text></Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: borderRadius.full,
    marginHorizontal: spacing.base, paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 15 },
  results: { paddingHorizontal: spacing.base, paddingBottom: 40 },
  songRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border + '40',
  },
  albumArt: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  songTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  songArtist: { ...typography.caption, color: colors.textSecondary, fontSize: 12, marginTop: 1 },
  songDuration: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginTop: 1 },
  requestBtn: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: borderRadius.full },
  requestBtnText: { ...typography.buttonSmall, color: '#fff', fontSize: 13 },
  requestedBtn: { backgroundColor: colors.surfaceLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full },
  requestedText: { ...typography.captionBold, color: colors.textMuted, fontSize: 12 },
  footer: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, fontSize: 12 },
});
