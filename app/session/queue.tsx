/**
 * WhatsSound — Cola de Canciones
 * Conectado a Supabase con votación en tiempo real
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';
import { isTestMode, getOrCreateTestUser } from '../../src/lib/demo';

interface Song {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
  duration_ms?: number;
  votes: number;
  status: string;
  requested_by?: { display_name: string };
}

export default function QueueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string; sid?: string }>();
  const sessionId = params.sessionId || params.sid;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string>('');

  // Obtener user id
  useEffect(() => {
    (async () => {
      if (isTestMode()) {
        const testProfile = await getOrCreateTestUser();
        if (testProfile) setUserId(testProfile.id);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);
      }
    })();
  }, []);

  // Cargar cola
  const loadQueue = async () => {
    if (!sessionId) return;

    try {
      // Cargar canciones de la sesión
      const { data: songs, error } = await supabase
        .from('ws_songs')
        .select(`
          id, title, artist, cover_url, duration_ms, votes, status,
          requested_by:ws_profiles!user_id(display_name)
        `)
        .eq('session_id', sessionId)
        .order('status', { ascending: true }) // playing first
        .order('votes', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      const allSongs = (songs || []) as Song[];
      
      // Separar now playing y cola
      const playing = allSongs.find(s => s.status === 'playing');
      const pending = allSongs.filter(s => s.status === 'pending' || s.status === 'queued');
      
      setNowPlaying(playing || null);
      setQueue(pending);

      // Cargar votos del usuario
      if (userId) {
        const { data: userVotes } = await supabase
          .from('ws_votes')
          .select('song_id')
          .eq('user_id', userId);
        
        if (userVotes) {
          setVoted(new Set(userVotes.map(v => v.song_id)));
        }
      }
    } catch (e) {
      console.error('Error loading queue:', e);
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadQueue();

    // Suscripción a cambios
    if (!sessionId) return;
    
    const channel = supabase
      .channel(`queue:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ws_songs', filter: `session_id=eq.${sessionId}` },
        () => loadQueue()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ws_votes' },
        () => loadQueue()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId]);

  const handleVote = async (songId: string) => {
    if (!userId) return;

    const hasVoted = voted.has(songId);

    // Optimistic update
    setVoted(prev => {
      const next = new Set(prev);
      hasVoted ? next.delete(songId) : next.add(songId);
      return next;
    });
    setQueue(prev => prev.map(s => 
      s.id === songId ? { ...s, votes: s.votes + (hasVoted ? -1 : 1) } : s
    ));

    try {
      if (hasVoted) {
        // Quitar voto
        await supabase
          .from('ws_votes')
          .delete()
          .eq('song_id', songId)
          .eq('user_id', userId);
        
        // Decrementar contador
        await supabase.rpc('decrement_song_votes', { p_song_id: songId });
      } else {
        // Añadir voto
        await supabase
          .from('ws_votes')
          .insert({ song_id: songId, user_id: userId, session_id: sessionId });
        
        // Incrementar contador
        await supabase.rpc('increment_song_votes', { p_song_id: songId });
      }
    } catch (e) {
      // Revert on error
      setVoted(prev => {
        const next = new Set(prev);
        hasVoted ? next.add(songId) : next.delete(songId);
        return next;
      });
      loadQueue();
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={[st.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Cola de canciones</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/session/request-song', params: { sid: sessionId } } as any)}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Now Playing */}
      {nowPlaying && (
        <>
          <View style={st.nowRow}>
            <View style={st.nowDot} />
            <Text style={st.nowLabel}>SONANDO AHORA</Text>
          </View>
          <View style={st.nowItem}>
            {nowPlaying.cover_url ? (
              <Image source={{ uri: nowPlaying.cover_url }} style={st.nowArt} />
            ) : (
              <View style={[st.nowArt, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="musical-notes" size={24} color={colors.textMuted} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={st.nowTitle} numberOfLines={1}>{nowPlaying.title}</Text>
              <Text style={st.nowArtist} numberOfLines={1}>{nowPlaying.artist}</Text>
            </View>
            <View style={st.bars}>
              <View style={[st.bar,{height:14}]} />
              <View style={[st.bar,{height:20}]} />
              <View style={[st.bar,{height:10}]} />
              <View style={[st.bar,{height:16}]} />
            </View>
          </View>
        </>
      )}

      <View style={st.divRow}>
        <Ionicons name="list" size={14} color={colors.textMuted} />
        <Text style={st.divText}>SIGUIENTES ({queue.length})</Text>
      </View>

      {queue.length === 0 ? (
        <View style={st.emptyState}>
          <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
          <Text style={st.emptyTitle}>La cola está vacía</Text>
          <Text style={st.emptyText}>¡Sé el primero en pedir una canción!</Text>
        </View>
      ) : (
        <FlatList
          data={queue}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadQueue(); }} tintColor={colors.primary} />
          }
          renderItem={({ item, index: i }) => {
            const v = voted.has(item.id);
            const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : null;
            return (
              <View style={st.songItem}>
                {medal ? (
                  <Text style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{medal}</Text>
                ) : (
                  <Text style={st.songNum}>{i + 1}</Text>
                )}
                {item.cover_url ? (
                  <Image source={{ uri: item.cover_url }} style={st.songArt} />
                ) : (
                  <View style={[st.songArt, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="musical-note" size={20} color={colors.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={st.songTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={st.songArtist} numberOfLines={1}>{item.artist}</Text>
                  <Text style={st.songMeta}>
                    Pedida por {item.requested_by?.display_name || 'Usuario'}
                    {item.duration_ms ? ` · ${formatDuration(item.duration_ms)}` : ''}
                  </Text>
                </View>
                <TouchableOpacity style={st.voteBtn} onPress={() => handleVote(item.id)}>
                  <Ionicons 
                    name={v ? 'arrow-up-circle' : 'arrow-up-circle-outline'} 
                    size={28} 
                    color={v ? colors.primary : colors.textMuted} 
                  />
                  <Text style={[st.voteCount, v && { color: colors.primary }]}>{item.votes}</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity 
        style={st.fab} 
        onPress={() => router.push({ pathname: '/session/request-song', params: { sid: sessionId } } as any)} 
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={24} color={colors.background} />
        <Text style={st.fabText}>Pedir canción</Text>
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: .5, borderBottomColor: colors.border },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  nowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  nowLabel: { ...typography.captionBold, color: colors.primary, letterSpacing: .5 },
  nowItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, gap: spacing.md, backgroundColor: colors.primary + '10' },
  nowArt: { width: 48, height: 48, borderRadius: borderRadius.md },
  nowTitle: { ...typography.bodyBold, color: colors.primary, fontSize: 15 },
  nowArtist: { ...typography.bodySmall, color: colors.textSecondary },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 24 },
  bar: { width: 3, backgroundColor: colors.primary, borderRadius: 1.5 },
  divRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  divText: { ...typography.captionBold, color: colors.textMuted, letterSpacing: .5 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingBottom: 100 },
  emptyTitle: { ...typography.h3, color: colors.textPrimary },
  emptyText: { ...typography.body, color: colors.textMuted },
  songItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, gap: spacing.md, borderBottomWidth: .5, borderBottomColor: colors.divider },
  songNum: { ...typography.caption, color: colors.textMuted, width: 32, textAlign: 'center', fontSize: 14 },
  songArt: { width: 44, height: 44, borderRadius: borderRadius.md },
  songTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  songArtist: { ...typography.bodySmall, color: colors.textSecondary },
  songMeta: { ...typography.caption, color: colors.textMuted },
  voteBtn: { alignItems: 'center', minWidth: 40 },
  voteCount: { ...typography.captionBold, color: colors.textMuted, marginTop: 2 },
  fab: { position: 'absolute', bottom: spacing.base, right: spacing.base, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.full, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: .3, shadowRadius: 8, elevation: 8 },
  fabText: { ...typography.buttonSmall, color: colors.background },
});
