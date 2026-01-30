/**
 * WhatsSound — Cola de Canciones
 * Lista con votación, canción actual, siguientes
 * Conectada a Supabase via sessionStore
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useSessionStore } from '../../src/stores/sessionStore';
import { supabase } from '../../src/lib/supabase';

// Session ID from route params

interface Song {
  id: string;
  title: string;
  artist: string;
  requestedBy: string;
  votes: number;
  userVoted: boolean;
  status: 'playing' | 'next' | 'queued';
  duration: string;
  fromDB?: boolean;
}

// No mock data — all from Supabase

const SongItem = ({ song, onVote }: { song: Song; onVote: () => void }) => (
  <View style={[styles.songItem, song.status === 'playing' && styles.songPlaying]}>
    {/* Status indicator */}
    <View style={styles.songLeft}>
      {song.status === 'playing' ? (
        <View style={styles.playingIcon}>
          <Ionicons name="musical-note" size={18} color={colors.primary} />
        </View>
      ) : (
        <View style={styles.albumThumb}>
          <Ionicons name="disc" size={18} color={colors.textMuted} />
        </View>
      )}
    </View>

    {/* Song info */}
    <View style={styles.songInfo}>
      <View style={styles.titleRow}>
        <Text style={[styles.songTitle, song.status === 'playing' && styles.songTitlePlaying]} numberOfLines={1}>
          {song.title}
        </Text>
        {song.fromDB && (
          <View style={styles.dbBadge}>
            <Text style={styles.dbBadgeText}>DB</Text>
          </View>
        )}
      </View>
      <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
      <Text style={styles.requestedBy}>
        Pedida por {song.requestedBy} · {song.duration}
      </Text>
    </View>

    {/* Vote button */}
    <TouchableOpacity style={styles.voteContainer} onPress={onVote}>
      <Ionicons
        name={song.userVoted ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
        size={28}
        color={song.userVoted ? colors.primary : colors.textMuted}
      />
      <Text style={[styles.voteCount, song.userVoted && styles.voteCountActive]}>
        {song.votes}
      </Text>
    </TouchableOpacity>
  </View>
);

export default function QueueScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = id || '';
  const { queue: dbQueue, loading, fetchQueue, voteSong } = useSessionStore();
  const [localQueue, setLocalQueue] = useState<Song[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Map DB queue items to Song format
  const mapDBtoSong = useCallback((items: typeof dbQueue): Song[] => {
    return items.map((q, i) => ({
      id: q.id,
      title: q.song_name,
      artist: q.artist,
      requestedBy: q.requester_name || 'Anónimo',
      votes: q.votes,
      userVoted: false,
      status: q.status === 'playing' ? 'playing' : i === 0 && q.status === 'pending' ? 'next' : 'queued',
      duration: '--:--',
      fromDB: true,
    }));
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    fetchQueue(sessionId).catch(() => setFetchError(true));

    // Realtime: refresh queue on any change
    const channel = supabase
      .channel(`queue-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'queue',
        filter: `session_id=eq.${sessionId}`,
      }, () => {
        fetchQueue(sessionId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  useEffect(() => {
    setLocalQueue(mapDBtoSong(dbQueue));
  }, [dbQueue, mapDBtoSong]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchQueue(sessionId);
    setRefreshing(false);
  }, [fetchQueue, sessionId]);

  const handleVote = (id: string, fromDB?: boolean) => {
    // Optimistic local update
    setLocalQueue(prev => prev.map(song => {
      if (song.id === id) {
        return {
          ...song,
          userVoted: !song.userVoted,
          votes: song.userVoted ? song.votes - 1 : song.votes + 1,
        };
      }
      return song;
    }).sort((a, b) => {
      if (a.status === 'playing') return -1;
      if (b.status === 'playing') return 1;
      if (a.status === 'next') return -1;
      if (b.status === 'next') return 1;
      return b.votes - a.votes;
    }));

    // If it's a DB song, also persist the vote
    if (fromDB) {
      voteSong(id);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cola de canciones</Text>
        <TouchableOpacity onPress={() => router.push('/session/request-song')}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Now playing label */}
      <View style={styles.sectionLabel}>
        <Ionicons name="radio" size={14} color={colors.primary} />
        <Text style={styles.sectionText}>SONANDO AHORA</Text>
      </View>

      {/* Queue */}
      <FlatList
        data={localQueue}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <>
            {index === 1 && (
              <View style={styles.sectionLabel}>
                <Ionicons name="list" size={14} color={colors.textMuted} />
                <Text style={[styles.sectionText, { color: colors.textMuted }]}>
                  SIGUIENTES ({localQueue.length - 1})
                </Text>
              </View>
            )}
            <SongItem song={item} onVote={() => handleVote(item.id, item.fromDB)} />
          </>
        )}
        contentContainerStyle={[styles.list, localQueue.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          loading && !refreshing ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.stateText}>Cargando cola...</Text>
            </View>
          ) : fetchError ? (
            <View style={styles.centerState}>
              <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
              <Text style={styles.stateText}>Error al cargar la cola</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchQueue(sessionId)}>
                <Ionicons name="refresh" size={18} color={colors.textOnPrimary} />
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && !fetchError ? (
            <View style={styles.centerState}>
              <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
              <Text style={styles.stateTitle}>Cola vacía</Text>
              <Text style={styles.stateText}>¡Pide la primera canción!</Text>
            </View>
          ) : null
        }
      />
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
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  sectionText: {
    ...typography.captionBold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  list: {
    paddingBottom: spacing['3xl'],
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  songPlaying: {
    backgroundColor: colors.primary + '10',
  },
  songLeft: {},
  playingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumThumb: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
    gap: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  songTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 15,
    flexShrink: 1,
  },
  songTitlePlaying: {
    color: colors.primary,
  },
  dbBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  dbBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  songArtist: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  requestedBy: {
    ...typography.caption,
    color: colors.textMuted,
  },
  voteContainer: {
    alignItems: 'center',
    minWidth: 40,
  },
  voteCount: {
    ...typography.captionBold,
    color: colors.textMuted,
    marginTop: 2,
  },
  voteCountActive: {
    color: colors.primary,
  },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['3xl'], gap: spacing.sm },
  stateTitle: { ...typography.h3, color: colors.textPrimary },
  stateText: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, marginTop: spacing.sm,
  },
  retryText: { ...typography.bodyBold, color: colors.textOnPrimary, fontSize: 13 },
});
