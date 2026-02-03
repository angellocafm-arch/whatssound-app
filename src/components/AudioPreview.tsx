import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface AudioPreviewProps {
  previewUrl?: string;
  trackTitle?: string;
  artistName?: string;
  onError?: (error: string) => void;
  size?: 'small' | 'medium' | 'large';
  showTitle?: boolean;
}

export default function AudioPreview({ 
  previewUrl, 
  trackTitle, 
  artistName,
  onError,
  size = 'medium',
  showTitle = true
}: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(30000);
  const rafRef = useRef<number | null>(null);

  const buttonSize = { small: 32, medium: 48, large: 64 }[size];
  const iconSize = { small: 16, medium: 24, large: 32 }[size];

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const trackPosition = useCallback(() => {
    if (!audioRef.current) return;
    setPosition(audioRef.current.currentTime * 1000);
    if (!audioRef.current.paused) {
      rafRef.current = requestAnimationFrame(trackPosition);
    }
  }, []);

  const togglePlay = async () => {
    if (!previewUrl) { onError?.('No hay preview disponible'); return; }

    try {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      if (audioRef.current && audioRef.current.src) {
        await audioRef.current.play();
        setIsPlaying(true);
        trackPosition();
        return;
      }

      setIsLoading(true);
      const AudioCtor = (globalThis as any).Audio || window.Audio;
      if (!AudioCtor) { onError?.('Audio not supported'); setIsLoading(false); return; }
      const audio = new AudioCtor(previewUrl);
      audio.volume = 0.8;
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && isFinite(audio.duration)) {
          setDuration(audio.duration * 1000);
        }
      });
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setPosition(0);
      });
      audio.addEventListener('error', () => {
        onError?.('Error reproduciendo preview');
        setIsPlaying(false);
        setIsLoading(false);
      });

      await audio.play();
      setIsPlaying(true);
      setIsLoading(false);
      trackPosition();
    } catch (e) {
      console.error('Audio error:', e);
      onError?.('Error reproduciendo preview');
      setIsLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const progressWidth = duration > 0 ? `${(position / duration) * 100}%` : '0%';

  if (!previewUrl) return null;

  return (
    <View style={[styles.container, { opacity: previewUrl ? 1 : 0.5 }]}>
      <TouchableOpacity 
        style={[styles.playButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
        onPress={togglePlay}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.textPrimary} />
        ) : (
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={iconSize} color={colors.textPrimary} />
        )}
      </TouchableOpacity>

      {size !== 'small' && (
        <View style={styles.infoContainer}>
          {showTitle && trackTitle && <Text style={styles.trackTitle} numberOfLines={1}>{trackTitle}</Text>}
          {showTitle && artistName && <Text style={styles.artistName} numberOfLines={1}>{artistName}</Text>}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: progressWidth as any }]} />
            </View>
            <Text style={styles.timeText}>{formatTime(position)} / {formatTime(duration)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playButton: { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  infoContainer: { flex: 1, gap: 4 },
  trackTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  artistName: { fontSize: 12, color: colors.textSecondary },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 3, backgroundColor: colors.surfaceLight, borderRadius: 1.5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  timeText: { fontSize: 10, color: colors.textSecondary, minWidth: 60 },
});
