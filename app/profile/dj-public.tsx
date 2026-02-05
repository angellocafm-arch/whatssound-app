/**
 * WhatsSound — Perfil DJ Público
 * Referencia: 37-perfil-dj-publico.png
 * Cómo te ven otros: avatar, stats, sesiones, rating, historial
 * CONECTADO A SUPABASE
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/authStore';
import { isDemoMode } from '../../src/lib/demo';

interface DJProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_dj: boolean;
  dj_verified: boolean;
  genres: string[];
}

interface DJSession {
  id: string;
  name: string;
  created_at: string;
  member_count: number;
  rating: number;
}

interface DJStats {
  totalSessions: number;
  followers: number;
  avgRating: number;
  totalTips: number;
}

// Demo data
const DEMO_DJ: DJProfile = {
  id: 'demo-dj',
  display_name: 'DJ Carlos Madrid',
  avatar_url: null,
  bio: 'Amante de la música y DJ amateur 🎧\nReggaetón · Latin House · Electrónica',
  is_dj: true,
  dj_verified: true,
  genres: ['Reggaetón', 'Latin House', 'Electrónica', 'Dembow', 'Bachata'],
};

const DEMO_SESSIONS: DJSession[] = [
  { id: '1', name: 'Viernes Latino 🔥', created_at: new Date().toISOString(), member_count: 47, rating: 4.8 },
  { id: '2', name: 'Reggaeton Mix 🎉', created_at: new Date(Date.now() - 86400000).toISOString(), member_count: 96, rating: 4.6 },
  { id: '3', name: 'Chill Sunday 🌤️', created_at: new Date(Date.now() - 172800000).toISOString(), member_count: 23, rating: 4.9 },
];

const DEMO_STATS: DJStats = { totalSessions: 47, followers: 1200, avgRating: 4.8, totalTips: 234 };

export default function DJPublicProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  
  const [dj, setDJ] = useState<DJProfile | null>(null);
  const [sessions, setSessions] = useState<DJSession[]>([]);
  const [stats, setStats] = useState<DJStats | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDJProfile();
  }, [id]);

  const loadDJProfile = async () => {
    if (isDemoMode() || !id) {
      setDJ(DEMO_DJ);
      setSessions(DEMO_SESSIONS);
      setStats(DEMO_STATS);
      setLoading(false);
      return;
    }

    try {
      // Load DJ profile
      const { data: profile } = await supabase
        .from('ws_profiles')
        .select('id, display_name, avatar_url, bio, is_dj, dj_verified, genres')
        .eq('id', id)
        .single();

      if (profile) {
        setDJ(profile as DJProfile);
      }

      // Load DJ sessions
      const { data: djSessions } = await supabase
        .from('ws_sessions')
        .select(`
          id,
          name,
          created_at,
          ws_session_members(count)
        `)
        .eq('dj_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (djSessions) {
        const sessionsWithStats = djSessions.map((s: { id: string; name: string; started_at?: string; listener_count?: number }) => ({
          id: s.id,
          name: s.name,
          created_at: s.created_at,
          member_count: s.ws_session_members?.[0]?.count || 0,
          rating: 0, // TODO: Add ws_session_ratings table
        }));
        setSessions(sessionsWithStats);
      }

      // Load stats
      const { count: sessionCount } = await supabase
        .from('ws_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('dj_id', id);

      const { count: followerCount } = await supabase
        .from('ws_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', id);

      // TODO: Add ws_session_ratings table for real ratings
      const avgRating = 0;

      const { count: tipCount } = await supabase
        .from('ws_tips')
        .select('*', { count: 'exact', head: true })
        .eq('dj_id', id);

      setStats({
        totalSessions: sessionCount || 0,
        followers: followerCount || 0,
        avgRating: Math.round(avgRating * 10) / 10,
        totalTips: tipCount || 0,
      });

      // Check if current user follows this DJ
      if (user?.id) {
        const { data: follow } = await supabase
          .from('ws_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', id)
          .single();
        
        setIsFollowing(!!follow);
      }
    } catch (error) {
      console.error('Error loading DJ profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (isDemoMode() || !id || !user?.id) {
      setIsFollowing(!isFollowing);
      if (stats) {
        setStats({
          ...stats,
          followers: isFollowing ? stats.followers - 1 : stats.followers + 1,
        });
      }
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from('ws_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', id);
      } else {
        await supabase
          .from('ws_follows')
          .insert({ follower_id: user.id, following_id: id });
      }
      setIsFollowing(!isFollowing);
      if (stats) {
        setStats({
          ...stats,
          followers: isFollowing ? stats.followers - 1 : stats.followers + 1,
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const formatNumber = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  if (loading) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!dj) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="person-outline" size={48} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, marginTop: spacing.md }}>DJ no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Perfil DJ</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Avatar + info */}
        <View style={s.profileTop}>
          <View style={s.avatarRing}>
            <View style={s.avatar}>
              {dj.avatar_url ? (
                <Text style={{ fontSize: 40 }}>{dj.avatar_url}</Text>
              ) : (
                <Ionicons name="headset" size={40} color="#fff" />
              )}
            </View>
          </View>
          <Text style={s.name}>{dj.display_name}</Text>
          {dj.dj_verified && (
            <View style={s.verifiedRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={s.verified}>Verificado</Text>
            </View>
          )}
          {dj.bio && <Text style={s.bio}>{dj.bio}</Text>}
        </View>

        {/* Stats */}
        {stats && (
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statVal}>{formatNumber(stats.totalSessions)}</Text>
              <Text style={s.statLabel}>Sesiones</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statVal}>{formatNumber(stats.followers)}</Text>
              <Text style={s.statLabel}>Seguidores</Text>
            </View>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: colors.warning }]}>
                {stats.avgRating > 0 ? `${stats.avgRating}★` : '—'}
              </Text>
              <Text style={s.statLabel}>Rating</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statVal}>{formatNumber(stats.totalTips)}</Text>
              <Text style={s.statLabel}>Decibelios</Text>
            </View>
          </View>
        )}

        {/* Follow button */}
        <TouchableOpacity 
          style={[s.followBtn, isFollowing && s.followingBtn]} 
          onPress={toggleFollow}
        >
          <Ionicons 
            name={isFollowing ? 'checkmark' : 'add'} 
            size={18} 
            color={isFollowing ? colors.primary : '#fff'} 
          />
          <Text style={[s.followText, isFollowing && s.followingText]}>
            {isFollowing ? 'Siguiendo' : 'Seguir'}
          </Text>
        </TouchableOpacity>

        {/* Recent sessions */}
        {sessions.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Sesiones recientes</Text>
            {sessions.map((session) => (
              <TouchableOpacity 
                key={session.id} 
                style={s.sessionCard}
                onPress={() => router.push(`/session/${session.id}`)}
              >
                <View style={s.sessionIcon}>
                  <Ionicons name="radio" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.sessionName}>{session.name}</Text>
                  <Text style={s.sessionMeta}>
                    {formatDate(session.created_at)} · 👥 {session.member_count}
                  </Text>
                </View>
                {session.rating > 0 && (
                  <View style={s.ratingBadge}>
                    <Text style={s.ratingText}>{session.rating}★</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Genres */}
        {dj.genres && dj.genres.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Géneros</Text>
            <View style={s.genresWrap}>
              {dj.genres.map(g => (
                <View key={g} style={s.genrePill}>
                  <Text style={s.genreText}>{g}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  content: { padding: spacing.base, paddingBottom: 40 },
  profileTop: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  avatarRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#E91E63', alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.h2, color: colors.textPrimary, fontSize: 22, marginTop: spacing.sm },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verified: { ...typography.captionBold, color: colors.primary, fontSize: 12 },
  bio: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', fontSize: 13, lineHeight: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base, marginBottom: spacing.md },
  stat: { alignItems: 'center' },
  statVal: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  statLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  followBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 14, marginBottom: spacing.lg },
  followingBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  followText: { ...typography.button, color: '#fff', fontSize: 15 },
  followingText: { color: colors.primary },
  sectionTitle: { ...typography.bodyBold, color: colors.textSecondary, fontSize: 14, marginBottom: spacing.sm, marginTop: spacing.sm },
  sessionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  sessionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  sessionName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 14 },
  sessionMeta: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  ratingBadge: { backgroundColor: colors.warning + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  ratingText: { ...typography.captionBold, color: colors.warning, fontSize: 12 },
  genresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  genrePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.primary + '15' },
  genreText: { ...typography.captionBold, color: colors.primary, fontSize: 12 },
});
