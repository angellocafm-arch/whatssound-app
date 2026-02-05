/**
 * WhatsSound — Sound Effects
 * Biblioteca de sonidos para la app
 * 
 * Incluye:
 * - Golden Boost achievement
 * - Reacciones
 * - Notificaciones
 * - UI feedback
 */

import { Platform } from 'react-native';

// En web, re-exportamos desde sounds.web.ts
// Este archivo solo se usa en nativo
if (Platform.OS === 'web') {
  // console.log('[Sounds] Web platform detected, using Web Audio API');
}

// Importación condicional de expo-av (solo nativo)
let Audio: any = { Sound: class { async loadAsync() {} async playAsync() {} async unloadAsync() {} } };
if (Platform.OS !== 'web') {
  try {
    Audio = require('expo-av').Audio;
  } catch (e) {
    console.warn('[Sounds] expo-av not available');
  }
}

// Cache de sonidos cargados
const soundCache: Record<string, Audio.Sound> = {};

// URLs de sonidos (usar CDN o assets locales en producción)
// Por ahora usamos sonidos generados o placeholder
const SOUND_URLS = {
  goldenBoost: null, // Se genera con Web Audio API
  reaction: null,
  notification: null,
  success: null,
  error: null,
};

/**
 * Reproduce el sonido épico de Golden Boost
 * Usa Web Audio API para generar un sonido de achievement
 */
export async function playGoldenBoostSound(): Promise<void> {
  if (Platform.OS === 'web') {
    await playGoldenBoostSoundWeb();
  } else {
    await playGoldenBoostSoundNative();
  }
}

/**
 * Versión Web usando Web Audio API
 * Genera un sonido de achievement épico programáticamente
 */
async function playGoldenBoostSoundWeb(): Promise<void> {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Crear ganancia master
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0.3, now);
    masterGain.gain.linearRampToValueAtTime(0, now + 2);
    
    // Acorde de victoria (Do Mayor con séptima mayor)
    const frequencies = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5
    
    frequencies.forEach((freq, i) => {
      // Oscilador principal
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      // Ganancia individual con envelope
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05 + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.1, now + 0.5 + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(now + i * 0.1);
      osc.stop(now + 2.5);
    });
    
    // Añadir brillo (shimmer)
    for (let i = 0; i < 5; i++) {
      const shimmer = ctx.createOscillator();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(2000 + Math.random() * 2000, now);
      shimmer.frequency.exponentialRampToValueAtTime(4000 + Math.random() * 2000, now + 0.5);
      
      const shimmerGain = ctx.createGain();
      shimmerGain.gain.setValueAtTime(0, now + 0.2 + i * 0.15);
      shimmerGain.gain.linearRampToValueAtTime(0.05, now + 0.3 + i * 0.15);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 1 + i * 0.15);
      
      shimmer.connect(shimmerGain);
      shimmerGain.connect(masterGain);
      
      shimmer.start(now + 0.2 + i * 0.15);
      shimmer.stop(now + 1.5 + i * 0.15);
    }
    
  } catch (error) {
    console.warn('[Sounds] Error reproduciendo Golden Boost:', error);
  }
}

/**
 * Versión nativa usando expo-av
 * Carga y reproduce un archivo de sonido
 */
async function playGoldenBoostSoundNative(): Promise<void> {
  try {
    // NOTE: Sound files are optional en assets/sounds/
    // Por ahora, usar la versión web como fallback si está disponible
    
    // Configurar modo de audio
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    
    // Intentar cargar sonido desde assets
    // const { sound } = await Audio.Sound.createAsync(
    //   require('../../assets/sounds/golden-boost.mp3')
    // );
    // await sound.playAsync();
    // sound.setOnPlaybackStatusUpdate((status) => {
    //   if (status.isLoaded && status.didJustFinish) {
    //     sound.unloadAsync();
    //   }
    // });
    
    // console.log('[Sounds] Golden Boost sound (native) - pendiente de archivo');
  } catch (error) {
    console.warn('[Sounds] Error reproduciendo Golden Boost nativo:', error);
  }
}

/**
 * Reproduce sonido de reacción (like, fuego, etc.)
 */
export async function playReactionSound(type: 'like' | 'fire' | 'clap' | 'wow'): Promise<void> {
  if (Platform.OS !== 'web') return;
  
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Sonido corto de "pop" para reacciones
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    
    // Diferentes tonos según el tipo
    const baseFreq = {
      like: 800,
      fire: 600,
      clap: 400,
      wow: 1000,
    }[type];
    
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (error) {
    // Silenciar errores de sonido
  }
}

/**
 * Reproduce sonido de notificación
 */
export async function playNotificationSound(): Promise<void> {
  if (Platform.OS !== 'web') return;
  
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Dos tonos cortos
    [0, 0.15].forEach((delay) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now + delay);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.1, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  } catch (error) {
    // Silenciar errores
  }
}

/**
 * Pre-carga sonidos para reproducción instantánea
 * Llamar al iniciar la app
 */
export async function preloadSounds(): Promise<void> {
  // NOTE: Preloading is optional de archivos de sonido
  // console.log('[Sounds] Pre-carga de sonidos iniciada');
}

/**
 * Limpia cache de sonidos
 * Llamar al cerrar la app o cambiar de pantalla
 */
export async function unloadSounds(): Promise<void> {
  for (const key in soundCache) {
    try {
      await soundCache[key].unloadAsync();
      delete soundCache[key];
    } catch (error) {
      // Ignorar errores de limpieza
    }
  }
}
