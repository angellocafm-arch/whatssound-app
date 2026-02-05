/**
 * WhatsSound — Favoritos / Guardados
 * Conectado a Supabase
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';
import { supabase } from '../src/lib/supabase';
import { isTestMode, getOrCreateTestUser } from '../src/lib/demo';

const COLORS = ['#E91E63', '#00BCD4', '#FF9800', '#3F51B5', '#009688', '#9C27B0'];

interface FavSong {
  id: string;
  title: string;
  artist: string;
  session: string;
  votes: number;
}

interface SavedSession {
  id: string;
  name: string;
  dj: string;
  listeners: number;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'songs' | 'sessions'>('songs');
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<FavSong[]>([]);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [userId, setUserId] = useState<string>('');

  // Cargar favoritos
  useEffect(() => {
    (async () => {
      let uid = '';
      if (isTestMode()) {
        const testProfile = await getOrCreateTestUser();
        if (testProfile) uid = testProfile.id;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) uid = user.id;
      }

      if (!uid) {
        setLoading(false);
        return;
      }

      setUserId(uid);

      // Cargar canciones votadas por el usuario
      const { data: votedSongs } = await supabase
        .from('ws_votes')
        .select(`
          song:ws_songs(id, title, artist, votes, session:ws_sessions(name))
        `)
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(20);

      if (votedSongs) {
        setSongs(votedSongs.map((v: { song?: { id: string; title: string; artist: string; album_art?: string } }) => ({
          id: v.song?.id || '',
          title: v.song?.title || 'Sin título',
          artist: v.song?.artist || 'Desconocido',
          session: v.song?.session?.name || 'Sesión',
          votes: v.song?.votes || 0,
        })).filter((s: FavSong) => s.id));
      }

      // Cargar sesiones guardadas (donde participó)
      const { data: joinedSessions } = await supabase
        .from('ws_session_members')
        .select(`
          session:ws_sessions(id, name, dj:ws_profiles!dj_id(display_name, dj_name))
        `)
        .eq('user_id', uid)
        .order('joined_at', { ascending: false })
        .limit(20);

      if (joinedSessions) {
        const uniqueSessions = new Map<string, SavedSession>();
        for (const m of joinedSessions) {
          // session puede ser array o objeto dependiendo del join
          const session = Array.isArray(m.session) ? m.session[0] : m.session;
          if (session && !uniqueSessions.has(session.id)) {
            // Contar miembros actuales
            const { count } = await supabase
              .from('ws_session_members')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', session.id)
              .is('left_at', null);

            // dj puede ser array o objeto
            const dj = Array.isArray(session.dj) ? session.dj[0] : session.dj;
            uniqueSessions.set(session.id, {
              id: session.id,
              name: session.name,
              dj: dj?.dj_name || dj?.display_name || 'DJ',
              listeners: count || 0,
            });
          }
        }
        setSessions(Array.from(uniqueSessions.values()));
      }

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Favoritos</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'songs' && s.tabActive]} onPress={() => setTab('songs')}>
          <Text style={[s.tabText, tab === 'songs' && s.tabTextActive]}>🎵 Canciones ({songs.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'sessions' && s.tabActive]} onPress={() => setTab('sessions')}>
          <Text style={[s.tabText, tab === 'sessions' && s.tabTextActive]}>📡 Sesiones ({sessions.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {tab === 'songs' ? (
          songs.length > 0 ? (
            songs.map((song, i) => (
              <TouchableOpacity key={song.id} style={s.card}>
                <View style={[s.cardIcon, { backgroundColor: COLORS[i % COLORS.length] + '20' }]}>
                  <Ionicons name="musical-notes" size={20} color={COLORS[i % COLORS.length]} />
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardTitle} numberOfLines={1}>{song.title}</Text>
                  <Text style={s.cardSubtitle} numberOfLines={1}>{song.artist}</Text>
                  <Text style={s.cardMeta}>🎧 {song.session} · 👍 {song.votes}</Text>
                </View>
                <Ionicons name="heart" size={20} color={colors.error} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={s.empty}>
              <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
              <Text style={s.emptyTitle}>Sin canciones favoritas</Text>
              <Text style={s.emptySubtitle}>Las canciones que votes aparecerán aquí</Text>
            </View>
          )
        ) : (
          sessions.length > 0 ? (
            sessions.map((session, i) => (
              <TouchableOpacity 
                key={session.id} 
                style={s.card}
                onPress={() => router.push({ pathname: '/session/queue', params: { sessionId: session.id } } as any)}
              >
                <View style={[s.cardIcon, { backgroundColor: COLORS[i % COLORS.length] + '20' }]}>
                  <Ionicons name="radio" size={20} color={COLORS[i % COLORS.length]} />
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardTitle} numberOfLines={1}>{session.name}</Text>
                  <Text style={s.cardSubtitle} numberOfLines={1}>🎧 {session.dj}</Text>
                  <Text style={s.cardMeta}>👥 {session.listeners} escuchando</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={s.empty}>
              <Ionicons name="radio-outline" size={48} color={colors.textMuted} />
              <Text style={s.emptyTitle}>Sin sesiones guardadas</Text>
              <Text style={s.emptySubtitle}>Las sesiones que visites aparecerán aquí</Text>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.base, gap: spacing.sm, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.lg, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.primary + '20' },
  tabText: { ...typography.bodySmall, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  content: { padding: spacing.base, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  cardIcon: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  cardSubtitle: { ...typography.bodySmall, color: colors.textSecondary, fontSize: 13 },
  cardMeta: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: spacing['4xl'], gap: spacing.sm },
  emptyTitle: { ...typography.h3, color: colors.textSecondary },
  emptySubtitle: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center' },
});
