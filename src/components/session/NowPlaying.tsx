/**
 * WhatsSound — Now Playing Component
 * Muestra la canción actual con controles de DJ
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export interface Song {
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  duration?: string;
  elapsed?: string;
  progress?: number;
}

interface NowPlayingProps {
  song: Song;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onSkip?: () => void;
  onPrevious?: () => void;
  showControls?: boolean;
}

export const PulsingDot: React.FC = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.8, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={[styles.pulseRing, { transform: [{ scale }], opacity }]} />
      <View style={styles.liveDot} />
    </View>
  );
};

export const NowPlaying: React.FC<NowPlayingProps> = ({
  song,
  isPlaying = true,
  onPlayPause,
  onSkip,
  onPrevious,
  showControls = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PulsingDot />
        <Text style={styles.liveText}>EN VIVO</Text>
      </View>

      <View style={styles.songRow}>
        {song.albumArt && (
          <Image source={{ uri: song.albumArt }} style={styles.albumArt} />
        )}
        <View style={styles.songInfo}>
          <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
          {song.album && <Text style={styles.album} numberOfLines={1}>{song.album}</Text>}
        </View>
      </View>

      {song.progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${song.progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{song.elapsed || '0:00'}</Text>
            <Text style={styles.time}>{song.duration || '0:00'}</Text>
          </View>
        </View>
      )}

      {showControls && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={onPrevious}>
            <Ionicons name="play-skip-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playBtn} onPress={onPlayPause}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={onSkip}>
            <Ionicons name="play-skip-forward" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pulseContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  pulseRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    ...typography.caption,
    color: '#EF4444',
    fontWeight: '700',
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  albumArt: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  songInfo: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  artist: {
    ...typography.body,
    color: colors.textSecondary,
  },
  album: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  controlBtn: {
    padding: spacing.sm,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NowPlaying;
