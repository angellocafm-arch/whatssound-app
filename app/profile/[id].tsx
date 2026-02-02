/**
 * WhatsSound — Perfil de Usuario/DJ
 * Vista completa con stats, badges, historial y diferenciación DJ vs usuario
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

// ─── Types ───────────────────────────────────────────────────

interface DJProfile {
  id: string;
  name: string;
  initials: string;
  bio: string;
  isDJ: true;
  verified: boolean;
  sessions: number;
  followers: string;
  following: number;
  tips: string;
  rating: number;
  genres: string[];
  color: string;
  recentSessions: { name: string; date: string; listeners: number; duration: string }[];
  badges: { icon: string; label: string; color: string }[];
}

interface UserProfile {
  id: string;
  name: string;
  initials: string;
  bio: string;
  isDJ: false;
  verified: boolean;
  sessionsAttended: number;
  followers: string;
  following: number;
  djsFollowed: number;
  color: string;
  topSongs: { name: string; artist: string; timesRequested: number }[];
  favoriteDJs: { name: string; initials: string; genre: string; color: string }[];
  badges: { icon: string; label: string; color: string }[];
}

type Profile = DJProfile | UserProfile;

// ─── Mock Data ───────────────────────────────────────────────

const PROFILES: Record<string, Profile> = {
  dj1: {
    id: 'dj1', name: 'Carlos Madrid', initials: 'CM',
    bio: 'DJ profesional desde 2015. Reggaetón, Latin House, Dembow. Madrid 🇪🇸',
    isDJ: true, verified: true, sessions: 156, followers: '2.3K', following: 89, tips: '€4.2K', rating: 4.8,
    genres: ['Reggaetón', 'Latin House', 'Dembow', 'Urban'],
    color: '#25D366',
    recentSessions: [
      { name: 'Viernes Latino 🔥', date: 'Hoy · 22:00', listeners: 234, duration: '2h 15m' },
      { name: 'Sábado Dembow', date: 'Ayer · 23:30', listeners: 187, duration: '3h 20m' },
      { name: 'Latin House Night', date: 'Mié · 21:00', listeners: 156, duration: '2h 45m' },
      { name: 'Reggaetón Clásico', date: 'Dom · 20:00', listeners: 98, duration: '1h 30m' },
    ],
    badges: [
      { icon: '🏆', label: 'Top DJ Madrid', color: '#FFD54F' },
      { icon: '🔥', label: '100+ Sesiones', color: '#EF5350' },
      { icon: '⭐', label: '4.5+ Rating', color: '#FFA726' },
      { icon: '💰', label: 'Top Tips', color: '#25D366' },
      { icon: '🎵', label: 'Trendsetter', color: '#53BDEB' },
    ],
  },
  user1: {
    id: 'user1', name: 'María García', initials: 'MG',
    bio: 'Amante de la música latina ❤️',
    isDJ: false, verified: false, sessionsAttended: 45, followers: '127', following: 23, djsFollowed: 23,
    color: '#AB47BC',
    topSongs: [
      { name: 'Yandel 150', artist: 'Yandel, Feid', timesRequested: 12 },
      { name: 'La Bebe', artist: 'Peso Pluma', timesRequested: 8 },
      { name: 'Classy 101', artist: 'Feid, Young Miko', timesRequested: 7 },
      { name: 'TQG', artist: 'Karol G, Shakira', timesRequested: 5 },
    ],
    favoriteDJs: [
      { name: 'Carlos Madrid', initials: 'CM', genre: 'Reggaetón', color: '#25D366' },
      { name: 'DJ KRTL', initials: 'KR', genre: 'Techno', color: '#53BDEB' },
      { name: 'Luna Beats', initials: 'LB', genre: 'Lo-fi', color: '#FFA726' },
    ],
    badges: [
      { icon: '🎉', label: 'Party Animal', color: '#AB47BC' },
      { icon: '🎵', label: '50+ Peticiones', color: '#25D366' },
      { icon: '👑', label: 'Early Adopter', color: '#FFD54F' },
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────────

const getProfile = (id: string): Profile => {
  if (PROFILES[id]) return PROFILES[id];
  // Default to DJ profile for demo
  return PROFILES['dj1'];
};

// ─── Components ──────────────────────────────────────────────

const StatBox = ({ value, label }: { value: string | number; label: string }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const StatDivider = () => <View style={styles.statDivider} />;

// ─── Main Screen ─────────────────────────────────────────────

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [following, setFollowing] = useState(false);

  const profile = getProfile(id || 'dj1');

  const handleShare = async () => {
    await Share.share({
      message: `¡Mira el perfil de ${profile.name} en WhatsSound! 🎧\nhttps://whatssound.app/u/${profile.id}`,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header banner */}
      <View style={[styles.headerBg, { backgroundColor: profile.color + '25' }]}>
        <View style={styles.headerOverlay}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar + name */}
      <View style={styles.profileSection}>
        <View style={[styles.avatarLarge, { backgroundColor: profile.color + '25', borderColor: profile.color }]}>
          <Text style={[styles.avatarText, { color: profile.color }]}>{profile.initials}</Text>
          {profile.isDJ && (
            <View style={[styles.avatarLiveBadge, profile.isDJ ? {} : { display: 'none' }]}>
              <Ionicons name="headset" size={14} color={colors.textOnPrimary} />
            </View>
          )}
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.name}</Text>
          {profile.verified && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
        </View>
        {profile.isDJ && (
          <View style={styles.djTag}>
            <Ionicons name="headset-outline" size={12} color={colors.primary} />
            <Text style={styles.djTagText}>DJ Profesional</Text>
          </View>
        )}
        <Text style={styles.bio}>{profile.bio}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {profile.isDJ ? (
            <>
              <StatBox value={profile.sessions} label="Sesiones" />
              <StatDivider />
              <StatBox value={profile.followers} label="Seguidores" />
              <StatDivider />
              <StatBox value={profile.following} label="Siguiendo" />
              <StatDivider />
              <StatBox value={profile.tips} label="Tips" />
            </>
          ) : (
            <>
              <StatBox value={profile.sessionsAttended} label="Asistidas" />
              <StatDivider />
              <StatBox value={profile.followers} label="Seguidores" />
              <StatDivider />
              <StatBox value={profile.following} label="Siguiendo" />
              <StatDivider />
              <StatBox value={profile.djsFollowed} label="DJs" />
            </>
          )}
        </View>

        {/* Rating for DJs */}
        {profile.isDJ && (
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <Ionicons
                key={star}
                name={star <= Math.floor(profile.rating) ? 'star' : star <= profile.rating + 0.5 ? 'star-half' : 'star-outline'}
                size={18}
                color="#FFD54F"
              />
            ))}
            <Text style={styles.ratingText}>{profile.rating}</Text>
            <Text style={styles.ratingCount}>(328 reseñas)</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, following ? styles.actionBtnActive : styles.actionBtnPrimary]}
            onPress={() => setFollowing(!following)}
          >
            <Ionicons name={following ? 'checkmark' : 'person-add-outline'} size={16} color={following ? colors.primary : colors.textOnPrimary} />
            <Text style={[styles.actionBtnText, following && styles.actionBtnTextActive]}>
              {following ? 'Siguiendo' : 'Seguir'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnSecondary}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
            <Text style={styles.actionBtnSecondaryText}>Mensaje</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnIcon} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏅 Logros</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
          {profile.badges.map((badge, i) => (
            <View key={i} style={[styles.badgeCard, { borderColor: badge.color + '40' }]}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={styles.badgeLabel}>{badge.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* DJ: Genres */}
      {profile.isDJ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎶 Géneros</Text>
          <View style={styles.genresRow}>
            {profile.genres.map(g => (
              <View key={g} style={styles.genreChip}>
                <Text style={styles.genreChipText}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* DJ: Recent sessions */}
      {profile.isDJ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📻 Sesiones recientes</Text>
          {profile.recentSessions.map((s, i) => (
            <TouchableOpacity key={i} style={styles.sessionItem}>
              <View style={styles.sessionIcon}>
                <Ionicons name="musical-notes" size={18} color={colors.primary} />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionName}>{s.name}</Text>
                <Text style={styles.sessionMeta}>{s.date} · {s.duration}</Text>
              </View>
              <View style={styles.sessionRight}>
                <Ionicons name="headset-outline" size={13} color={colors.textMuted} />
                <Text style={styles.sessionListeners}>{s.listeners}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* User: Top songs */}
      {!profile.isDJ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎵 Canciones más pedidas</Text>
          {profile.topSongs.map((song, i) => (
            <View key={i} style={styles.songItem}>
              <Text style={styles.songRank}>#{i + 1}</Text>
              <View style={styles.songInfo}>
                <Text style={styles.songName}>{song.name}</Text>
                <Text style={styles.songArtist}>{song.artist}</Text>
              </View>
              <Text style={styles.songCount}>{song.timesRequested}×</Text>
            </View>
          ))}
        </View>
      )}

      {/* User: Favorite DJs */}
      {!profile.isDJ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❤️ DJs favoritos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favDjsScroll}>
            {profile.favoriteDJs.map((dj, i) => (
              <TouchableOpacity key={i} style={styles.favDjCard} onPress={() => router.push(`/profile/dj1` as any)}>
                <View style={[styles.favDjAvatar, { backgroundColor: dj.color + '25' }]}>
                  <Text style={[styles.favDjInitials, { color: dj.color }]}>{dj.initials}</Text>
                </View>
                <Text style={styles.favDjName}>{dj.name}</Text>
                <Text style={styles.favDjGenre}>{dj.genre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ height: spacing['3xl'] }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['3xl'] },

  // Header
  headerBg: { height: 140 },
  headerOverlay: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingTop: spacing.xl,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.background + 'CC', alignItems: 'center', justifyContent: 'center',
  },
  moreBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.background + 'CC', alignItems: 'center', justifyContent: 'center',
  },

  // Profile
  profileSection: { alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: -50, gap: spacing.sm },
  avatarLarge: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '700' },
  avatarLiveBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.background,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { ...typography.h1, color: colors.textPrimary },
  djTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  djTagText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  bio: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    marginTop: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
  },
  statBox: { alignItems: 'center' },
  statValue: { ...typography.h3, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textMuted },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },

  // Rating
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  ratingText: { ...typography.bodyBold, color: '#FFD54F', marginLeft: 4 },
  ratingCount: { ...typography.caption, color: colors.textMuted },

  // Action buttons
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
  },
  actionBtnPrimary: { backgroundColor: colors.primary },
  actionBtnActive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  actionBtnText: { ...typography.buttonSmall, color: colors.textOnPrimary },
  actionBtnTextActive: { color: colors.primary },
  actionBtnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.primary,
  },
  actionBtnSecondaryText: { ...typography.buttonSmall, color: colors.primary },
  actionBtnIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },

  // Sections
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.base },
  sectionTitle: {
    ...typography.captionBold, color: colors.textMuted, letterSpacing: 0.5,
    marginBottom: spacing.md,
  },

  // Badges
  badgesScroll: { gap: spacing.sm },
  badgeCard: {
    alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  badgeIcon: { fontSize: 24 },
  badgeLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },

  // Genres
  genresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  genreChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    backgroundColor: colors.primary + '15', borderRadius: borderRadius.full,
  },
  genreChipText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },

  // Sessions
  sessionItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: colors.divider,
  },
  sessionIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  sessionInfo: { flex: 1, gap: 2 },
  sessionName: { ...typography.bodyBold, color: colors.textPrimary },
  sessionMeta: { ...typography.caption, color: colors.textMuted },
  sessionRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionListeners: { ...typography.caption, color: colors.textMuted },

  // Songs
  songItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 0.5, borderBottomColor: colors.divider,
  },
  songRank: { ...typography.bodyBold, color: colors.primary, width: 28 },
  songInfo: { flex: 1, gap: 1 },
  songName: { ...typography.bodyBold, color: colors.textPrimary },
  songArtist: { ...typography.caption, color: colors.textMuted },
  songCount: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },

  // Favorite DJs
  favDjsScroll: { gap: spacing.md },
  favDjCard: {
    alignItems: 'center', gap: 4, width: 80,
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
  },
  favDjAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  favDjInitials: { fontSize: 18, fontWeight: '700' },
  favDjName: { ...typography.caption, color: colors.textPrimary, fontWeight: '600', textAlign: 'center' },
  favDjGenre: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
});
