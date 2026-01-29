/**
 * WhatsSound — Pedir Canción
 * Búsqueda con resultados mock (modo simulado)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useSessionStore } from '../../src/stores/sessionStore';
import { searchTracks as spotifySearch, isSpotifyConfigured } from '../../src/lib/spotify';
import { searchTracks as deezerSearch, type MusicTrack } from '../../src/lib/deezer';

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  alreadyRequested: boolean;
  albumArt?: string | null;
}

const MOCK_RESULTS: SearchResult[] = [
  { id: '1', title: 'Gasolina', artist: 'Daddy Yankee', album: 'Barrio Fino', duration: '3:12', alreadyRequested: true },
  { id: '2', title: 'Lo Que Pasó, Pasó', artist: 'Daddy Yankee', album: 'Barrio Fino', duration: '3:29', alreadyRequested: false },
  { id: '3', title: 'Rompe', artist: 'Daddy Yankee', album: 'Barrio Fino', duration: '3:53', alreadyRequested: false },
  { id: '4', title: 'Ella Me Levantó', artist: 'Daddy Yankee', album: 'El Cartel III', duration: '4:02', alreadyRequested: false },
  { id: '5', title: 'Limbo', artist: 'Daddy Yankee', album: 'Prestige', duration: '3:41', alreadyRequested: false },
  { id: '6', title: 'Dura', artist: 'Daddy Yankee', album: 'Dura', duration: '3:21', alreadyRequested: false },
  { id: '7', title: 'Con Calma', artist: 'Daddy Yankee ft. Snow', album: 'Con Calma', duration: '3:30', alreadyRequested: false },
];

const ResultItem = ({ song, onRequest }: { song: SearchResult; onRequest: () => void }) => (
  <TouchableOpacity
    style={styles.resultItem}
    onPress={onRequest}
    disabled={song.alreadyRequested}
    activeOpacity={0.7}
  >
    <View style={styles.albumCover}>
      {song.albumArt ? (
        <Image source={{ uri: song.albumArt }} style={styles.albumImage} />
      ) : (
        <Ionicons name="disc" size={20} color={colors.textMuted} />
      )}
    </View>
    <View style={styles.resultInfo}>
      <Text style={styles.resultTitle} numberOfLines={1}>{song.title}</Text>
      <Text style={styles.resultArtist} numberOfLines={1}>{song.artist} · {song.album}</Text>
    </View>
    <Text style={styles.duration}>{song.duration}</Text>
    {song.alreadyRequested ? (
      <View style={styles.requestedBadge}>
        <Ionicons name="checkmark-circle" size={20} color={colors.textMuted} />
        <Text style={styles.requestedText}>Pedida</Text>
      </View>
    ) : (
      <TouchableOpacity style={styles.requestBtn} onPress={onRequest}>
        <Text style={styles.requestBtnText}>Pedir</Text>
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);

export default function RequestSongScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) { setResults([]); return; }

    setSearching(true);

    if (isSpotifyConfigured()) {
      // Spotify search (when available)
      const tracks = await spotifySearch(text, 10);
      setResults(tracks.map(t => ({
        id: t.id,
        title: t.name,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
        alreadyRequested: false,
        albumArt: t.albumArt,
      })));
    } else {
      // Deezer search (default — free, no API key)
      const tracks = await deezerSearch(text, 10);
      if (tracks.length > 0) {
        setResults(tracks.map(t => ({
          id: t.id,
          title: t.name,
          artist: t.artist,
          album: t.album,
          duration: t.duration,
          alreadyRequested: false,
          albumArt: t.albumArt,
        })));
      } else {
        // Mock fallback if Deezer fails
        setResults(MOCK_RESULTS.filter(s =>
          s.title.toLowerCase().includes(text.toLowerCase()) ||
          s.artist.toLowerCase().includes(text.toLowerCase())
        ));
      }
    }
    setSearching(false);
  };

  const { requestSong } = useSessionStore();
  const sessionId = '9ee38aaa-30a1-4aa8-9925-3155597ad025'; // TODO: from route params

  const handleRequest = async (id: string) => {
    const song = results.find(s => s.id === id);
    if (!song) return;
    setResults(prev => prev.map(s =>
      s.id === id ? { ...s, alreadyRequested: true } : s
    ));
    await requestSong(sessionId, song.title, song.artist);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedir canción</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar canciones, artistas..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoFocus
          selectionColor={colors.primary}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {query.length < 2 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color={colors.surfaceLight} />
          <Text style={styles.emptyTitle}>Busca tu canción</Text>
          <Text style={styles.emptySubtitle}>Escribe al menos 2 caracteres</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ResultItem song={item} onRequest={() => handleRequest(item.id)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !searching ? (
              <View style={styles.emptyState}>
                <Ionicons name="sad" size={48} color={colors.surfaceLight} />
                <Text style={styles.emptyTitle}>Sin resultados</Text>
                <Text style={styles.emptySubtitle}>Prueba con otra búsqueda</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  list: {
    paddingBottom: spacing['3xl'],
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  albumCover: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  albumImage: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 15,
  },
  resultArtist: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  duration: {
    ...typography.caption,
    color: colors.textMuted,
  },
  requestBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  requestBtnText: {
    ...typography.captionBold,
    color: colors.textOnPrimary,
  },
  requestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  requestedText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['5xl'],
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
});
