/**
 * WhatsSound — Detalle de Canción
 * Conectado a Supabase
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Linking } from 'react-native';
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
  external_id?: string;
  deezer_id?: number;
  requested_by?: { display_name: string };
}

export default function SongDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ songId?: string; sessionId?: string }>();
  const [loading, setLoading] = useState(true);
  const [song, setSong] = useState<Song | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [tipCount, setTipCount] = useState(0);
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

  // Cargar canción
  useEffect(() => {
    if (!params.songId) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from('ws_songs')
        .select(`
          *,
          requested_by:ws_profiles!user_id(display_name)
        `)
        .eq('id', params.songId)
        .single();

      if (!error && data) {
        setSong(data as Song);

        // Contar propinas para esta canción
        const { count } = await supabase
          .from('ws_tips')
          .select('*', { count: 'exact', head: true })
          .eq('song_id', params.songId);
        setTipCount(count || 0);

        // Verificar si el usuario ya votó
        if (userId) {
          const { data: vote } = await supabase
            .from('ws_votes')
            .select('id')
            .eq('song_id', params.songId)
            .eq('user_id', userId)
            .maybeSingle();
          setHasVoted(!!vote);
        }
      }
      setLoading(false);
    })();
  }, [params.songId, userId]);

  const handleVote = async () => {
    if (!song || !userId) return;

    // Toggle vote
    if (hasVoted) {
      await supabase
        .from('ws_votes')
        .delete()
        .eq('song_id', song.id)
        .eq('user_id', userId);
      setSong({ ...song, votes: song.votes - 1 });
    } else {
      await supabase
        .from('ws_votes')
        .insert({ song_id: song.id, user_id: userId, session_id: params.sessionId });
      setSong({ ...song, votes: song.votes + 1 });
    }
    setHasVoted(!hasVoted);
  };

  const handleTip = () => {
    router.push({
      pathname: '/session/send-tip',
      params: { sessionId: params.sessionId, songId: params.songId },
    } as any);
  };

  const handleOpenSpotify = () => {
    if (song?.title && song?.artist) {
      const query = encodeURIComponent(`${song.title} ${song.artist}`);
      Linking.openURL(`https://open.spotify.com/search/${query}`);
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '0:00';
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!song) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Canción no encontrada</Text>
          <View style={{ width: 22 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Detalle</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Album art */}
        {song.cover_url ? (
          <Image source={{ uri: song.cover_url }} style={s.albumArt} />
        ) : (
          <View style={[s.albumArt, { backgroundColor: colors.primary }]}>
            <Ionicons name="musical-notes" size={64} color="rgba(255,255,255,0.5)" />
          </View>
        )}

        {/* Song info */}
        <Text style={s.title}>{song.title}</Text>
        <Text style={s.artist}>{song.artist}</Text>

        {/* Status badge */}
        {song.status === 'playing' && (
          <View style={s.statusBadge}>
            <View style={s.statusDot} />
            <Text style={s.statusText}>Sonando ahora</Text>
          </View>
        )}

        {/* Stats */}
        <View style={s.statsRow}>
          <Text style={s.stat}>👍 {song.votes} votos</Text>
          <Text style={s.stat}>💰 {tipCount} decibelios</Text>
          <Text style={s.stat}>👤 {song.requested_by?.display_name || 'Usuario'}</Text>
        </View>

        {/* Duration */}
        {song.duration_ms && (
          <Text style={s.duration}>Duración: {formatDuration(song.duration_ms)}</Text>
        )}

        {/* Action buttons */}
        <View style={s.actionsRow}>
          <TouchableOpacity 
            style={[s.actionBtn, hasVoted ? { backgroundColor: colors.primary } : { backgroundColor: colors.surfaceLight }]}
            onPress={handleVote}
          >
            <Ionicons name={hasVoted ? 'thumbs-up' : 'thumbs-up-outline'} size={20} color={hasVoted ? '#fff' : colors.primary} />
            <Text style={[s.actionText, !hasVoted && { color: colors.primary }]}>
              {hasVoted ? 'Votada' : 'Votar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.actionBtn, { backgroundColor: colors.warning + '30' }]}
            onPress={handleTip}
          >
            <Ionicons name="cash" size={20} color={colors.warning} />
            <Text style={[s.actionText, { color: colors.warning }]}>Volumen</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.actionBtn, { backgroundColor: '#1DB954' + '30' }]}
            onPress={handleOpenSpotify}
          >
            <Ionicons name="play-circle" size={20} color="#1DB954" />
            <Text style={[s.actionText, { color: '#1DB954' }]}>Spotify</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  content: { padding: spacing.base, alignItems: 'center', paddingBottom: 40 },
  albumArt: {
    width: 240, height: 240, borderRadius: borderRadius.xl,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16,
  },
  title: { ...typography.h2, color: colors.textPrimary, fontSize: 22, textAlign: 'center' },
  artist: { ...typography.body, color: colors.textSecondary, fontSize: 15, marginBottom: spacing.sm, textAlign: 'center' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary + '20',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  statusText: { ...typography.captionBold, color: colors.primary, fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm },
  stat: { ...typography.caption, color: colors.textMuted, fontSize: 12 },
  duration: { ...typography.caption, color: colors.textMuted, fontSize: 12, marginBottom: spacing.lg },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  actionBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: borderRadius.full, alignItems: 'center', gap: 4 },
  actionText: { ...typography.captionBold, color: '#fff', fontSize: 12 },
});
