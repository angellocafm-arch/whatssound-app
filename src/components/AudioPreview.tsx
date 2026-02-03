import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import colors from '../theme/colors';

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
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const positionInterval = useRef<NodeJS.Timeout | null>(null);

  const buttonSize = {
    small: 32,
    medium: 48,
    large: 64
  }[size];

  const iconSize = {
    small: 16,
    medium: 24,
    large: 32
  }[size];

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (positionInterval.current) {
        clearInterval(positionInterval.current);
      }
    };
  }, [sound]);

  const playPreview = async () => {
    if (!previewUrl) {
      onError?.('No hay preview disponible');
      return;
    }

    try {
      setIsLoading(true);

      // Si ya hay un sonido cargado, continuar reproduciendo
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
            if (positionInterval.current) {
              clearInterval(positionInterval.current);
            }
          } else {
            await sound.playAsync();
            setIsPlaying(true);
            startPositionTracking();
          }
          setIsLoading(false);
          return;
        }
      }

      // Configurar audio para web y móvil
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      console.log('Cargando preview:', previewUrl);

      // Crear nuevo sonido
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        { shouldPlay: true, isLooping: false, volume: 0.8 }
      );

      setSound(newSound);
      setIsPlaying(true);

      // Obtener duración (30s típicamente)
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.durationMillis && duration === 0) {
            setDuration(status.durationMillis);
          }
          
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
            if (positionInterval.current) {
              clearInterval(positionInterval.current);
            }
          }
        }
      });

      startPositionTracking();
      
    } catch (error) {
      console.error('Error reproduciendo preview:', error);
      onError?.('Error reproduciendo preview');
    } finally {
      setIsLoading(false);
    }
  };

  const startPositionTracking = () => {
    if (positionInterval.current) {
      clearInterval(positionInterval.current);
    }

    positionInterval.current = setInterval(async () => {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          setPosition(status.positionMillis || 0);
        }
      }
    }, 100);
  };

  const stopPreview = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
      if (positionInterval.current) {
        clearInterval(positionInterval.current);
      }
    }
  };

  const formatTime = (millis: number): string => {
    const seconds = Math.floor(millis / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressWidth = duration > 0 ? `${(position / duration) * 100}%` : '0%';

  if (!previewUrl) {
    return null;
  }

  return (
    <View style={[styles.container, { opacity: previewUrl ? 1 : 0.5 }]}>
      <TouchableOpacity 
        style={[styles.playButton, { width: buttonSize, height: buttonSize }]}
        onPress={isPlaying ? stopPreview : playPreview}
        disabled={isLoading || !previewUrl}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.text.primary} />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={iconSize}
            color={colors.text.primary}
          />
        )}
      </TouchableOpacity>

      {size !== 'small' && (
        <View style={styles.infoContainer}>
          {showTitle && trackTitle && (
            <Text style={styles.trackTitle} numberOfLines={1}>
              {trackTitle}
            </Text>
          )}
          {showTitle && artistName && (
            <Text style={styles.artistName} numberOfLines={1}>
              {artistName}
            </Text>
          )}
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.timeText}>
              {formatTime(position)} / {formatTime(duration || 30000)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  artistName: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: colors.surface.elevated,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  timeText: {
    fontSize: 10,
    color: colors.text.secondary,
    minWidth: 60,
  },
});