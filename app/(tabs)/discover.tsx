/**
 * WhatsSound — Descubrir
 * DJs reales de Supabase + sesiones próximas + explorar géneros
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Input } from '../../src/components/ui/Input';
import { supabase } from '../../src/lib/supabase';

interface DjProfile {
  id: string;
  display_name: string;
  username: string;
  genres: string[];
  is_dj: boolean;
  isFollowing?: boolean;
}

// All data from Supabase

const GENRES = ['🎵 Reggaeton', '🎸 Rock', '🎹 Techno', '🎷 Jazz', '🎤 Pop', '📻 Lo-Fi', '🪗 Latina', '🥁 Hip Hop'];

export default function DiscoverScreen() {
  const router = useRouter();
  const [djs, setDjs] = useState<DjProfile[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDjs, setLoadingDjs] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchDjs = async () => {
    setLoadingDjs(true);
    setFetchError(false);
    try {
      const { data: { session: _s } } = await supabase.auth.getSession(); const user = _s?.user;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, username, genres, is_dj')
        .eq('is_dj', true)
        .order('display_name');

      if (error) {
        setFetchError(true);
      } else if (data) {
        // Check which ones we follow
        let followedIds: string[] = [];
        if (user) {
          const { data: follows } = await supabase
            .from('followers')
            .select('dj_id')
            .eq('follower_id', user.id);
          followedIds = (follows || []).map((f: any) => f.dj_id);
        }
        setDjs(data.map((d: any) => ({ ...d, isFollowing: followedIds.includes(d.id) })));
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoadingDjs(false);
    }
  };

  const toggleFollow = async (djId: string) => {
    const { data: { session: _s } } = await supabase.auth.getSession(); const user = _s?.user;
    if (!user) return;
    const dj = djs.find(d => d.id === djId);
    if (!dj) return;

    if (dj.isFollowing) {
      await supabase.from('followers').delete().eq('follower_id', user.id).eq('dj_id', djId);
    } else {
      await supabase.from('followers').insert({ follower_id: user.id, dj_id: djId });
    }
    // Optimistic update
    setDjs(prev => prev.map(d => d.id === djId ? { ...d, isFollowing: !d.isFollowing } : d));
  };

  useEffect(() => { fetchDjs(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDjs();
    setRefreshing(false);
  };

  const allDjs = djs;
  const filtered = search
    ? allDjs.filter(d => d.display_name.toLowerCase().includes(search.toLowerCase()) ||
        d.genres?.some(g => g.toLowerCase().includes(search.toLowerCase())))
    : allDjs;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>Descubrir</Text>

      {/* Search */}
      <View style={styles.searchSection}>
        <Input
          placeholder="Buscar DJs, géneros, sesiones..."
          value={search}
          onChangeText={setSearch}
          icon="search"
        />
      </View>

      {/* Genres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreRow} contentContainerStyle={styles.genreContent}>
        {GENRES.map(g => (
          <TouchableOpacity key={g} style={styles.genreChip} onPress={() => setSearch(g.slice(2))}>
            <Text style={styles.genreText}>{g}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Top DJs */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎧 Top DJs</Text>
        <Text style={styles.sectionCount}>{allDjs.length} DJs</Text>
      </View>

      {/* Loading state */}
      {loadingDjs && !refreshing && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Cargando DJs...</Text>
        </View>
      )}

      {/* Error state */}
      {!loadingDjs && fetchError && (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.stateTitle}>Error al cargar</Text>
          <Text style={styles.stateText}>No pudimos obtener los DJs</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchDjs}>
            <Ionicons name="refresh" size={18} color={colors.textOnPrimary} />
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty state */}
      {!loadingDjs && !fetchError && filtered.length === 0 && (
        <View style={styles.centerState}>
          <Ionicons name="headset-outline" size={48} color={colors.textMuted} />
          <Text style={styles.stateTitle}>{search ? 'Sin resultados' : 'No hay DJs aún'}</Text>
          <Text style={styles.stateText}>{search ? `No encontramos DJs para "${search}"` : 'Sé el primero en registrarte como DJ'}</Text>
        </View>
      )}

      {!loadingDjs && filtered.map(dj => (
        <TouchableOpacity key={dj.id} style={styles.djItem} activeOpacity={0.7}>
          <Avatar name={dj.display_name} size="lg" />
          <View style={styles.djInfo}>
            <View style={styles.djNameRow}>
              <Text style={styles.djName}>{dj.display_name}</Text>
            </View>
            <Text style={styles.djGenre}>{dj.genres?.join(' · ') || 'Varios'}</Text>
            <Text style={styles.djUsername}>@{dj.username}</Text>
          </View>
          <TouchableOpacity
            style={[styles.followBtn, dj.isFollowing && styles.followingBtn]}
            onPress={() => toggleFollow(dj.id)}
          >
            <Text style={[styles.followText, dj.isFollowing && styles.followingText]}>
              {dj.isFollowing ? 'Siguiendo' : 'Seguir'}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {/* Upcoming */}
      <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
        <Text style={styles.sectionTitle}>📅 Próximas sesiones</Text>
      </View>

      <View style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
        <Text style={{ ...typography.body, color: colors.textMuted }}>No hay sesiones programadas</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['3xl'] },
  title: { ...typography.h1, color: colors.textPrimary, paddingHorizontal: spacing.base, paddingTop: spacing.md },
  searchSection: { paddingHorizontal: spacing.base, marginTop: spacing.md },
  genreRow: { marginTop: spacing.md, marginBottom: spacing.sm },
  genreContent: { paddingHorizontal: spacing.base, gap: spacing.sm },
  genreChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  genreText: { ...typography.bodySmall, color: colors.textSecondary },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  sectionCount: { ...typography.caption, color: colors.textMuted },
  djItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderBottomWidth: 0.5, borderBottomColor: colors.divider,
  },
  djInfo: { flex: 1, gap: 2 },
  djNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  djName: { ...typography.bodyBold, color: colors.textPrimary },
  djGenre: { ...typography.caption, color: colors.textSecondary },
  djUsername: { ...typography.caption, color: colors.textMuted },
  followBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.primary,
  },
  followText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  followingBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  followingText: { color: colors.textOnPrimary },
  eventCard: { marginHorizontal: spacing.base, marginBottom: spacing.sm, padding: spacing.base, flexDirection: 'row', alignItems: 'center' },
  eventInfo: { flex: 1, gap: 4 },
  eventName: { ...typography.bodyBold, color: colors.textPrimary },
  eventDj: { ...typography.caption, color: colors.textSecondary },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventDate: { ...typography.caption, color: colors.textMuted },
  notifyBtn: { padding: spacing.sm },
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
