/**
 * WhatsSound — Cola del DJ (Vista DJ)
 * Gestión de cola con approve/reject, drag visual, AutoDJ, filtros
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';
import { useLocalSearchParams } from 'expo-router';

// ─── Types ──────────────────────────────────────────────────
type SongStatus = 'pending' | 'approved' | 'rejected' | 'playing' | 'queued';
type FilterType = 'all' | 'pending' | 'approved';

interface QueueSong {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  requester: string;
  requesterAvatar: string;
  votes: number;
  status: SongStatus;
  duration: string;
  addedAt: string;
}

// ─── Fallback Mock Data (if no real data) ───────────────────
const MOCK_QUEUE: QueueSong[] = [
  {
    id: '1', title: 'Pepas', artist: 'Farruko',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273a0e9b4f42cf8e1fdabe43c4b',
    requester: 'María G.', requesterAvatar: '👩‍🦰', votes: 24, status: 'playing', duration: '4:15', addedAt: '20:15',
  },
  {
    id: '2', title: 'Gasolina', artist: 'Daddy Yankee',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b2736bdcb82ecf1e4d1bace4fcae',
    requester: 'Pablo M.', requesterAvatar: '🧑', votes: 18, status: 'approved', duration: '3:12', addedAt: '20:18',
  },
  {
    id: '3', title: 'Dákiti', artist: 'Bad Bunny & Jhay Cortez',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273005ee342f4c7b0890fd4e049',
    requester: 'Ana L.', requesterAvatar: '👩', votes: 14, status: 'approved', duration: '3:25', addedAt: '20:22',
  },
  {
    id: '4', title: 'La Bicicleta', artist: 'Shakira & Carlos Vives',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b27365bba91c10e31ad588208f47',
    requester: 'Lucía F.', requesterAvatar: '👱‍♀️', votes: 11, status: 'pending', duration: '3:40', addedAt: '20:25',
  },
  {
    id: '5', title: 'Bailando', artist: 'Enrique Iglesias',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273b0ed706fa27228e9f754e0e5',
    requester: 'Carlos R.', requesterAvatar: '🧔', votes: 9, status: 'pending', duration: '4:02', addedAt: '20:28',
  },
  {
    id: '6', title: 'Vivir Mi Vida', artist: 'Marc Anthony',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b2734b9c05aa5bb1d484fd6904c1',
    requester: 'Javi R.', requesterAvatar: '🧑‍🦱', votes: 7, status: 'pending', duration: '3:55', addedAt: '20:30',
  },
  {
    id: '7', title: 'Obsesión', artist: 'Aventura',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273e6511e724d8201ed9ce2be52',
    requester: 'Marta D.', requesterAvatar: '👩‍🦳', votes: 5, status: 'pending', duration: '3:33', addedAt: '20:33',
  },
];

// ─── Filter Pill ────────────────────────────────────────────
const FilterPill = ({ label, active, count, onPress }: {
  label: string; active: boolean; count: number; onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.filterPill, active && styles.filterPillActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    <View style={[styles.filterCount, active && styles.filterCountActive]}>
      <Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>{count}</Text>
    </View>
  </TouchableOpacity>
);

// ─── Song Card ──────────────────────────────────────────────
const SongCard = ({ song, onApprove, onReject }: {
  song: QueueSong;
  onApprove: () => void;
  onReject: () => void;
}) => {
  const isPlaying = song.status === 'playing';
  const isPending = song.status === 'pending';
  const isApproved = song.status === 'approved';

  return (
    <View style={[styles.songCard, isPlaying && styles.songCardPlaying]}>
      {/* Drag handle */}
      <View style={styles.dragHandle}>
        <Ionicons name="reorder-three" size={20} color={colors.textMuted} />
      </View>

      {/* Album art */}
      <Image source={{ uri: song.albumArt }} style={styles.albumArt} />

      {/* Info */}
      <View style={styles.songInfo}>
        <View style={styles.songTitleRow}>
          <Text style={[styles.songTitle, isPlaying && styles.songTitlePlaying]} numberOfLines={1}>
            {song.title}
          </Text>
          {isPlaying && (
            <View style={styles.playingBadge}>
              <Text style={styles.playingBadgeText}>▶ NOW</Text>
            </View>
          )}
        </View>
        <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
        <View style={styles.songMeta}>
          <Text style={styles.requesterText}>{song.requesterAvatar} {song.requester}</Text>
          <Text style={styles.songDuration}>{song.duration}</Text>
          <View style={styles.voteBadge}>
            <Text style={styles.voteText}>🔥 {song.votes}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.songActions}>
        {isPending ? (
          <>
            <TouchableOpacity style={styles.approveBtn} onPress={onApprove}>
              <Ionicons name="checkmark" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
              <Ionicons name="close" size={18} color={colors.error} />
            </TouchableOpacity>
          </>
        ) : isApproved ? (
          <View style={styles.statusBadgeApproved}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          </View>
        ) : null}
      </View>
    </View>
  );
};

// ─── Main Component ─────────────────────────────────────────
export default function DJQueueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const [queue, setQueue] = useState<QueueSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [autoDJ, setAutoDJ] = useState(true);

  // Cargar cola desde Supabase
  React.useEffect(() => {
    if (!params.sessionId) {
      setQueue(MOCK_QUEUE);
      setLoading(false);
      return;
    }

    const loadQueue = async () => {
      const { data, error } = await supabase
        .from('ws_songs')
        .select(`
          id, title, artist, cover_url, votes, status, duration_ms, created_at,
          requested_by:ws_profiles!user_id(display_name)
        `)
        .eq('session_id', params.sessionId)
        .order('status', { ascending: true })
        .order('votes', { ascending: false });

      if (!error && data && data.length > 0) {
        setQueue(data.map((s: { id: string; title: string; artist: string; votes?: number; status?: string; requested_by?: string }) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          albumArt: s.cover_url || '',
          requester: s.requested_by?.display_name || 'Usuario',
          requesterAvatar: '👤',
          votes: s.votes || 0,
          status: s.status as SongStatus,
          duration: s.duration_ms ? `${Math.floor(s.duration_ms / 60000)}:${String(Math.floor((s.duration_ms % 60000) / 1000)).padStart(2, '0')}` : '0:00',
          addedAt: new Date(s.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        })));
      } else {
        setQueue(MOCK_QUEUE);
      }
      setLoading(false);
    };

    loadQueue();

    // Suscripción realtime
    const channel = supabase
      .channel(`dj-queue:${params.sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ws_songs', filter: `session_id=eq.${params.sessionId}` }, () => loadQueue())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [params.sessionId]);

  const counts = {
    all: queue.length,
    pending: queue.filter(s => s.status === 'pending').length,
    approved: queue.filter(s => s.status === 'approved' || s.status === 'playing').length,
  };

  const filtered = filter === 'all'
    ? queue
    : filter === 'pending'
    ? queue.filter(s => s.status === 'pending')
    : queue.filter(s => s.status === 'approved' || s.status === 'playing');

  const handleApprove = async (id: string) => {
    setQueue(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' as SongStatus } : s));
    await supabase.from('ws_songs').update({ status: 'approved' }).eq('id', id);
  };

  const handleReject = async (id: string) => {
    setQueue(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' as SongStatus } : s));
    await supabase.from('ws_songs').update({ status: 'rejected' }).eq('id', id);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cola del DJ</Text>
        <View style={styles.headerRight}>
          <Text style={styles.queueCount}>{queue.length} canciones</Text>
        </View>
      </View>

      {/* AutoDJ + Surprise */}
      <View style={styles.topActions}>
        <TouchableOpacity
          style={[styles.autoDJBtn, autoDJ && styles.autoDJBtnActive]}
          onPress={() => setAutoDJ(!autoDJ)}
        >
          <Ionicons name="sparkles" size={18} color={autoDJ ? colors.primary : colors.textMuted} />
          <Text style={[styles.autoDJText, autoDJ && styles.autoDJTextActive]}>
            AutoDJ {autoDJ ? 'ON' : 'OFF'}
          </Text>
          {autoDJ && <Text style={styles.autoDJStyle}>Reggaetón clásico</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.surpriseBtn}>
          <Ionicons name="gift" size={18} color={colors.warning} />
          <Text style={styles.surpriseText}>🎲 Sorpresa IA</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <FilterPill label="Todas" active={filter === 'all'} count={counts.all} onPress={() => setFilter('all')} />
        <FilterPill label="Pendientes" active={filter === 'pending'} count={counts.pending} onPress={() => setFilter('pending')} />
        <FilterPill label="Aprobadas" active={filter === 'approved'} count={counts.approved} onPress={() => setFilter('approved')} />
      </View>

      {/* Queue List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filtered.map(song => (
          <SongCard
            key={song.id}
            song={song}
            onApprove={() => handleApprove(song.id)}
            onReject={() => handleReject(song.id)}
          />
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Sin canciones</Text>
            <Text style={styles.emptySubtitle}>No hay canciones con este filtro</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

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
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  headerRight: {},
  queueCount: { ...typography.caption, color: colors.textMuted },

  // Top actions
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  autoDJBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  autoDJBtnActive: {
    borderColor: colors.primary + '50',
    backgroundColor: colors.primary + '08',
  },
  autoDJText: { ...typography.bodyBold, color: colors.textMuted, fontSize: 13 },
  autoDJTextActive: { color: colors.primary },
  autoDJStyle: { ...typography.caption, color: colors.textMuted, fontSize: 10, marginLeft: 'auto' },
  surpriseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning + '12',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  surpriseText: { ...typography.bodyBold, color: colors.warning, fontSize: 13 },

  // Filters
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary + '50',
  },
  filterText: { ...typography.bodySmall, color: colors.textSecondary, fontSize: 13 },
  filterTextActive: { color: colors.primary, fontWeight: '600' },
  filterCount: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  filterCountActive: { backgroundColor: colors.primary + '25' },
  filterCountText: { ...typography.captionBold, color: colors.textMuted, fontSize: 11 },
  filterCountTextActive: { color: colors.primary },

  // List
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },

  // Song card
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  songCardPlaying: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '08',
  },
  dragHandle: {
    paddingHorizontal: 2,
    opacity: 0.5,
  },
  albumArt: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
  },
  songInfo: { flex: 1 },
  songTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  songTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 14, flexShrink: 1 },
  songTitlePlaying: { color: colors.primary },
  playingBadge: {
    backgroundColor: colors.primary + '25',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  playingBadgeText: { ...typography.captionBold, color: colors.primary, fontSize: 9, letterSpacing: 0.5 },
  songArtist: { ...typography.caption, color: colors.textSecondary, fontSize: 12 },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 3,
  },
  requesterText: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  songDuration: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  voteBadge: {
    backgroundColor: 'rgba(255,107,0,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  voteText: { ...typography.captionBold, color: '#ff6b00', fontSize: 11 },

  // Actions
  songActions: {
    flexDirection: 'column',
    gap: 6,
    alignItems: 'center',
  },
  approveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeApproved: {
    opacity: 0.7,
  },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: spacing['4xl'], gap: spacing.sm },
  emptyTitle: { ...typography.h3, color: colors.textSecondary },
  emptySubtitle: { ...typography.bodySmall, color: colors.textMuted },
});
