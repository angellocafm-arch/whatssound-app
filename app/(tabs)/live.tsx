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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';
import { shouldShowSeed } from '../../src/lib/seed-filter';
import { SkeletonList, SessionCardSkeleton, Skeleton } from '../../src/components/ui/Skeleton';
import { styles } from '../../src/styles/live.styles';

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
  current_cover?: string;
}

// Session Avatar - shows album cover or DJ initials
function SessionAvatar({ 
  coverUrl, 
  djName, 
  size = 48, 
  showLiveDot = false 
}: { 
  coverUrl?: string; 
  djName: string; 
  size?: number;
  showLiveDot?: boolean;
}) {
  const initials = djName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const hue = djName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  const avatar = coverUrl ? (
    <Image 
      source={{ uri: coverUrl }} 
      style={{
        width: size,
        height: size,
        borderRadius: 8, // Album covers look better with slight corner radius
      }}
    />
  ) : (
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

  if (!showLiveDot) return avatar;

  return (
    <View style={{ position: 'relative' }}>
      {avatar}
      <View style={{
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
      }}>
        <View style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.textOnPrimary,
        }} />
      </View>
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
    try {
      // Try Supabase first
      const showSeed = await shouldShowSeed();
      let query = supabase
        .from('ws_sessions')
        .select(`
          id, name, genres, is_active, started_at, is_seed,
          dj:ws_profiles!dj_id(display_name, dj_name),
          songs:ws_songs(title, artist, status, cover_url),
          members:ws_session_members(id)
        `)
        .eq('is_active', true)
        .order('started_at', { ascending: false });
      if (!showSeed) query = query.eq('is_seed', false);
      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const mapped = data.map((s: { id: string; name: string; dj?: { dj_name: string }; members?: unknown[]; songs?: { status: string }[] }) => {
          const currentSong = s.songs?.find((sg: { status: string }) => sg.status === 'playing');
          return {
            id: s.id,
            name: s.name,
            dj_display_name: s.dj?.dj_name || s.dj?.display_name || 'DJ',
            genre: s.genres?.[0] || 'Mix',
            listener_count: s.members?.length || 0,
            current_song: currentSong?.title || 'En pausa',
            current_artist: currentSong?.artist || '',
            current_cover: currentSong?.cover_url || '',
          };
        });
        setSessions(mapped);
        setLoading(false);
        return;
      }
    } catch (e) {
      // Supabase failed, use mocks
    }
    // Fallback: mock data for demo
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

      {/* Loading Skeletons */}
      {loading && !refreshing && (
        <View style={styles.skeletonContainer}>
          {/* Featured skeleton */}
          <View style={styles.featuredSkeleton}>
            <Skeleton width="30%" height={20} borderRadius={10} />
            <Skeleton width="70%" height={24} borderRadius={6} style={{ marginTop: 16 }} />
            <Skeleton width="50%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
            <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
              <Skeleton width={80} height={32} borderRadius={16} />
              <Skeleton width={60} height={32} borderRadius={16} />
            </View>
          </View>
          {/* Session list skeletons */}
          <SkeletonList count={4} type="session" />
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
            <SessionAvatar 
              coverUrl={featured.current_cover} 
              djName={featured.dj_display_name} 
              size={56} 
            />
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
            <SessionAvatar 
              coverUrl={session.current_cover} 
              djName={session.dj_display_name} 
              size={48}
              showLiveDot={true}
            />

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
