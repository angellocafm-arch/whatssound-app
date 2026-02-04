/**
 * WhatsSound — SongRequest
 * Botón y modal para pedir canciones
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useDebounce } from '../../hooks/useDebounce';
import { isDemoMode } from '../../lib/demo';

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover_url?: string;
  duration_ms?: number;
  preview_url?: string;
  source: 'deezer' | 'spotify' | 'manual';
}

interface Props {
  sessionId: string;
  onSongRequested?: (song: Song) => void;
}

// Demo songs for testing
const DEMO_SEARCH_RESULTS: Song[] = [
  { id: 'd1', title: 'Dakiti', artist: 'Bad Bunny, Jhay Cortez', album: 'El Último Tour Del Mundo', source: 'deezer' },
  { id: 'd2', title: 'Dákiti (Remix)', artist: 'Bad Bunny', source: 'deezer' },
  { id: 'd3', title: 'La Noche de Anoche', artist: 'Bad Bunny, ROSALÍA', source: 'deezer' },
  { id: 'd4', title: 'Yonaguni', artist: 'Bad Bunny', source: 'deezer' },
  { id: 'd5', title: 'Tití Me Preguntó', artist: 'Bad Bunny', source: 'deezer' },
];

export function SongRequestButton({ sessionId, onSongRequested }: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity 
        style={styles.requestButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle" size={20} color={colors.primary} />
        <Text style={styles.requestButtonText}>Pedir canción</Text>
      </TouchableOpacity>

      <SongRequestModal
        visible={modalVisible}
        sessionId={sessionId}
        onClose={() => setModalVisible(false)}
        onSongRequested={(song) => {
          onSongRequested?.(song);
          setModalVisible(false);
        }}
      />
    </>
  );
}

interface ModalProps {
  visible: boolean;
  sessionId: string;
  onClose: () => void;
  onSongRequested: (song: Song) => void;
}

export function SongRequestModal({ visible, sessionId, onClose, onSongRequested }: ModalProps) {
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  
  const debouncedQuery = useDebounce(query, 400);

  // Buscar canciones
  React.useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    searchSongs(debouncedQuery);
  }, [debouncedQuery]);

  const searchSongs = async (q: string) => {
    setLoading(true);

    try {
      if (isDemoMode()) {
        // Simular búsqueda
        await new Promise(resolve => setTimeout(resolve, 500));
        const filtered = DEMO_SEARCH_RESULTS.filter(s => 
          s.title.toLowerCase().includes(q.toLowerCase()) ||
          s.artist.toLowerCase().includes(q.toLowerCase())
        );
        setResults(filtered.length > 0 ? filtered : DEMO_SEARCH_RESULTS);
        return;
      }

      // Llamar a Edge Function de búsqueda
      const { data, error } = await supabase.functions.invoke('search-songs', {
        body: { query: q, limit: 10 },
      });

      if (error) throw error;
      setResults(data?.results || []);
    } catch (error) {
      console.error('[SongRequest] Search error:', error);
      // Fallback a demo
      setResults(DEMO_SEARCH_RESULTS);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (song: Song) => {
    setSubmitting(song.id);
    Keyboard.dismiss();

    try {
      if (isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 800));
        onSongRequested(song);
        Alert.alert('¡Canción pedida!', `"${song.title}" se añadió a la cola`);
        return;
      }

      // Insertar en ws_songs
      const { error } = await supabase.from('ws_songs').insert({
        session_id: sessionId,
        title: song.title,
        artist: song.artist,
        album: song.album,
        cover_url: song.cover_url,
        duration_ms: song.duration_ms,
        preview_url: song.preview_url,
        source: song.source,
        source_id: song.id,
        requested_by: user?.id,
        status: 'queued',
        votes_count: 1, // Auto-voto
      });

      if (error) throw error;

      onSongRequested(song);
      Alert.alert('¡Canción pedida!', `"${song.title}" se añadió a la cola`);
    } catch (error) {
      console.error('[SongRequest] Request error:', error);
      Alert.alert('Error', 'No se pudo añadir la canción');
    } finally {
      setSubmitting(null);
    }
  };

  const renderSong = useCallback(({ item }: { item: Song }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => handleRequest(item)}
      disabled={submitting !== null}
      activeOpacity={0.7}
    >
      <View style={styles.songCover}>
        {item.cover_url ? (
          <View style={styles.songCoverImage} />
        ) : (
          <Ionicons name="musical-notes" size={20} color={colors.textMuted} />
        )}
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      {submitting === item.id ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
      )}
    </TouchableOpacity>
  ), [submitting]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pedir canción</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar canción o artista..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Results */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Buscando...</Text>
            </View>
          ) : results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={item => item.id}
              renderItem={renderSong}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
            />
          ) : query.length > 1 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No se encontraron canciones</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Escribe para buscar canciones</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Button
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  requestButtonText: {
    ...typography.captionBold,
    color: colors.primary,
    fontSize: 13,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 18,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceDark || '#2a2a2a',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
  // Results
  resultsList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  songCover: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: colors.surfaceDark || '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songCoverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  songArtist: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  // States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default SongRequestButton;
