/**
 * WhatsSound — Music Player Component
 * Plays 30s Deezer previews via HTML5 Audio (web)
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface MusicPlayerProps {
  trackName: string;
  artist: string;
  albumArt?: string | null;
  previewUrl?: string | null;
  onClose?: () => void;
}

export function MusicPlayer({ trackName, artist, albumArt, previewUrl, onClose }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(30);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Create audio element (web only)
    if (typeof window !== 'undefined' && previewUrl) {
      const audio = new Audio(previewUrl);
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration || 30);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
        // Clear media session on end
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'none';
        }
      });

      // ═══ Media Session API — background playback + lock screen controls ═══
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: trackName,
          artist: artist,
          album: 'WhatsSound',
          artwork: albumArt ? [
            { src: albumArt, sizes: '96x96', type: 'image/jpeg' },
            { src: albumArt, sizes: '256x256', type: 'image/jpeg' },
            { src: albumArt, sizes: '512x512', type: 'image/jpeg' },
          ] : [],
        });

        navigator.mediaSession.setActionHandler('play', () => {
          audio.play().catch(() => {});
          setIsPlaying(true);
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          audio.pause();
          setIsPlaying(false);
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          audio.pause();
          audio.currentTime = 0;
          setIsPlaying(false);
          setProgress(0);
        });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime != null) {
            audio.currentTime = details.seekTime;
            setProgress(details.seekTime / (audio.duration || 30));
          }
        });
      }

      return () => {
        audio.pause();
        audio.src = '';
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Clean up media session handlers
        if ('mediaSession' in navigator) {
          try {
            navigator.mediaSession.setActionHandler('play', null);
            navigator.mediaSession.setActionHandler('pause', null);
            navigator.mediaSession.setActionHandler('stop', null);
            navigator.mediaSession.setActionHandler('seekto', null);
          } catch {}
        }
      };
    }
  }, [previewUrl, trackName, artist, albumArt]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime / (audioRef.current.duration || 30));
        }
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    } else {
      audioRef.current.play().catch(() => {});
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentTime = progress * duration;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Album art */}
        <View style={styles.artContainer}>
          {albumArt ? (
            <Image source={{ uri: albumArt }} style={styles.albumArt} />
          ) : (
            <View style={styles.artPlaceholder}>
              <Ionicons name="musical-note" size={20} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Track info */}
        <View style={styles.info}>
          <Text style={styles.trackName} numberOfLines={1}>{trackName}</Text>
          <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
        </View>

        {/* Play/Pause button */}
        <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={22}
            color={colors.textOnPrimary}
          />
        </TouchableOpacity>

        {/* Close */}
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatTime(currentTime)}</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a2632',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  artContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  albumArt: {
    width: 44,
    height: 44,
  },
  artPlaceholder: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  info: {
    flex: 1,
  },
  trackName: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  progressContainer: {
    marginTop: 6,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
});
