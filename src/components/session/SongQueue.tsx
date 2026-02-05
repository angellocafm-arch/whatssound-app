/**
 * WhatsSound — Song Queue Component
 * Lista de canciones en cola con votos
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export interface QueuedSong {
  id?: string;
  title: string;
  artist: string;
  votes: number;
  requester?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface SongQueueProps {
  songs: QueuedSong[];
  onApprove?: (song: QueuedSong) => void;
  onReject?: (song: QueuedSong) => void;
  onPlay?: (song: QueuedSong) => void;
  showActions?: boolean;
  title?: string;
}

export const SongQueue: React.FC<SongQueueProps> = ({
  songs,
  onApprove,
  onReject,
  onPlay,
  showActions = true,
  title = '🎵 Cola de canciones',
}) => {
  const renderSong = ({ item, index }: { item: QueuedSong; index: number }) => (
    <View style={styles.songCard}>
      <View style={styles.position}>
        <Text style={styles.positionText}>{index + 1}</Text>
      </View>
      
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
        {item.requester && (
          <Text style={styles.requester}>Pedida por {item.requester}</Text>
        )}
      </View>

      <View style={styles.votesContainer}>
        <Ionicons name="heart" size={16} color={colors.primary} />
        <Text style={styles.votes}>{item.votes}</Text>
      </View>

      {showActions && (
        <View style={styles.actions}>
          {onApprove && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => onApprove(item)}
            >
              <Ionicons name="checkmark" size={18} color="#10B981" />
            </TouchableOpacity>
          )}
          {onReject && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => onReject(item)}
            >
              <Ionicons name="close" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
          {onPlay && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.playBtn]}
              onPress={() => onPlay(item)}
            >
              <Ionicons name="play" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {songs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No hay canciones en cola</Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          renderItem={renderSong}
          keyExtractor={(item, index) => item.id || `song-${index}`}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  position: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  positionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  songArtist: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  requester: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  votesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  votes: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#10B98120',
  },
  rejectBtn: {
    backgroundColor: '#EF444420',
  },
  playBtn: {
    backgroundColor: colors.primary + '20',
  },
  empty: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
});

export default SongQueue;
