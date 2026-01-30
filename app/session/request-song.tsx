/**
 * WhatsSound — Pedir Canción
 * Búsqueda de canciones via Deezer/Spotify
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useSessionStore } from '../../src/stores/sessionStore';
import { searchTracks as spotifySearch, isSpotifyConfigured } from '../../src/lib/spotify';
import { searchTracks as deezerSearch, type MusicTrack } from '../../src/lib/deezer';
// supabase client not used here — direct fetch() for reliability in China

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  alreadyRequested: boolean;
  albumArt?: string | null;
}

// No mock data — real search only via Deezer/Spotify

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
      setResults(tracks.map(t => ({
        id: t.id,
        title: t.name,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
        alreadyRequested: false,
        albumArt: t.albumArt,
      })));
    }
    setSearching(false);
  };

  const { sid } = useLocalSearchParams<{ sid: string }>();
  const { currentSession } = useSessionStore();
  const sessionId = sid || currentSession?.id || '';

  const handleRequest = async (id: string) => {
    const song = results.find(s => s.id === id);
    if (!song || !sessionId) return;
    setResults(prev => prev.map(s =>
      s.id === id ? { ...s, alreadyRequested: true } : s
    ));

    // 1. Add to queue and get the queue item ID
    const API_URL = 'https://xyehncvvvprrqwnsefcr.supabase.co/rest/v1/';
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTA4OTgsImV4cCI6MjA4NTIyNjg5OH0.VEaTmqpMA7XdUa-tZ7mXib1ciweD7y5UU4dFGZq3EtQ';
    let token = '';
    try { token = JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').access_token || ''; } catch {}
    let userId = '';
    try { userId = JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').user?.id || ''; } catch {}
    const headers: Record<string, string> = {
      'apikey': API_KEY,
      'Authorization': `Bearer ${token || API_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };

    // Insert queue item via direct fetch to get the ID back
    let queueId: string | null = null;
    try {
      const queueRes = await fetch(`${API_URL}queue`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: sessionId, requested_by: userId, song_name: song.title, artist: song.artist }),
      });
      const queueData = await queueRes.json();
      if (Array.isArray(queueData) && queueData[0]?.id) queueId = queueData[0].id;
    } catch (e) {
      console.error('Queue insert error:', e);
    }

    // 2. Create a special "song card" message in the chat with queueId
    if (userId) {
      const songData = JSON.stringify({
        type: 'song',
        title: song.title,
        artist: song.artist,
        album: song.album,
        albumArt: song.albumArt || null,
        duration: song.duration,
        deezerId: song.id,
        queueId: queueId,
      });
      try {
        await fetch(`${API_URL}messages`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: sessionId,
            user_id: userId,
            content: songData,
            is_system: true,
          }),
        });
      } catch (e) {
        console.error('Message insert error:', e);
      }
    }
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
