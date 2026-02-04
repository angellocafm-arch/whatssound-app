/**
 * WhatsSound — Background Audio Service
 * Maneja reproducción de audio en segundo plano
 * 
 * iOS: Requiere UIBackgroundModes: ["audio"] en Info.plist
 * Android: Requiere FOREGROUND_SERVICE permission + notificación
 * Web: Limitado, usa Media Session API para controles
 */

import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// Estado global del modo de audio
let isInitialized = false;

/**
 * Inicializa el modo de audio para reproducción en background
 * Llamar una vez al iniciar la app
 */
export async function initBackgroundAudio(): Promise<void> {
  if (isInitialized) return;
  
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,        // Suena aunque el switch de silencio esté activo
      staysActiveInBackground: true,      // Sigue reproduciéndose en background
      shouldDuckAndroid: true,            // Baja volumen si hay otra app
      playThroughEarpieceAndroid: false,  // No usar auricular de llamada
    });
    
    isInitialized = true;
    console.log('[BackgroundAudio] Modo de audio inicializado');
  } catch (error) {
    console.error('[BackgroundAudio] Error al inicializar:', error);
  }
}

/**
 * Actualiza la información de "Now Playing" para lock screen y notificaciones
 */
export function updateNowPlaying(song: {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  duration?: number;
  currentTime?: number;
}): void {
  // En web, usar Media Session API
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album || 'WhatsSound',
        artwork: song.artwork 
          ? [
              { src: song.artwork, sizes: '96x96', type: 'image/png' },
              { src: song.artwork, sizes: '128x128', type: 'image/png' },
              { src: song.artwork, sizes: '256x256', type: 'image/png' },
              { src: song.artwork, sizes: '512x512', type: 'image/png' },
            ]
          : [],
      });
      
      // Actualizar posición si está disponible
      if (song.duration && song.currentTime !== undefined) {
        navigator.mediaSession.setPositionState({
          duration: song.duration,
          position: song.currentTime,
          playbackRate: 1.0,
        });
      }
    } catch (error) {
      console.warn('[BackgroundAudio] Error actualizando Media Session:', error);
    }
  }
  
  // En nativo (iOS/Android), expo-av maneja esto automáticamente
  // con la notificación del sistema
}

/**
 * Configura los handlers para controles de reproducción
 * (botones de lock screen, auriculares, notificación Android)
 */
export function setMediaSessionHandlers(handlers: {
  play?: () => void;
  pause?: () => void;
  stop?: () => void;
  nextTrack?: () => void;
  previousTrack?: () => void;
  seekTo?: (time: number) => void;
  seekForward?: () => void;
  seekBackward?: () => void;
}): void {
  // Media Session API solo disponible en web
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }
  
  try {
    if (handlers.play) {
      navigator.mediaSession.setActionHandler('play', handlers.play);
    }
    if (handlers.pause) {
      navigator.mediaSession.setActionHandler('pause', handlers.pause);
    }
    if (handlers.stop) {
      navigator.mediaSession.setActionHandler('stop', handlers.stop);
    }
    if (handlers.nextTrack) {
      navigator.mediaSession.setActionHandler('nexttrack', handlers.nextTrack);
    }
    if (handlers.previousTrack) {
      navigator.mediaSession.setActionHandler('previoustrack', handlers.previousTrack);
    }
    if (handlers.seekTo) {
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          handlers.seekTo!(details.seekTime);
        }
      });
    }
    if (handlers.seekForward) {
      navigator.mediaSession.setActionHandler('seekforward', handlers.seekForward);
    }
    if (handlers.seekBackward) {
      navigator.mediaSession.setActionHandler('seekbackward', handlers.seekBackward);
    }
    
    console.log('[BackgroundAudio] Media Session handlers configurados');
  } catch (error) {
    console.warn('[BackgroundAudio] Error configurando handlers:', error);
  }
}

/**
 * Establece el estado de reproducción para el sistema
 */
export function setPlaybackState(state: 'playing' | 'paused' | 'none'): void {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }
  
  try {
    navigator.mediaSession.playbackState = state;
  } catch (error) {
    // Ignorar errores silenciosamente
  }
}

/**
 * Limpia los handlers y resetea el estado
 */
export function cleanupBackgroundAudio(): void {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    } catch (error) {
      // Ignorar errores silenciosamente
    }
  }
  
  isInitialized = false;
}
