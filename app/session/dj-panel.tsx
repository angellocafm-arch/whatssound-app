/**
 * WhatsSound — Panel DJ
 * Controles del DJ con datos reales de Supabase
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { useSessionStore } from '../../src/stores/sessionStore';
import { supabase } from '../../src/lib/supabase';

export default function DJPanelScreen() {
  const router = useRouter();
  const { currentSession, queue, loading, fetchSession, fetchQueue, endSession } = useSessionStore();
  const [isLive, setIsLive] = useState(true);
  const [stats, setStats] = useState({ listeners: 0, songs: 0, tips: 0 });
  const [fetchError, setFetchError] = useState(false);

  // Use the first live session or a known one
  const sessionId = currentSession?.id || '9ee38aaa-30a1-4aa8-9925-3155597ad025';

  useEffect(() => {
    Promise.all([fetchSession(sessionId), fetchQueue(sessionId), fetchStats()])
      .catch(() => setFetchError(true));
  }, []);

  const fetchStats = async () => {
    // Count queue items
    const { count: songCount } = await supabase
      .from('queue')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    // Sum tips
    const { data: tipData } = await supabase
      .from('tips')
      .select('amount')
      .eq('session_id', sessionId);

    const totalTips = tipData?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

    setStats({
      listeners: currentSession?.listener_count || 3,
      songs: songCount || 0,
      tips: totalTips,
    });
  };

  const playing = queue.find(q => q.status === 'playing');
  const next = queue.filter(q => q.status !== 'playing' && q.status !== 'played')
    .sort((a, b) => b.votes - a.votes)[0];

  const handleEndSession = async () => {
    await endSession(sessionId);
    router.back();
  };

  const handleSkip = async () => {
    if (!playing) return;
    // Mark current as played
    await supabase.from('queue').update({ status: 'played' }).eq('id', playing.id);
    // Mark next as playing
    if (next) {
      await supabase.from('queue').update({ status: 'playing' }).eq('id', next.id);
      // Update session current song
      await supabase.from('sessions').update({
        current_song: next.song_name,
        current_artist: next.artist,
      }).eq('id', sessionId);
    }
    fetchQueue(sessionId);
    fetchSession(sessionId);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel DJ</Text>
        <Badge text={isLive ? 'EN VIVO' : 'PAUSADA'} variant={isLive ? 'live' : 'muted'} dot />
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Cargando panel...</Text>
        </View>
      )}

      {/* Error state */}
      {!loading && fetchError && (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.stateTitle}>Error al cargar</Text>
          <Text style={styles.stateText}>No pudimos cargar la sesión</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setFetchError(false); fetchSession(sessionId); fetchQueue(sessionId); }}>
            <Ionicons name="refresh" size={18} color={colors.textOnPrimary} />
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Session Name */}
      {!loading && currentSession && (
        <Text style={styles.sessionName}>{currentSession.name}</Text>
      )}

      {/* No session state */}
      {!loading && !fetchError && !currentSession && (
        <View style={styles.centerState}>
          <Ionicons name="disc-outline" size={48} color={colors.textMuted} />
          <Text style={styles.stateTitle}>Sin sesión activa</Text>
          <Text style={styles.stateText}>Crea una sesión para empezar a pinchar</Text>
        </View>
      )}

      {/* Now Playing Card */}
      <Card style={styles.nowPlayingCard}>
        <Text style={styles.sectionLabel}>SONANDO AHORA</Text>
        <View style={styles.nowPlaying}>
          <View style={styles.albumArt}>
            <Ionicons name="musical-note" size={28} color={colors.primary} />
          </View>
          <View style={styles.songInfo}>
            <Text style={styles.songTitle}>{playing?.song_name || currentSession?.current_song || 'Sin canción'}</Text>
            <Text style={styles.songArtist}>{playing?.artist || currentSession?.current_artist || '—'}</Text>
            <Text style={styles.songMeta}>
              {playing ? `Pedida por ${playing.requester_name || 'Anónimo'} · ${playing.votes} votos` : ''}
            </Text>
          </View>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="play-skip-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playBtn} onPress={() => setIsLive(!isLive)}>
            <Ionicons name={isLive ? 'pause' : 'play'} size={28} color={colors.textOnPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={handleSkip}>
            <Ionicons name="play-skip-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </Card>

      {/* Next Song */}
      <Card style={styles.nextCard}>
        <Text style={styles.sectionLabel}>SIGUIENTE</Text>
        <View style={styles.nextSong}>
          <View style={styles.albumSmall}>
            <Ionicons name="disc" size={18} color={colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nextTitle}>{next?.song_name || 'Cola vacía'}</Text>
            <Text style={styles.nextArtist}>
              {next ? `${next.artist} · ${next.votes} votos` : 'Pide canciones al público'}
            </Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="swap-vertical" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </Card>

      {/* Stats */}
      <Text style={styles.sectionTitle}>ESTADÍSTICAS EN VIVO</Text>
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Ionicons name="people" size={24} color={colors.primary} />
          <Text style={styles.statNumber}>{stats.listeners}</Text>
          <Text style={styles.statLabel}>Oyentes</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="musical-notes" size={24} color={colors.accent} />
          <Text style={styles.statNumber}>{queue.length}</Text>
          <Text style={styles.statLabel}>En cola</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="time" size={24} color={colors.warning} />
          <Text style={styles.statNumber}>{currentSession?.started_at ? Math.round((Date.now() - new Date(currentSession.started_at).getTime()) / 60000) + 'm' : '—'}</Text>
          <Text style={styles.statLabel}>Duración</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="cash" size={24} color={colors.primary} />
          <Text style={styles.statNumber}>€{stats.tips}</Text>
          <Text style={styles.statLabel}>Propinas</Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>ACCIONES RÁPIDAS</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="megaphone" size={22} color={colors.primary} />
          <Text style={styles.actionText}>Anunciar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/session/share-qr')}>
          <Ionicons name="qr-code" size={22} color={colors.primary} />
          <Text style={styles.actionText}>Compartir QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/session/queue')}>
          <Ionicons name="list" size={22} color={colors.primary} />
          <Text style={styles.actionText}>Ver cola</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/session/${sessionId}`)}>
          <Ionicons name="chatbubbles" size={22} color={colors.primary} />
          <Text style={styles.actionText}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* End Session */}
      <Button
        title="Finalizar sesión"
        onPress={handleEndSession}
        variant="danger"
        fullWidth
        size="lg"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, marginBottom: spacing.sm,
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  sessionName: { ...typography.h3, color: colors.primary, marginBottom: spacing.md },
  nowPlayingCard: { marginBottom: spacing.md, padding: spacing.base },
  sectionLabel: { ...typography.captionBold, color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.sm },
  nowPlaying: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.base },
  albumArt: {
    width: 64, height: 64, borderRadius: borderRadius.lg, backgroundColor: colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  songInfo: { flex: 1, gap: 2 },
  songTitle: { ...typography.h3, color: colors.textPrimary },
  songArtist: { ...typography.body, color: colors.textSecondary },
  songMeta: { ...typography.caption, color: colors.textMuted },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  controlBtn: { padding: spacing.sm },
  playBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  nextCard: { marginBottom: spacing.lg, padding: spacing.base },
  nextSong: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  albumSmall: {
    width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: colors.surfaceLight,
    alignItems: 'center', justifyContent: 'center',
  },
  nextTitle: { ...typography.bodyBold, color: colors.textPrimary },
  nextArtist: { ...typography.caption, color: colors.textSecondary },
  sectionTitle: { ...typography.captionBold, color: colors.textSecondary, letterSpacing: 0.5, marginBottom: spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, minWidth: '45%', alignItems: 'center', padding: spacing.base, gap: spacing.xs },
  statNumber: { ...typography.h2, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textMuted },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  actionBtn: {
    flex: 1, alignItems: 'center', gap: spacing.xs, padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
  },
  actionText: { ...typography.caption, color: colors.textSecondary },
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
