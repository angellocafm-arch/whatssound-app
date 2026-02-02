/**
 * WhatsSound — En Vivo
 * Sesiones activas con datos reales de Supabase + mock fallback para demo
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

// ═══════════════════════════════════════════════════════════
// Mock data for demo — realistic DJ sessions
// ═══════════════════════════════════════════════════════════
const MOCK_SESSIONS = [
  {
    id: 'mock-1',
    name: 'Viernes Latino 🔥',
    dj_display_name: 'DJ Carlos Madrid',
    genre: 'Reggaetón',
    listener_count: 45,
    current_song: 'Gasolina',
    current_artist: 'Daddy Yankee',
    status: 'live' as const,
  },
  {
    id: 'mock-2',
    name: 'Deep House Sunset',
    dj_display_name: 'Sarah B',
    genre: 'Deep House',
    listener_count: 128,
    current_song: 'Cola',
    current_artist: 'CamelPhat & Elderbrook',
    status: 'live' as const,
  },
  {
    id: 'mock-3',
    name: 'Old School Hip Hop',
    dj_display_name: 'MC Raúl',
    genre: 'Hip Hop',
    listener_count: 67,
    current_song: 'N.Y. State of Mind',
    current_artist: 'Nas',
    status: 'live' as const,
  },
  {
    id: 'mock-4',
    name: 'Chill & Study Beats',
    dj_display_name: 'Luna DJ',
    genre: 'Lo-fi',
    listener_count: 203,
    current_song: 'Snowman',
    current_artist: 'WYS',
    status: 'live' as const,
  },
  {
    id: 'mock-5',
    name: 'Warehouse Session',
    dj_display_name: 'Paco Techno',
    genre: 'Techno',
    listener_count: 89,
    current_song: 'Acid Rain',
    current_artist: 'Amelie Lens',
    status: 'live' as const,
  },
];

const FILTERS = ['Todos', 'Mis grupos', 'Cerca de mí', 'Públicas'];

const GENRE_COLORS: Record<string, string> = {
  'Reggaetón': '#FF6B35',
  'Deep House': '#7B68EE',
  'Hip Hop': '#FFD700',
  'Lo-fi': '#87CEEB',
  'Techno': '#FF1493',
};

interface SessionData {
  id: string;
  name: string;
  dj_display_name: string;
  genre: string;
  listener_count: number;
  current_song: string;
  current_artist: string;
}

// Simple Avatar component (inline to avoid import issues in demo)
function DJAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `hsl(${hue}, 50%, 35%)`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
}

export default function LiveScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionData[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    // DEMO MODE: Always use mock data for investor demo
    setSessions(MOCK_SESSIONS);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  // Sort by listeners desc, pick featured
  const sorted = [...sessions].sort((a, b) => b.listener_count - a.listener_count);
  const featured = sorted[0];
  const rest = sorted.slice(1);
  const totalListeners = sessions.reduce((sum, s) => sum + s.listener_count, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>En Vivo</Text>
          <Text style={styles.subtitle}>
            {sessions.length} sesiones · {totalListeners} escuchando
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/session/create')}
        >
          <Ionicons name="add" size={20} color={colors.textOnPrimary} />
          <Text style={styles.createText}>Crear</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading */}
      {loading && !refreshing && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Cargando sesiones...</Text>
        </View>
      )}

      {/* Featured session */}
      {!loading && featured && (
        <TouchableOpacity
          style={styles.featuredCard}
          activeOpacity={0.85}
          onPress={() => router.push(`/session/${featured.id}`)}
        >
          <View style={styles.featuredTop}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>EN VIVO</Text>
            </View>
            <View style={styles.genreTag}>
              <Text style={styles.genreTagText}>{featured.genre}</Text>
            </View>
          </View>

          <View style={styles.featuredBody}>
            <DJAvatar name={featured.dj_display_name} size={56} />
            <View style={styles.featuredInfo}>
              <Text style={styles.featuredName} numberOfLines={1}>
                {featured.name}
              </Text>
              <Text style={styles.featuredDj}>{featured.dj_display_name}</Text>
              <View style={styles.featuredSongRow}>
                <Ionicons name="musical-note" size={14} color={colors.primary} />
                <Text style={styles.featuredSong} numberOfLines={1}>
                  {featured.current_song} — {featured.current_artist}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.featuredFooter}>
            <View style={styles.listenersRow}>
              <Ionicons name="people" size={16} color={colors.accent} />
              <Text style={styles.listenersText}>
                {featured.listener_count} escuchando ahora
              </Text>
            </View>
            <View style={styles.joinBtn}>
              <Ionicons name="headset" size={16} color={colors.textOnPrimary} />
              <Text style={styles.joinText}>Unirse</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Session list */}
      {!loading &&
        rest.map(session => (
          <TouchableOpacity
            key={session.id}
            style={styles.sessionItem}
            onPress={() => router.push(`/session/${session.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.sessionAvatarWrap}>
              <DJAvatar name={session.dj_display_name} />
              <View style={styles.liveIndicator}>
                <View style={styles.livePulse} />
              </View>
            </View>

            <View style={styles.sessionInfo}>
              <Text style={styles.sessionName} numberOfLines={1}>
                {session.name}
              </Text>
              <Text style={styles.sessionDj}>
                {session.dj_display_name} ·{' '}
                <Text style={{ color: GENRE_COLORS[session.genre] || colors.textSecondary }}>
                  {session.genre}
                </Text>
              </Text>
              <View style={styles.sessionSongRow}>
                <Ionicons name="musical-note" size={12} color={colors.primary} />
                <Text style={styles.sessionSong} numberOfLines={1}>
                  {session.current_song} — {session.current_artist}
                </Text>
              </View>
            </View>

            <View style={styles.sessionRight}>
              <Text style={styles.listenerCount}>{session.listener_count}</Text>
              <Ionicons name="people" size={14} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ))}

      {/* Empty state */}
      {!loading && sessions.length === 0 && (
        <View style={styles.centerState}>
          <Ionicons name="radio-outline" size={48} color={colors.textMuted} />
          <Text style={styles.stateTitle}>No hay sesiones en vivo</Text>
          <Text style={styles.stateText}>Sé el primero en crear una sesión</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['3xl'] },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textMuted, marginTop: 2 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  createText: { ...typography.captionBold, color: colors.textOnPrimary },

  // Filters
  filters: { marginBottom: spacing.md },
  filtersContent: { paddingHorizontal: spacing.base, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  filterText: { ...typography.bodySmall, color: colors.textSecondary },
  filterTextActive: { color: colors.primary, fontWeight: '600' },

  // Featured card
  featuredCard: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.error + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  liveBadgeText: { ...typography.captionBold, color: colors.error },
  genreTag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  genreTagText: { ...typography.caption, color: colors.textSecondary },

  featuredBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  featuredInfo: { flex: 1, gap: 4 },
  featuredName: { ...typography.h3, color: colors.textPrimary },
  featuredDj: { ...typography.bodySmall, color: colors.textSecondary },
  featuredSongRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  featuredSong: { ...typography.bodySmall, color: colors.primary, flex: 1 },

  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.divider,
  },
  listenersRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  listenersText: { ...typography.caption, color: colors.accent },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  joinText: { ...typography.captionBold, color: colors.textOnPrimary },

  // Session items
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  sessionAvatarWrap: { position: 'relative' },
  liveIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textOnPrimary,
  },
  sessionInfo: { flex: 1, gap: 2 },
  sessionName: { ...typography.bodyBold, color: colors.textPrimary },
  sessionDj: { ...typography.caption, color: colors.textSecondary },
  sessionSongRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sessionSong: { ...typography.caption, color: colors.primary, flex: 1 },
  sessionRight: { alignItems: 'center', gap: 2 },
  listenerCount: { ...typography.bodyBold, color: colors.textPrimary },

  // States
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.sm,
  },
  stateTitle: { ...typography.h3, color: colors.textPrimary },
  stateText: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center' },
});
