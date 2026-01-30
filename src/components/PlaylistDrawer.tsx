/**
 * WhatsSound — Playlist Drawer
 * Mini reproductor fijo + lista desplegable con votaciones y botón 💬
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

export interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt?: string | null;
  duration?: string;
  status: 'pending' | 'playing' | 'played';
  votes: number;
  userVote?: 'up' | 'down' | null;
}

interface PlaylistDrawerProps {
  tracks: PlaylistTrack[];
  currentTrack?: PlaylistTrack | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onVote: (trackId: string, vote: 'up' | 'down') => void;
  onMention: (track: PlaylistTrack) => void;
}

const MiniPlayer = ({
  track,
  isPlaying,
  onTogglePlay,
  onExpand,
}: {
  track?: PlaylistTrack | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onExpand: () => void;
}) => (
  <TouchableOpacity style={miniStyles.container} onPress={onExpand} activeOpacity={0.8}>
    <View style={miniStyles.artWrap}>
      {track?.albumArt ? (
        <Image source={{ uri: track.albumArt }} style={miniStyles.art} />
      ) : (
        <View style={miniStyles.artPlaceholder}>
          <Ionicons name="musical-note" size={16} color={colors.primary} />
        </View>
      )}
    </View>
    <View style={miniStyles.info}>
      <Text style={miniStyles.title} numberOfLines={1}>
        {track?.title || 'Sin canción'}
      </Text>
      <Text style={miniStyles.artist} numberOfLines={1}>
        {track?.artist || 'Añade música para empezar'}
      </Text>
    </View>
    <TouchableOpacity style={miniStyles.playBtn} onPress={onTogglePlay}>
      <Ionicons
        name={isPlaying ? 'pause' : 'play'}
        size={20}
        color={colors.textOnPrimary}
      />
    </TouchableOpacity>
    <Ionicons name="chevron-up" size={20} color={colors.textMuted} />
  </TouchableOpacity>
);

const TrackRow = ({
  track,
  index,
  onVote,
  onMention,
}: {
  track: PlaylistTrack;
  index: number;
  onVote: (vote: 'up' | 'down') => void;
  onMention: () => void;
}) => {
  const isPlayed = track.status === 'played';
  const isNowPlaying = track.status === 'playing';

  return (
    <View style={[trackStyles.row, isPlayed && trackStyles.rowPlayed]}>
      {/* Number / Status icon */}
      <View style={trackStyles.numberWrap}>
        {isNowPlaying ? (
          <Ionicons name="volume-high" size={16} color={colors.primary} />
        ) : isPlayed ? (
          <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} />
        ) : (
          <Text style={trackStyles.number}>{index + 1}</Text>
        )}
      </View>

      {/* Album art */}
      <View style={trackStyles.artWrap}>
        {track.albumArt ? (
          <Image source={{ uri: track.albumArt }} style={trackStyles.art} />
        ) : (
          <View style={trackStyles.artPlaceholder}>
            <Ionicons name="musical-note" size={14} color={colors.primary} />
          </View>
        )}
        {isPlayed && <View style={trackStyles.artOverlay}><Text style={trackStyles.playedMark}>✓</Text></View>}
      </View>

      {/* Info */}
      <View style={trackStyles.info}>
        <Text style={[trackStyles.title, isPlayed && trackStyles.titlePlayed]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={trackStyles.artist} numberOfLines={1}>
          {track.artist} · {track.duration || ''}
        </Text>
      </View>

      {/* Votes */}
      {!isPlayed && (
        <View style={trackStyles.voteCol}>
          <TouchableOpacity
            style={[trackStyles.voteBtn, track.userVote === 'up' && trackStyles.voteBtnActive]}
            onPress={() => onVote('up')}
            disabled={track.userVote !== undefined && track.userVote !== null}
          >
            <Text style={trackStyles.voteEmoji}>🔥</Text>
            <Text style={trackStyles.voteCount}>{track.votes}</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPlayed && (
        <View style={trackStyles.playedBadge}>
          <Text style={trackStyles.playedText}>Reproducida</Text>
        </View>
      )}

      {/* Mention button */}
      <TouchableOpacity style={trackStyles.mentionBtn} onPress={onMention}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

export function PlaylistDrawer({
  tracks,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onVote,
  onMention,
}: PlaylistDrawerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <MiniPlayer
        track={currentTrack || tracks.find(t => t.status === 'playing') || tracks[0]}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        onExpand={() => setExpanded(true)}
      />
    );
  }

  // Expanded: full playlist
  const pendingTracks = tracks.filter(t => t.status !== 'played');
  const playedTracks = tracks.filter(t => t.status === 'played');

  return (
    <View style={expandedStyles.container}>
      {/* Header */}
      <TouchableOpacity style={expandedStyles.header} onPress={() => setExpanded(false)}>
        <Text style={expandedStyles.headerTitle}>
          Lista de reproducción ({tracks.length})
        </Text>
        <Ionicons name="chevron-down" size={22} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Current playing */}
      {currentTrack && (
        <View style={expandedStyles.nowPlaying}>
          <View style={expandedStyles.nowArtWrap}>
            {currentTrack.albumArt ? (
              <Image source={{ uri: currentTrack.albumArt }} style={expandedStyles.nowArt} />
            ) : (
              <View style={expandedStyles.nowArtPlaceholder}>
                <Ionicons name="musical-note" size={20} color={colors.primary} />
              </View>
            )}
          </View>
          <View style={expandedStyles.nowInfo}>
            <Text style={expandedStyles.nowLabel}>Sonando ahora</Text>
            <Text style={expandedStyles.nowTitle} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={expandedStyles.nowArtist} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
          <TouchableOpacity style={expandedStyles.playBtn} onPress={onTogglePlay}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Track list */}
      <ScrollView style={expandedStyles.list} showsVerticalScrollIndicator={false}>
        {pendingTracks.length > 0 && (
          <Text style={expandedStyles.sectionTitle}>Próximas</Text>
        )}
        {pendingTracks.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            index={i}
            onVote={(vote) => onVote(track.id, vote)}
            onMention={() => onMention(track)}
          />
        ))}
        {playedTracks.length > 0 && (
          <Text style={expandedStyles.sectionTitle}>Ya reproducidas</Text>
        )}
        {playedTracks.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            index={pendingTracks.length + i}
            onVote={(vote) => onVote(track.id, vote)}
            onMention={() => onMention(track)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ── Mini Player Styles ──
const miniStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2632',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  artWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  art: { width: 40, height: 40 },
  artPlaceholder: {
    width: 40, height: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1 },
  title: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  artist: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  playBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ── Track Row Styles ──
const trackStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowPlayed: {
    opacity: 0.5,
  },
  numberWrap: {
    width: 24,
    alignItems: 'center',
  },
  number: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
  },
  artWrap: {
    width: 40, height: 40,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  art: { width: 40, height: 40 },
  artPlaceholder: {
    width: 40, height: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playedMark: {
    color: colors.textMuted,
    fontSize: 18,
  },
  info: { flex: 1 },
  title: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  titlePlayed: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  artist: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  voteCol: {
    alignItems: 'center',
  },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,107,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.2)',
  },
  voteBtnActive: {
    backgroundColor: 'rgba(255,107,0,0.3)',
    borderColor: '#ff6b00',
  },
  voteEmoji: { fontSize: 14 },
  voteCount: {
    ...typography.captionBold,
    color: colors.textSecondary,
    fontSize: 12,
  },
  playedBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.md,
  },
  playedText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  mentionBtn: {
    padding: 6,
  },
});

// ── Expanded Styles ──
const expandedStyles = StyleSheet.create({
  container: {
    backgroundColor: '#0f1a24',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 15,
  },
  nowPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: 'rgba(37, 211, 102, 0.08)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(37,211,102,0.2)',
  },
  nowArtWrap: {
    width: 50, height: 50,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  nowArt: { width: 50, height: 50 },
  nowArtPlaceholder: {
    width: 50, height: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nowInfo: { flex: 1 },
  nowLabel: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nowTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 15,
  },
  nowArtist: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
  },
  playBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.captionBold,
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
});
