/**
 * WhatsSound — En Vivo
 * Sesiones activas — datos reales de Supabase
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
import { Badge } from '../../src/components/ui/Badge';
import { Avatar } from '../../src/components/ui/Avatar';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useSessionStore, type MusicSession } from '../../src/stores/sessionStore';

const FILTERS = ['Todos', 'Mis grupos', 'Cerca de mí', 'Públicas'];

// All data from Supabase

export default function LiveScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [refreshing, setRefreshing] = useState(false);
  const { sessions, loading, fetchLiveSessions } = useSessionStore();
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetchLiveSessions().catch(() => setFetchError(true));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setFetchError(false);
    try {
      await fetchLiveSessions();
    } catch {
      setFetchError(true);
    }
    setRefreshing(false);
  };

  const allSessions = sessions.map(s => ({
    id: s.id,
    name: s.name,
    dj_display_name: s.dj_display_name || 'DJ',
    genre: s.genre || 'Varios',
    listener_count: s.listener_count,
    current_song: s.current_song || 'Sin canción',
    current_artist: s.current_artist || '',
  }));

  const featured = allSessions.reduce((max, s) => s.listener_count > max.listener_count ? s : max, allSessions[0]);
  const totalActive = allSessions.length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>En Vivo</Text>
          <Text style={styles.subtitle}>{totalActive} sesiones activas ahora</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/session/create')}>
          <Ionicons name="add" size={20} color={colors.textOnPrimary} />
          <Text style={styles.createText}>Crear</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading state */}
      {loading && !refreshing && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Cargando sesiones...</Text>
        </View>
      )}

      {/* Error state */}
      {!loading && fetchError && (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.stateTitle}>Sin conexión</Text>
          <Text style={styles.stateText}>No pudimos cargar las sesiones</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color={colors.textOnPrimary} />
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty state */}
      {!loading && !fetchError && sessions.length === 0 && (
        <View style={styles.centerState}>
          <Ionicons name="radio-outline" size={48} color={colors.textMuted} />
          <Text style={styles.stateTitle}>No hay sesiones en vivo</Text>
          <Text style={styles.stateText}>Sé el primero en crear una sesión</Text>
        </View>
      )}

      {/* Featured session */}
      {!loading && featured && (
        <Card style={styles.featuredCard}>
          <View style={styles.featuredBadge}>
            <Badge text="🟢 EN VIVO" variant="live" />
          </View>
          <View style={styles.featuredContent}>
            <View style={styles.featuredInfo}>
              <Text style={styles.featuredName}>{featured.name}</Text>
              <Text style={styles.featuredDj}>{featured.dj_display_name} · {featured.genre}</Text>
              <View style={styles.featuredSong}>
                <Ionicons name="musical-note" size={14} color={colors.primary} />
                <Text style={styles.featuredSongText}>{featured.current_song} - {featured.current_artist}</Text>
              </View>
              <View style={styles.featuredListeners}>
                <Ionicons name="people" size={14} color={colors.accent} />
                <Text style={styles.featuredListenersText}>{featured.listener_count} escuchando</Text>
              </View>
            </View>
            <Button title="Unirse" onPress={() => router.push(`/session/${featured.id}`)} size="sm" />
          </View>
        </Card>
      )}

      {/* Session list */}
      {!loading && allSessions.map(session => (
        <TouchableOpacity
          key={session.id}
          style={styles.sessionItem}
          onPress={() => router.push(`/session/${session.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.sessionAvatar}>
            <Avatar name={session.dj_display_name} size="lg" />
            <View style={[styles.liveIndicator, styles.liveIndicatorReal]}>
              <View style={styles.livePulse} />
            </View>
          </View>
          <View style={styles.sessionInfo}>
            <View style={styles.sessionTopRow}>
              <Text style={styles.sessionName} numberOfLines={1}>{session.name}</Text>
            </View>
            <Text style={styles.sessionDj}>{session.dj_display_name} · {session.genre}</Text>
            <View style={styles.sessionSongRow}>
              <Ionicons name="musical-note" size={12} color={colors.primary} />
              <Text style={styles.sessionSong}>{session.current_song} - {session.current_artist}</Text>
            </View>
          </View>
          <View style={styles.sessionRight}>
            <Text style={styles.listenerCount}>{session.listener_count}</Text>
            <Ionicons name="people" size={14} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['3xl'] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textMuted },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  createText: { ...typography.bodyBold, color: colors.textOnPrimary, fontSize: 13 },
  filters: { marginBottom: spacing.md },
  filtersContent: { paddingHorizontal: spacing.base, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  filterActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  filterText: { ...typography.bodySmall, color: colors.textSecondary },
  filterTextActive: { color: colors.primary, fontWeight: '600' },
  featuredCard: { marginHorizontal: spacing.base, marginBottom: spacing.lg, padding: spacing.base },
  featuredBadge: { marginBottom: spacing.sm },
  featuredContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredInfo: { flex: 1, gap: 4 },
  featuredName: { ...typography.h3, color: colors.textPrimary },
  featuredDj: { ...typography.bodySmall, color: colors.textSecondary },
  featuredSong: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  featuredSongText: { ...typography.bodySmall, color: colors.primary },
  featuredListeners: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  featuredListenersText: { ...typography.caption, color: colors.accent },
  sessionItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: colors.divider,
  },
  sessionAvatar: { position: 'relative' },
  liveIndicator: {
    position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  liveIndicatorReal: { backgroundColor: colors.primary },
  livePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textOnPrimary },
  sessionInfo: { flex: 1, gap: 2 },
  sessionTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sessionName: { ...typography.bodyBold, color: colors.textPrimary },
  sessionDj: { ...typography.caption, color: colors.textSecondary },
  sessionSongRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sessionSong: { ...typography.caption, color: colors.primary },
  sessionRight: { alignItems: 'center', gap: 2 },
  listenerCount: { ...typography.bodyBold, color: colors.textPrimary },
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
