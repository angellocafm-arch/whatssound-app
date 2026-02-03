/**
 * WhatsSound — Descubrir
 * Pantalla rica con sesiones populares, DJs destacados, géneros y cercanía
 * Optimizada para demo de inversores
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
  FlatList,
  Dimensions,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';
import { shouldShowSeed } from '../../src/lib/seed-filter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Mock Data ───────────────────────────────────────────────

interface PopularSession {
  id: string;
  name: string;
  dj: string;
  genre: string;
  listeners: number;
  isLive: boolean;
  emoji: string;
  coverUrl?: string;
}

interface FeaturedDJ {
  id: string;
  name: string;
  initials: string;
  genre: string;
  followers: string;
  isLive: boolean;
  color: string;
}

interface Genre {
  id: string;
  name: string;
  icon: string;
  color: string;
  sessions: number;
}

interface NearbySession {
  id: string;
  name: string;
  dj: string;
  venue: string;
  distance: string;
  listeners: number;
  genre: string;
  isLive: boolean;
}

const POPULAR_SESSIONS: PopularSession[] = [
  { id: '1', name: 'Viernes Latino 🔥', dj: 'Carlos Madrid', genre: 'Reggaetón', listeners: 234, isLive: true, emoji: '🔥' },
  { id: '2', name: 'Techno Warehouse', dj: 'DJ KRTL', genre: 'Techno', listeners: 187, isLive: true, emoji: '🎛️' },
  { id: '3', name: 'Chill Sunday', dj: 'Luna Beats', genre: 'Lo-fi', listeners: 89, isLive: true, emoji: '🌙' },
  { id: '4', name: 'Hip Hop Cypher', dj: 'MC Flow', genre: 'Hip Hop', listeners: 156, isLive: true, emoji: '🎤' },
  { id: '5', name: 'House Nation', dj: 'DJ Pulse', genre: 'House', listeners: 203, isLive: false, emoji: '🏠' },
];

const FEATURED_DJS: FeaturedDJ[] = [
  { id: 'dj1', name: 'Carlos Madrid', initials: 'CM', genre: 'Reggaetón', followers: '2.3K', isLive: true, color: '#25D366' },
  { id: 'dj2', name: 'DJ KRTL', initials: 'KR', genre: 'Techno', followers: '5.1K', isLive: true, color: '#53BDEB' },
  { id: 'dj3', name: 'Luna Beats', initials: 'LB', genre: 'Lo-fi', followers: '1.8K', isLive: false, color: '#FFA726' },
  { id: 'dj4', name: 'MC Flow', initials: 'MF', genre: 'Hip Hop', followers: '3.4K', isLive: true, color: '#EF5350' },
  { id: 'dj5', name: 'DJ Pulse', initials: 'DP', genre: 'House', followers: '4.2K', isLive: false, color: '#AB47BC' },
  { id: 'dj6', name: 'Nerea BCN', initials: 'NB', genre: 'Techno', followers: '2.7K', isLive: false, color: '#26C6DA' },
  { id: 'dj7', name: 'Rhythm King', initials: 'RK', genre: 'Dancehall', followers: '1.5K', isLive: true, color: '#66BB6A' },
];

const GENRES: Genre[] = [
  { id: 'reggaeton', name: 'Reggaetón', icon: '🎵', color: '#25D366', sessions: 48 },
  { id: 'techno', name: 'Techno', icon: '🎛️', color: '#53BDEB', sessions: 35 },
  { id: 'house', name: 'House', icon: '🏠', color: '#AB47BC', sessions: 29 },
  { id: 'hiphop', name: 'Hip Hop', icon: '🎤', color: '#FFA726', sessions: 42 },
  { id: 'pop', name: 'Pop', icon: '🎶', color: '#EF5350', sessions: 31 },
  { id: 'rock', name: 'Rock', icon: '🎸', color: '#78909C', sessions: 18 },
  { id: 'jazz', name: 'Jazz', icon: '🎷', color: '#FFD54F', sessions: 12 },
  { id: 'lofi', name: 'Lo-fi', icon: '🌙', color: '#26C6DA', sessions: 24 },
];

const NEARBY_SESSIONS: NearbySession[] = [
  { id: 'n1', name: 'Latino Night', dj: 'Carlos Madrid', venue: 'Sala Sol, Madrid', distance: '0.3 km', listeners: 87, genre: 'Reggaetón', isLive: true },
  { id: 'n2', name: 'Underground Beats', dj: 'DJ Pulse', venue: 'Mondo Disko, Madrid', distance: '1.2 km', listeners: 134, genre: 'Techno', isLive: true },
  { id: 'n3', name: 'Acoustic Vibes', dj: 'Nerea BCN', venue: 'Café Central, Madrid', distance: '2.1 km', listeners: 45, genre: 'Jazz', isLive: true },
  { id: 'n4', name: 'Trap House', dj: 'MC Flow', venue: 'La Riviera, Madrid', distance: '3.5 km', listeners: 210, genre: 'Hip Hop', isLive: false },
];

// ─── Components ──────────────────────────────────────────────

const LiveDot = () => (
  <View style={styles.liveDot} />
);

const PopularSessionCard = ({ session, onPress }: { session: PopularSession; onPress: () => void }) => (
  <TouchableOpacity style={styles.popularCard} activeOpacity={0.8} onPress={onPress}>
    <View style={styles.popularCardHeader}>
      {session.coverUrl ? (
        <Image 
          source={{ uri: session.coverUrl }} 
          style={styles.popularCover}
        />
      ) : (
        <Text style={styles.popularEmoji}>{session.emoji}</Text>
      )}
      {session.isLive && (
        <View style={styles.liveTag}>
          <LiveDot />
          <Text style={styles.liveTagText}>EN VIVO</Text>
        </View>
      )}
    </View>
    <Text style={styles.popularName} numberOfLines={1}>{session.name}</Text>
    <Text style={styles.popularDj} numberOfLines={1}>{session.dj}</Text>
    <View style={styles.popularFooter}>
      <View style={styles.popularGenreTag}>
        <Text style={styles.popularGenreText}>{session.genre}</Text>
      </View>
      <View style={styles.popularListeners}>
        <Ionicons name="headset-outline" size={12} color={colors.textMuted} />
        <Text style={styles.popularListenersText}>{session.listeners}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const DJAvatar = ({ dj, onPress }: { dj: FeaturedDJ; onPress: () => void }) => (
  <TouchableOpacity style={styles.djAvatarContainer} activeOpacity={0.7} onPress={onPress}>
    <View style={[styles.djAvatarRing, dj.isLive && styles.djAvatarLiveRing]}>
      <View style={[styles.djAvatar, { backgroundColor: dj.color + '30' }]}>
        <Text style={[styles.djAvatarInitials, { color: dj.color }]}>{dj.initials}</Text>
      </View>
    </View>
    {dj.isLive && (
      <View style={styles.djLiveBadge}>
        <Text style={styles.djLiveBadgeText}>LIVE</Text>
      </View>
    )}
    <Text style={styles.djAvatarName} numberOfLines={1}>{dj.name.split(' ')[0]}</Text>
    <Text style={styles.djAvatarFollowers}>{dj.followers}</Text>
  </TouchableOpacity>
);

const GenreCard = ({ genre, onPress }: { genre: Genre; onPress: () => void }) => (
  <TouchableOpacity style={styles.genreCard} activeOpacity={0.7} onPress={onPress}>
    <View style={[styles.genreIconBg, { backgroundColor: genre.color + '20' }]}>
      <Text style={styles.genreIcon}>{genre.icon}</Text>
    </View>
    <Text style={styles.genreName}>{genre.name}</Text>
    <Text style={styles.genreSessions}>{genre.sessions} sesiones</Text>
  </TouchableOpacity>
);

const NearbySessionItem = ({ session, onPress }: { session: NearbySession; onPress: () => void }) => (
  <TouchableOpacity style={styles.nearbyItem} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.nearbyLeft}>
      <View style={[styles.nearbyDot, session.isLive && styles.nearbyDotLive]} />
    </View>
    <View style={styles.nearbyInfo}>
      <View style={styles.nearbyTitleRow}>
        <Text style={styles.nearbyName} numberOfLines={1}>{session.name}</Text>
        {session.isLive && (
          <View style={styles.nearbyLiveTag}>
            <LiveDot />
            <Text style={styles.nearbyLiveText}>LIVE</Text>
          </View>
        )}
      </View>
      <Text style={styles.nearbyDj}>{session.dj} · {session.genre}</Text>
      <View style={styles.nearbyMeta}>
        <Ionicons name="location-outline" size={13} color={colors.textMuted} />
        <Text style={styles.nearbyMetaText}>{session.venue} · {session.distance}</Text>
      </View>
    </View>
    <View style={styles.nearbyRight}>
      <Ionicons name="headset-outline" size={14} color={colors.textSecondary} />
      <Text style={styles.nearbyListeners}>{session.listeners}</Text>
    </View>
  </TouchableOpacity>
);

// ─── Main Screen ─────────────────────────────────────────────

export default function DiscoverScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [dbSessions, setDbSessions] = useState<PopularSession[]>([]);
  const [dbDJs, setDbDJs] = useState<FeaturedDJ[]>([]);

  useEffect(() => { loadFromDB(); }, []);

  const loadFromDB = async () => {
    try {
      // Sessions
      const showSeed = await shouldShowSeed();
      let sessQ = supabase
        .from('ws_sessions')
        .select('id, name, genres, is_active, is_seed, dj:ws_profiles!dj_id(dj_name, display_name), members:ws_session_members(id), songs:ws_songs(title, artist, status, cover_url)')
        .eq('is_active', true)
        .order('started_at', { ascending: false });
      if (!showSeed) sessQ = sessQ.eq('is_seed', false);
      const { data: sess } = await sessQ;
      if (sess && sess.length > 0) {
        setDbSessions(sess.map((s: any) => {
          const currentSong = s.songs?.find((song: any) => song.status === 'playing');
          return {
            id: s.id, 
            name: s.name, 
            dj: s.dj?.dj_name || s.dj?.display_name || 'DJ',
            genre: s.genres?.[0] || 'Mix', 
            listeners: s.members?.length || 0, 
            isLive: true,
            emoji: s.name.match(/[\u{1F300}-\u{1FAFF}]/u)?.[0] || '🎵',
            coverUrl: currentSong?.cover_url || '',
          };
        }));
      }
      // DJs
      let djQ = supabase
        .from('ws_profiles')
        .select('id, display_name, dj_name, genres, is_verified, is_seed')
        .eq('is_dj', true);
      if (!showSeed) djQ = djQ.eq('is_seed', false);
      const { data: djs } = await djQ;
      if (djs && djs.length > 0) {
        const colors_arr = ['#25D366', '#53BDEB', '#FFA726', '#EF5350', '#AB47BC', '#26C6DA', '#66BB6A'];
        setDbDJs(djs.map((d: any, i: number) => ({
          id: d.id, name: d.dj_name || d.display_name,
          initials: (d.dj_name || d.display_name).split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
          genre: d.genres?.[0] || 'Mix', followers: d.is_verified ? '2.3K' : '500+',
          isLive: false, color: colors_arr[i % colors_arr.length],
        })));
      }
    } catch (e) { /* fallback to mocks */ }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFromDB();
    setRefreshing(false);
  };

  const activeSessions = dbSessions.length > 0 ? dbSessions : POPULAR_SESSIONS;
  const activeDJs = dbDJs.length > 0 ? dbDJs : FEATURED_DJS;

  const filteredSessions = search
    ? activeSessions.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.dj.toLowerCase().includes(search.toLowerCase()) ||
        s.genre.toLowerCase().includes(search.toLowerCase()))
    : activeSessions;

  const filteredDJs = search
    ? activeDJs.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.genre.toLowerCase().includes(search.toLowerCase()))
    : activeDJs;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.title}>Descubrir</Text>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar DJs, géneros, sesiones..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Sesiones populares ahora ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔥 Sesiones populares ahora</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Ver todas</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {filteredSessions.map(session => (
          <PopularSessionCard
            key={session.id}
            session={session}
            onPress={() => router.push(`/session/${session.id}` as any)}
          />
        ))}
      </ScrollView>

      {/* ── DJs destacados ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎧 DJs destacados</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Ver todos</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {filteredDJs.map(dj => (
          <DJAvatar
            key={dj.id}
            dj={dj}
            onPress={() => router.push(`/profile/${dj.id}` as any)}
          />
        ))}
      </ScrollView>

      {/* ── Géneros ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎶 Géneros</Text>
      </View>
      <View style={styles.genreGrid}>
        {GENRES.map(genre => (
          <GenreCard
            key={genre.id}
            genre={genre}
            onPress={() => setSearch(genre.name)}
          />
        ))}
      </View>

      {/* ── Cerca de ti ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📍 Cerca de ti</Text>
        <View style={styles.locationTag}>
          <Ionicons name="location" size={12} color={colors.primary} />
          <Text style={styles.locationText}>Madrid</Text>
        </View>
      </View>
      {NEARBY_SESSIONS.map(session => (
        <NearbySessionItem
          key={session.id}
          session={session}
          onPress={() => router.push(`/session/${session.id}` as any)}
        />
      ))}

      <View style={{ height: spacing['3xl'] }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const CARD_WIDTH = SCREEN_WIDTH * 0.42;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['3xl'] },
  title: {
    ...typography.h1, color: colors.textPrimary,
    paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.base, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: {
    flex: 1, ...typography.body, color: colors.textPrimary, padding: 0,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  seeAll: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },

  horizontalScroll: { paddingHorizontal: spacing.base, gap: spacing.md },

  // Popular session cards
  popularCard: {
    width: CARD_WIDTH, backgroundColor: colors.surface,
    borderRadius: borderRadius.xl, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  popularCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  popularEmoji: { fontSize: 28 },
  popularCover: { 
    width: 40, 
    height: 40, 
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  liveTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EF535020', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  liveTagText: { ...typography.caption, color: '#EF5350', fontWeight: '700', fontSize: 9 },
  popularName: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: 2 },
  popularDj: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  popularFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popularGenreTag: {
    backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  popularGenreText: { ...typography.caption, color: colors.primary, fontWeight: '600', fontSize: 10 },
  popularListeners: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  popularListenersText: { ...typography.caption, color: colors.textMuted },

  // DJ Avatars
  djAvatarContainer: { alignItems: 'center', width: 76, gap: 4 },
  djAvatarRing: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  djAvatarLiveRing: { borderColor: colors.primary },
  djAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  djAvatarInitials: { ...typography.h3, fontWeight: '700' },
  djLiveBadge: {
    position: 'absolute', top: 48, backgroundColor: colors.primary,
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: borderRadius.sm,
    borderWidth: 2, borderColor: colors.background,
  },
  djLiveBadgeText: { fontSize: 8, fontWeight: '800', color: colors.textOnPrimary },
  djAvatarName: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  djAvatarFollowers: { ...typography.caption, color: colors.textMuted, fontSize: 10 },

  // Live dot
  liveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF5350',
  },

  // Genre grid
  genreGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.base, gap: spacing.sm,
  },
  genreCard: {
    width: (SCREEN_WIDTH - spacing.base * 2 - spacing.sm * 3) / 4,
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    alignItems: 'center', paddingVertical: spacing.md, gap: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  genreIconBg: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  genreIcon: { fontSize: 20 },
  genreName: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  genreSessions: { ...typography.caption, color: colors.textMuted, fontSize: 10 },

  // Location tag
  locationTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  locationText: { ...typography.caption, color: colors.primary, fontWeight: '600', fontSize: 11 },

  // Nearby sessions
  nearbyItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: colors.divider,
  },
  nearbyLeft: { width: 24, alignItems: 'center' },
  nearbyDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textMuted,
  },
  nearbyDotLive: { backgroundColor: colors.primary },
  nearbyInfo: { flex: 1, marginLeft: spacing.sm, gap: 3 },
  nearbyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nearbyName: { ...typography.bodyBold, color: colors.textPrimary, flex: 1 },
  nearbyLiveTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EF535015', paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  nearbyLiveText: { fontSize: 9, fontWeight: '700', color: '#EF5350' },
  nearbyDj: { ...typography.caption, color: colors.textSecondary },
  nearbyMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  nearbyMetaText: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  nearbyRight: { alignItems: 'center', gap: 2, marginLeft: spacing.sm },
  nearbyListeners: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
});
