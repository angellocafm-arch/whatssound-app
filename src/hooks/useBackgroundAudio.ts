/**
 * WhatsSound — useBackgroundAudio Hook
 * Integra reproducción de audio en segundo plano con el player de sesión
 * 
 * Funcionalidades:
 * - Audio sigue sonando con pantalla bloqueada
 * - Controles en lock screen (iOS/Android/Web)
 * - Notificación persistente en Android
 * - Metadata de canción actual
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import {
  initBackgroundAudio,
  updateNowPlaying,
  setMediaSessionHandlers,
  setPlaybackState,
  cleanupBackgroundAudio,
} from '../lib/audio-background';

export interface Song {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  duration?: number;
}

export interface UseBackgroundAudioOptions {
  /** Canción actualmente reproduciéndose */
  currentSong?: Song | null;
  /** Estado de reproducción */
  isPlaying?: boolean;
  /** Tiempo actual en segundos */
  currentTime?: number;
  /** Callback cuando el usuario presiona play desde controles externos */
  onPlay?: () => void;
  /** Callback cuando el usuario presiona pause desde controles externos */
  onPause?: () => void;
  /** Callback cuando el usuario presiona siguiente */
  onNextTrack?: () => void;
  /** Callback cuando el usuario presiona anterior */
  onPreviousTrack?: () => void;
  /** Callback cuando el usuario hace seek */
  onSeekTo?: (time: number) => void;
  /** Habilitar/deshabilitar el hook */
  enabled?: boolean;
}

/**
 * Hook para manejar reproducción de audio en segundo plano
 * 
 * @example
 * ```tsx
 * function SessionPlayer() {
 *   const [isPlaying, setIsPlaying] = useState(false);
 *   const [currentSong, setCurrentSong] = useState(null);
 *   
 *   useBackgroundAudio({
 *     currentSong,
 *     isPlaying,
 *     onPlay: () => setIsPlaying(true),
 *     onPause: () => setIsPlaying(false),
 *     onNextTrack: () => skipToNext(),
 *   });
 *   
 *   return <Player ... />;
 * }
 * ```
 */
export function useBackgroundAudio(options: UseBackgroundAudioOptions = {}) {
  const {
    currentSong,
    isPlaying = false,
    currentTime = 0,
    onPlay,
    onPause,
    onNextTrack,
    onPreviousTrack,
    onSeekTo,
    enabled = true,
  } = options;
  
  const isInitializedRef = useRef(false);
  const lastSongRef = useRef<string | null>(null);
  
  // Inicializar modo de audio al montar
  useEffect(() => {
    if (!enabled) return;
    
    const initialize = async () => {
      if (!isInitializedRef.current) {
        await initBackgroundAudio();
        isInitializedRef.current = true;
      }
    };
    
    initialize();
    
    return () => {
      // Cleanup al desmontar
      cleanupBackgroundAudio();
      isInitializedRef.current = false;
    };
  }, [enabled]);
  
  // Configurar handlers de Media Session
  useEffect(() => {
    if (!enabled) return;
    
    setMediaSessionHandlers({
      play: onPlay,
      pause: onPause,
      nextTrack: onNextTrack,
      previousTrack: onPreviousTrack,
      seekTo: onSeekTo,
    });
  }, [enabled, onPlay, onPause, onNextTrack, onPreviousTrack, onSeekTo]);
  
  // Actualizar metadata cuando cambia la canción
  useEffect(() => {
    if (!enabled || !currentSong) return;
    
    // Solo actualizar si cambió la canción
    const songKey = `${currentSong.title}-${currentSong.artist}`;
    if (songKey !== lastSongRef.current) {
      lastSongRef.current = songKey;
      
      updateNowPlaying({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album,
        artwork: currentSong.artwork,
        duration: currentSong.duration,
        currentTime,
      });
    }
  }, [enabled, currentSong?.title, currentSong?.artist]);
  
  // Actualizar posición periódicamente
  useEffect(() => {
    if (!enabled || !currentSong?.duration) return;
    
    updateNowPlaying({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album,
      artwork: currentSong.artwork,
      duration: currentSong.duration,
      currentTime,
    });
  }, [enabled, currentTime, currentSong?.duration]);
  
  // Actualizar estado de reproducción
  useEffect(() => {
    if (!enabled) return;
    setPlaybackState(isPlaying ? 'playing' : 'paused');
  }, [enabled, isPlaying]);
  
  // Manejar cambios de estado de la app (foreground/background)
  useEffect(() => {
    if (!enabled) return;
    
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (__DEV__) {
        console.log('[useBackgroundAudio] App state:', nextAppState);
      }
      
      // El audio continúa automáticamente gracias a la configuración de expo-av
      // Este handler es útil para analytics o ajustes de UI
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [enabled]);
  
  // Retornar utilidades
  return {
    /** Indica si el background audio está inicializado */
    isInitialized: isInitializedRef.current,
    /** Indica si el dispositivo soporta background audio real */
    supportsBackgroundAudio: Platform.OS !== 'web',
    /** Actualizar metadata manualmente si es necesario */
    updateNowPlaying: (song: Song) => {
      if (enabled) {
        updateNowPlaying({
          ...song,
          currentTime,
        });
      }
    },
  };
}

export default useBackgroundAudio;
