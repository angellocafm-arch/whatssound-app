import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchTracks, DeezerTrack, formatDuration, getAlbumCoverUrl } from '../lib/deezer';
import { useDebounce } from '../hooks/useDebounce';
import AudioPreview from './AudioPreview';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface SongSearchProps {
  onSongSelect: (track: DeezerTrack) => void;
  sessionId: string;
  placeholder?: string;
  maxResults?: number;
  showAudioPreview?: boolean;
}

interface SearchResult extends DeezerTrack {
  isAdding?: boolean;
}

export default function SongSearch({
  onSongSelect,
  sessionId,
  placeholder = "Buscar canciones...",
  maxResults = 10,
  showAudioPreview = true
}: SongSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Función de búsqueda
  const searchSongs = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      console.log('Buscando canciones:', searchQuery);
      const tracks = await searchTracks(searchQuery.trim(), maxResults);
      
      // Filtrar tracks sin preview o con datos incompletos
      const validTracks = tracks.filter(track => 
        track.preview && 
        track.album?.cover_medium && 
        track.duration > 0
      );

      setResults(validTracks);
    } catch (error) {
      console.error('Error en búsqueda de canciones:', error);
      Alert.alert('Error', 'No se pudieron buscar canciones. Intenta de nuevo.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search - espera 500ms después de que el usuario deje de escribir
  const debouncedSearch = useDebounce(searchSongs, 500);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleSongSelect = useCallback(async (track: SearchResult) => {
    if (track.isAdding) return;

    // Marcar como "agregando" para prevenir dobles clicks
    setResults(prev => prev.map(t => 
      t.id === track.id ? { ...t, isAdding: true } : t
    ));

    try {
      await onSongSelect(track);
      
      // Limpiar búsqueda después de seleccionar
      setQuery('');
      setResults([]);
      setHasSearched(false);
      Keyboard.dismiss();
      
    } catch (error) {
      console.error('Error agregando canción:', error);
      Alert.alert('Error', 'No se pudo agregar la canción. Intenta de nuevo.');
    } finally {
      // Quitar el estado de "agregando"
      setResults(prev => prev.map(t => 
        t.id === track.id ? { ...t, isAdding: false } : t
      ));
    }
  }, [onSongSelect]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const renderSongItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[styles.songItem, item.isAdding && styles.songItemAdding]}
      onPress={() => handleSongSelect(item)}
      disabled={item.isAdding}
    >
      <Image
        source={{ uri: getAlbumCoverUrl(item.album, 'medium') }}
        style={styles.albumCover}
      />
      
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {item.artist.name}
        </Text>
        <Text style={styles.albumName} numberOfLines={1}>
          {item.album.title} • {formatDuration(item.duration)}
        </Text>
      </View>

      {showAudioPreview && (
        <AudioPreview
          previewUrl={item.preview}
          size="small"
          showTitle={false}
        />
      )}

      {item.isAdding ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Ionicons name="add-circle" size={24} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.emptyText}>Buscando canciones...</Text>
        </View>
      );
    }

    if (hasSearched && results.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes-outline" size={48} color={colors.text.secondary} />
          <Text style={styles.emptyText}>No se encontraron canciones</Text>
          <Text style={styles.emptySubtext}>Intenta con otros términos de búsqueda</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={48} color={colors.text.secondary} />
        <Text style={styles.emptyText}>Busca canciones para agregar</Text>
        <Text style={styles.emptySubtext}>Escribe el nombre o artista</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={colors.text.secondary}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id.toString()}
        renderItem={renderSongItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsContainer}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.elevated,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  resultsContainer: {
    flexGrow: 1,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface.elevated,
    borderRadius: 12,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  songItemAdding: {
    opacity: 0.6,
  },
  albumCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surface.base,
  },
  songInfo: {
    flex: 1,
    gap: 2,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  artistName: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  albumName: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});