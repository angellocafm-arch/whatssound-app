# 🎵 Background Audio — WhatsSound

**Prioridad:** CRÍTICA
**Estado:** Preparado para implementar

---

## 📋 Requisito

La música debe seguir sonando cuando:
- ✅ Se bloquea la pantalla
- ✅ El teléfono va en el bolsillo
- ✅ Se cambia a otra app
- ✅ El usuario puede sacar, interactuar, y volver a guardar

---

## 🔧 Implementación por Plataforma

### iOS (Nativo)

**Configuración en `app.json`:**
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "audio"
        ]
      }
    }
  }
}
```

**Código:**
```typescript
import { setAudioModeAsync } from 'expo-audio';

// Al iniciar la app
await setAudioModeAsync({
  playsInSilentMode: true,        // Suena aunque esté en silencio
  staysActiveInBackground: true,  // Sigue en background
  allowsRecording: false,
});
```

### Android (Nativo)

**Configuración en `app.json`:**
```json
{
  "expo": {
    "android": {
      "permissions": [
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_MEDIA_PLAYBACK"
      ]
    },
    "plugins": [
      [
        "expo-audio",
        {
          "backgroundModes": ["audio"]
        }
      ]
    ]
  }
}
```

**Requiere Foreground Service con notificación persistente:**
- Notificación que muestra canción actual
- Controles play/pause/skip
- No se puede cerrar mientras reproduce

### Web (Limitado)

**NO soporta background audio real.**

Workarounds parciales:
- Picture-in-Picture API (solo video)
- Service Worker para keep-alive (limitado)
- Media Session API para controles de lock screen

```typescript
// Media Session API - controles en lock screen
if ('mediaSession' in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: 'Dakiti',
    artist: 'Bad Bunny',
    album: 'El Último Tour Del Mundo',
    artwork: [{ src: coverUrl }]
  });
  
  navigator.mediaSession.setActionHandler('play', () => player.play());
  navigator.mediaSession.setActionHandler('pause', () => player.pause());
  navigator.mediaSession.setActionHandler('nexttrack', () => nextSong());
}
```

---

## 📁 Archivos a Crear/Modificar

### 1. `app.json` — Configuración

```json
{
  "expo": {
    "plugins": [
      [
        "expo-audio",
        {
          "microphonePermission": "Permitir a WhatsSound acceder al micrófono para mensajes de voz."
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio"],
        "NSMicrophoneUsageDescription": "WhatsSound usa el micrófono para mensajes de voz."
      }
    },
    "android": {
      "permissions": [
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_MEDIA_PLAYBACK",
        "WAKE_LOCK"
      ]
    }
  }
}
```

### 2. `src/lib/audio-background.ts` — Servicio

```typescript
/**
 * WhatsSound — Background Audio Service
 * Maneja reproducción en segundo plano
 */

import { Platform } from 'react-native';
import { setAudioModeAsync, AudioPlayer } from 'expo-audio';

export async function initBackgroundAudio() {
  // Configurar modo de audio para background
  await setAudioModeAsync({
    playsInSilentMode: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  
  // Configurar Media Session para controles en lock screen
  if (Platform.OS === 'web' && 'mediaSession' in navigator) {
    setupMediaSession();
  }
}

export function updateNowPlaying(song: {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
}) {
  if (Platform.OS === 'web' && 'mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      artwork: song.artwork ? [{ src: song.artwork }] : [],
    });
  }
  
  // En nativo, la notificación se actualiza automáticamente
  // con expo-audio cuando usas setAudioModeAsync
}

function setupMediaSession() {
  // Los handlers se configuran desde el componente de player
}

export function setMediaSessionHandlers(handlers: {
  play: () => void;
  pause: () => void;
  nextTrack?: () => void;
  previousTrack?: () => void;
  seekTo?: (time: number) => void;
}) {
  if (Platform.OS !== 'web' || !('mediaSession' in navigator)) return;
  
  navigator.mediaSession.setActionHandler('play', handlers.play);
  navigator.mediaSession.setActionHandler('pause', handlers.pause);
  
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
}
```

### 3. `src/hooks/useBackgroundAudio.ts` — Hook

```typescript
/**
 * WhatsSound — useBackgroundAudio Hook
 * Integra background audio con el player de sesión
 */

import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { initBackgroundAudio, updateNowPlaying, setMediaSessionHandlers } from '../lib/audio-background';

interface UseBackgroundAudioOptions {
  onPlay: () => void;
  onPause: () => void;
  onNextTrack?: () => void;
  currentSong?: {
    title: string;
    artist: string;
    album?: string;
    artwork?: string;
  };
}

export function useBackgroundAudio(options: UseBackgroundAudioOptions) {
  const { onPlay, onPause, onNextTrack, currentSong } = options;
  
  // Inicializar background audio al montar
  useEffect(() => {
    initBackgroundAudio();
    
    // Configurar handlers de Media Session
    setMediaSessionHandlers({
      play: onPlay,
      pause: onPause,
      nextTrack: onNextTrack,
    });
  }, []);
  
  // Actualizar metadata cuando cambia la canción
  useEffect(() => {
    if (currentSong) {
      updateNowPlaying(currentSong);
    }
  }, [currentSong?.title, currentSong?.artist]);
  
  // Manejar cambios de estado de la app
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // El audio sigue reproduciéndose automáticamente
      // Este handler es para logging/analytics
      console.log('[BackgroundAudio] App state:', nextAppState);
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);
}
```

---

## 🔄 Integración en Session Player

```typescript
// En app/session/[id].tsx

import { useBackgroundAudio } from '../../src/hooks/useBackgroundAudio';

function SessionScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  
  // Integrar background audio
  useBackgroundAudio({
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onNextTrack: () => skipToNext(),
    currentSong: currentSong ? {
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album,
      artwork: currentSong.art,
    } : undefined,
  });
  
  // ... resto del componente
}
```

---

## ⚠️ Limitaciones Actuales (Web)

| Feature | iOS Nativo | Android Nativo | Web |
|---------|------------|----------------|-----|
| Audio en background | ✅ | ✅ | ❌ (se pausa) |
| Lock screen controls | ✅ | ✅ | ✅ (Media Session) |
| Notificación persistente | ✅ | ✅ | ❌ |
| Control desde auriculares | ✅ | ✅ | ✅ |

**Para demo web:** El audio se pausará al cambiar de pestaña. Esto es limitación del navegador, no de la app.

**Para producción:** Requiere build nativo con EAS.

---

## 📱 Notificación Android (Ejemplo Visual)

```
┌─────────────────────────────────┐
│ 🎵 WhatsSound                   │
│ Dakiti - Bad Bunny              │
│ DJ Carlos Madrid                │
│                                 │
│    ⏮️   ▶️/⏸️   ⏭️             │
└─────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

- [ ] Actualizar `app.json` con UIBackgroundModes
- [ ] Crear `src/lib/audio-background.ts`
- [ ] Crear `src/hooks/useBackgroundAudio.ts`
- [ ] Integrar en `app/session/[id].tsx`
- [ ] Probar en Expo Go (limitado)
- [ ] Build EAS para test real
- [ ] Probar iOS: bloqueo pantalla, cambio app
- [ ] Probar Android: notificación, controles

---

## 🚀 Próximos Pasos

1. **Ahora:** Añadir configuración a `app.json`
2. **Ahora:** Crear archivos de servicio y hook
3. **Cuando EAS:** Build de desarrollo para test real
4. **Producción:** Validar en dispositivos reales

---

*Documento creado: 2026-02-04*
*Requiere: expo-audio, EAS Build para funcionalidad completa*
