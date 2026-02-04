/**
 * WhatsSound — SongQueue
 * Cola de canciones con votación
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { isDemoMode } from '../../lib/demo';

export interface QueuedSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover_url?: string;
  votes_count: number;
  requested_by: string;
  requester_name?: string;
  status: 'queued' | 'playing' | 'played' | 'skipped';
  has_voted?: boolean;
}

interface Props {
  sessionId: string;
  songs: QueuedSong[];
  currentSong?: QueuedSong;
  onVote?: (songId: string, newCount: number) => void;
}

export function SongQueue({ sessionId, songs, currentSong, onVote }: Props) {
  const { user } = useAuthStore();

  const handleVote = async (song: QueuedSong) => {
    if (song.has_voted) return;

    // Optimistic update
    onVote?.(song.id, song.votes_count + 1);

    if (isDemoMode()) return;

    try {
      // Insertar voto
      await supabase.from('ws_votes').insert({
        song_id: song.id,
        session_id: sessionId,
        user_id: user?.id,
      });

      // Incrementar contador
      await supabase.rpc('increment_song_votes', { song_uuid: song.id });
    } catch (error) {
      console.error('[SongQueue] Vote error:', error);
      // Revertir
      onVote?.(song.id, song.votes_count);
    }
  };

  const renderSong = useCallback(({ item, index }: { item: QueuedSong; index: number }) => (
    <QueueItem 
      song={item} 
      position={index + 1}
      onVote={() => handleVote(item)}
    />
  ), []);

  if (songs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>La cola está vacía</Text>
        <Text style={styles.emptyText}>Sé el primero en pedir una canción</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Now playing */}
      {currentSong && (
        <View style={styles.nowPlaying}>
          <View style={styles.nowPlayingIndicator}>
            <View style={styles.playingDot} />
            <Text style={styles.nowPlayingLabel}>SONANDO AHORA</Text>
          </View>
          <View style={styles.nowPlayingContent}>
            {currentSong.cover_url ? (
              <Image source={{ uri: currentSong.cover_url }} style={styles.nowPlayingCover} />
            ) : (
              <View style={[styles.nowPlayingCover, styles.nowPlayingCoverPlaceholder]}>
                <Ionicons name="musical-notes" size={24} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.nowPlayingInfo}>
              <Text style={styles.nowPlayingTitle} numberOfLines={1}>{currentSong.title}</Text>
              <Text style={styles.nowPlayingArtist} numberOfLines={1}>{currentSong.artist}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Queue header */}
      <View style={styles.queueHeader}>
        <Text style={styles.queueTitle}>🎵 Siguiente</Text>
        <Text style={styles.queueCount}>{songs.length} canciones</Text>
      </View>

      {/* Queue list */}
      <FlatList
        data={songs}
        keyExtractor={item => item.id}
        renderItem={renderSong}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

interface ItemProps {
  song: QueuedSong;
  position: number;
  onVote: () => void;
}

function QueueItem({ song, position, onVote }: ItemProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (song.has_voted) return;
    
    scale.value = withSequence(
      withTiming(0.95, { duration: 50 }),
      withSpring(1, { damping: 15 })
    );
    onVote();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.queueItem}>
      {/* Position */}
      <Text style={styles.position}>{position}</Text>

      {/* Cover */}
      {song.cover_url ? (
        <Image source={{ uri: song.cover_url }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Ionicons name="musical-notes" size={18} color={colors.textMuted} />
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
        {song.requester_name && (
          <Text style={styles.requester}>Pedida por {song.requester_name}</Text>
        )}
      </View>

      {/* Vote button */}
      <TouchableOpacity onPress={handlePress} disabled={song.has_voted}>
        <Animated.View 
          style={[
            styles.voteButton,
            song.has_voted && styles.voteButtonVoted,
            animatedStyle,
          ]}
        >
          <Ionicons 
            name={song.has_voted ? 'checkmark' : 'arrow-up'} 
            size={16} 
            color={song.has_voted ? colors.textMuted : colors.primary} 
          />
          <Text style={[
            styles.voteCount,
            song.has_voted && styles.voteCountVoted,
          ]}>
            {song.votes_count}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Componente minimalista para mostrar cola inline
 */
export function MiniQueue({ songs, limit = 3 }: { songs: QueuedSong[]; limit?: number }) {
  const visible = songs.slice(0, limit);
  const more = songs.length - limit;

  return (
    <View style={styles.miniQueue}>
      <Text style={styles.miniQueueTitle}>Siguiente:</Text>
      {visible.map((song, i) => (
        <View key={song.id} style={styles.miniQueueItem}>
          <Text style={styles.miniQueueNumber}>{i + 1}.</Text>
          <Text style={styles.miniQueueSong} numberOfLines={1}>
            {song.title}
          </Text>
          <View style={styles.miniQueueVotes}>
            <Ionicons name="arrow-up" size={10} color={colors.textMuted} />
            <Text style={styles.miniQueueVoteCount}>{song.votes_count}</Text>
          </View>
        </View>
      ))}
      {more > 0 && (
        <Text style={styles.miniQueueMore}>+{more} más</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Now playing
  nowPlaying: {
    backgroundColor: colors.primary + '15',
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  nowPlayingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  playingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  nowPlayingLabel: {
    ...typography.captionBold,
    color: colors.primary,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  nowPlayingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nowPlayingCover: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  nowPlayingCoverPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlayingInfo: {
    flex: 1,
  },
  nowPlayingTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 15,
  },
  nowPlayingArtist: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
  // Queue header
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  queueTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 15,
  },
  queueCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  // Queue list
  list: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  position: {
    ...typography.captionBold,
    color: colors.textMuted,
    width: 20,
    textAlign: 'center',
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  coverPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  artist: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  requester: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  // Vote button
  voteButton: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    minWidth: 44,
  },
  voteButtonVoted: {
    backgroundColor: colors.surface,
  },
  voteCount: {
    ...typography.captionBold,
    color: colors.primary,
    fontSize: 12,
  },
  voteCountVoted: {
    color: colors.textMuted,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  // Mini queue
  miniQueue: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  miniQueueTitle: {
    ...typography.captionBold,
    color: colors.textMuted,
    fontSize: 10,
    marginBottom: spacing.xs,
  },
  miniQueueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  miniQueueNumber: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    width: 14,
  },
  miniQueueSong: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 11,
  },
  miniQueueVotes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  miniQueueVoteCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  miniQueueMore: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 10,
    marginTop: spacing.xs,
  },
});

export default SongQueue;
