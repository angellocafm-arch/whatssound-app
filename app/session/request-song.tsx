/**
 * WhatsSound — Pedir Canción (Demo Inversores)
 * Buscador con resultados mock de canciones reales
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

interface Song {
  id: string; title: string; artist: string; album: string;
  art: string; dur: string; requested: boolean;
}

const ALL_SONGS: Song[] = [
  { id:'s1', title:'Gasolina', artist:'Daddy Yankee', album:'Barrio Fino', art:'https://e-cdns-images.dzcdn.net/images/cover/ed4fed49e1447e63e4e8d0e0e3a20ca3/500x500-000000-80-0-0.jpg', dur:'3:12', requested:false },
  { id:'s2', title:'Despacito', artist:'Luis Fonsi ft. Daddy Yankee', album:'Vida', art:'https://e-cdns-images.dzcdn.net/images/cover/11be4e951f2e7467b255f4e2a4c37ae8/500x500-000000-80-0-0.jpg', dur:'3:47', requested:false },
  { id:'s3', title:'Dákiti', artist:'Bad Bunny & Jhay Cortez', album:'El Último Tour Del Mundo', art:'https://e-cdns-images.dzcdn.net/images/cover/59e41ee07b3a9af3e1a8a6ce79b5a7bb/500x500-000000-80-0-0.jpg', dur:'3:25', requested:false },
  { id:'s4', title:'La Bicicleta', artist:'Shakira & Carlos Vives', album:'El Dorado', art:'https://e-cdns-images.dzcdn.net/images/cover/a61aec4942e11c528e0dda3a39978af3/500x500-000000-80-0-0.jpg', dur:'3:40', requested:false },
  { id:'s5', title:'Vivir Mi Vida', artist:'Marc Anthony', album:'3.0', art:'https://e-cdns-images.dzcdn.net/images/cover/cf1ef4ff2daa7e6fde7a171f8e934b33/500x500-000000-80-0-0.jpg', dur:'4:11', requested:false },
  { id:'s6', title:'Bailando', artist:'Enrique Iglesias ft. Gente de Zona', album:'Sex and Love', art:'https://e-cdns-images.dzcdn.net/images/cover/92339ea3a0e32a55b tried/500x500-000000-80-0-0.jpg', dur:'4:03', requested:false },
  { id:'s7', title:'Chantaje', artist:'Shakira ft. Maluma', album:'El Dorado', art:'https://e-cdns-images.dzcdn.net/images/cover/a61aec4942e11c528e0dda3a39978af3/500x500-000000-80-0-0.jpg', dur:'3:16', requested:false },
  { id:'s8', title:'Mi Gente', artist:'J Balvin & Willy William', album:'Vibras', art:'https://e-cdns-images.dzcdn.net/images/cover/3a4b53ea7d5a277c6d7928e0634e6e67/500x500-000000-80-0-0.jpg', dur:'3:09', requested:false },
  { id:'s9', title:'Tusa', artist:'KAROL G & Nicki Minaj', album:'KG0516', art:'https://e-cdns-images.dzcdn.net/images/cover/74b5074bfa0356b1c87bb77b0a01be7c/500x500-000000-80-0-0.jpg', dur:'3:20', requested:false },
  { id:'s10', title:'Safaera', artist:'Bad Bunny, Jowell & Randy, Ñengo Flow', album:'YHLQMDLG', art:'https://e-cdns-images.dzcdn.net/images/cover/59e41ee07b3a9af3e1a8a6ce79b5a7bb/500x500-000000-80-0-0.jpg', dur:'4:56', requested:false },
  { id:'s11', title:'Hawái', artist:'Maluma', album:'Papi Juancho', art:'https://e-cdns-images.dzcdn.net/images/cover/3f44e7de72e1cce0a929e5e6a03a7be5/500x500-000000-80-0-0.jpg', dur:'3:26', requested:false },
  { id:'s12', title:'Ella Baila Sola', artist:'Eslabon Armado & Peso Pluma', album:'Desvelado', art:'https://e-cdns-images.dzcdn.net/images/cover/f76289eaeb3bb4cb4d58a5a4a1f1b1f5/500x500-000000-80-0-0.jpg', dur:'2:52', requested:false },
];

export default function RequestSongScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>(ALL_SONGS);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const filtered = query.length < 1 ? [] : songs.filter(s =>
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    s.artist.toLowerCase().includes(query.toLowerCase())
  );

  const request = (id: string) => {
    setSongs(p => p.map(s => s.id === id ? { ...s, requested: true } : s));
    setConfirmed(id);
    setTimeout(() => router.back(), 1200);
  };

  return (
    <View style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Pedir canción</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={st.searchWrap}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={st.searchInput}
          placeholder="Buscar canciones, artistas..."
          placeholderTextColor={colors.textMuted}
          value={query} onChangeText={setQuery}
          autoFocus selectionColor={colors.primary}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); }}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Confirmed toast */}
      {confirmed && (
        <View style={st.toast}>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          <Text style={st.toastText}>¡Canción añadida a la cola!</Text>
        </View>
      )}

      {query.length < 1 ? (
        <View style={st.empty}>
          <Ionicons name="search" size={48} color={colors.surfaceLight} />
          <Text style={st.emptyTitle}>Busca tu canción</Text>
          <Text style={st.emptySub}>Escribe al menos 1 carácter</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingBottom: spacing['3xl'] }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={st.resultItem}
              onPress={() => !item.requested && request(item.id)}
              disabled={item.requested}
              activeOpacity={0.7}
            >
              <Image source={{ uri: item.art }} style={st.resultArt} />
              <View style={{ flex: 1 }}>
                <Text style={st.resultTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={st.resultArtist} numberOfLines={1}>{item.artist} · {item.album}</Text>
              </View>
              <Text style={st.resultDur}>{item.dur}</Text>
              {item.requested ? (
                <View style={st.requestedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
              ) : (
                <View style={st.requestBtn}>
                  <Text style={st.requestBtnText}>Pedir</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={st.empty}>
              <Ionicons name="sad" size={48} color={colors.surfaceLight} />
              <Text style={st.emptyTitle}>Sin resultados</Text>
              <Text style={st.emptySub}>Prueba con otra búsqueda</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: colors.surface },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: spacing.base, marginVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg, gap: spacing.sm, minHeight: 44 },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, paddingVertical: spacing.sm },
  toast: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary + '20', marginHorizontal: spacing.base, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  toastText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, gap: spacing.md, borderBottomWidth: .5, borderBottomColor: colors.divider },
  resultArt: { width: 48, height: 48, borderRadius: borderRadius.md },
  resultTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  resultArtist: { ...typography.caption, color: colors.textSecondary },
  resultDur: { ...typography.caption, color: colors.textMuted },
  requestBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  requestBtnText: { ...typography.captionBold, color: colors.textOnPrimary },
  requestedBadge: { padding: spacing.xs },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing['5xl'], gap: spacing.sm },
  emptyTitle: { ...typography.h3, color: colors.textSecondary },
  emptySub: { ...typography.body, color: colors.textMuted },
});
