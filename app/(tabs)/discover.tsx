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
import { DJRanking } from '../../src/components/discover/DJRanking';
import { UpcomingSessions } from '../../src/components/discover/UpcomingSessions';
import { styles } from '../../src/styles/discover.styles';

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
        setDbSessions(sess.map((s: { id: string; name: string; dj?: { dj_name: string }; members?: unknown[]; songs?: { status: string }[] }) => {
          const currentSong = s.songs?.find((song: { status: string }) => song.status === 'playing');
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
        setDbDJs(djs.map((d: { id: string; display_name: string; dj_name?: string; genres?: string[] }, i: number) => ({
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

      {/* ── DJs del momento ── */}
      <DJRanking limit={5} />

      {/* ── Hall of Fame (Golden Boosts) ── */}
      <TouchableOpacity 
        style={styles.hallOfFameBanner}
        onPress={() => router.push('/hall-of-fame' as any)}
      >
        <View style={styles.hofContent}>
          <Text style={styles.hofIcon}>🏆</Text>
          <View style={styles.hofText}>
            <Text style={styles.hofTitle}>Hall of Fame</Text>
            <Text style={styles.hofSubtitle}>Los DJs más reconocidos por la comunidad</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#FFD700" />
      </TouchableOpacity>

      {/* ── Próximas sesiones ── */}
      <UpcomingSessions limit={3} />

      <View style={{ height: spacing['3xl'] }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const CARD_WIDTH = SCREEN_WIDTH * 0.42;
