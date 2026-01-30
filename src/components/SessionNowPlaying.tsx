/**
 * SessionNowPlaying — Mini player bar + expandable playlist
 */
import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface PlaylistTrack {
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

export interface SessionNowPlayingProps {
  playlistTracks: PlaylistTrack[];
  showPlaylist: boolean;
  onTogglePlaylist: () => void;
  onCommentTrack: (title: string) => void;
}

export const SessionNowPlaying: React.FC<SessionNowPlayingProps> = ({
  playlistTracks, showPlaylist, onTogglePlaylist, onCommentTrack,
}) => (
  <View>
    {/* Expanded playlist */}
    {showPlaylist && (
      <View style={styles.playlistContainer}>
        <View style={styles.playlistHeader}>
          <Text style={styles.playlistTitle}>
            Lista de reproducción ({playlistTracks.length})
          </Text>
          <TouchableOpacity onPress={onTogglePlaylist} {...(Platform.OS === 'web' ? { role: 'button' } : {})}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={playlistTracks}
          keyExtractor={(item) => item.id}
          renderItem={({ item: track, index: i }) => (
            <View style={styles.trackRow}>
              <Text style={styles.trackNum}>{i + 1}</Text>
              {track.albumArt ? (
                <Image source={{ uri: track.albumArt }} style={styles.trackArt} />
              ) : (
                <View style={styles.trackArtPlaceholder}>
                  <Ionicons name="musical-note" size={14} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{track.artist} · {track.duration}</Text>
              </View>
              <TouchableOpacity
                style={styles.fireBtn}
                onPress={() => { console.log('Vote fire', track.id); }}
                {...(Platform.OS === 'web' ? { role: 'button' } : {})}
              >
                <Text style={{ fontSize: 14 }}>🔥</Text>
                <Text style={styles.fireCount}>{track.votes}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 6 }}
                onPress={() => onCommentTrack(track.title)}
                {...(Platform.OS === 'web' ? { role: 'button' } : {})}
              >
                <Text style={{ fontSize: 16 }}>💬</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        {playlistTracks.length === 0 && (
          <View style={styles.emptyPlaylist}>
            <Ionicons name="musical-notes-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay canciones aún</Text>
          </View>
        )}
      </View>
    )}

    {/* Mini player bar */}
    <TouchableOpacity
      style={styles.miniPlayer}
      onPress={onTogglePlaylist}
      activeOpacity={0.8}
      {...(Platform.OS === 'web' ? { role: 'button' } : {})}
    >
      <View style={styles.playerLeft}>
        {playlistTracks[0]?.albumArt ? (
          <Image source={{ uri: playlistTracks[0].albumArt }} style={styles.albumArtImg} />
        ) : (
          <View style={styles.albumArt}>
            <Ionicons name="musical-note" size={16} color={colors.primary} />
          </View>
        )}
        <View>
          <Text style={styles.songName}>{playlistTracks[0]?.title || 'Sin canción'}</Text>
          <Text style={styles.artistName}>{playlistTracks[0]?.artist || 'Añade música para empezar'}</Text>
        </View>
      </View>
      <View style={styles.playBtn}>
        <Ionicons name="play" size={18} color={colors.textOnPrimary} />
      </View>
      <Ionicons name={showPlaylist ? 'chevron-down' : 'chevron-up'} size={20} color={colors.textMuted} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  playlistContainer: {
    backgroundColor: '#0f1a24',
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    maxHeight: 320,
  },
  playlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  playlistTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  trackNum: { color: colors.textMuted, width: 24, textAlign: 'center', fontSize: 13 },
  trackArt: { width: 40, height: 40, borderRadius: 6 },
  trackArtPlaceholder: {
    width: 40, height: 40, borderRadius: 6,
    backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  trackTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 14 },
  trackArtist: { ...typography.caption, color: colors.textSecondary, fontSize: 12 },
  fireBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(255,107,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,0,0.2)',
  },
  fireCount: { color: colors.textSecondary, fontSize: 12 },
  emptyPlaylist: { alignItems: 'center', paddingVertical: spacing['2xl'] },
  emptyText: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.sm },
  miniPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  playerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  albumArt: {
    width: 36, height: 36, borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center',
  },
  albumArtImg: { width: 36, height: 36, borderRadius: borderRadius.sm },
  songName: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '600' },
  artistName: { ...typography.caption, color: colors.textMuted },
  playBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
});
