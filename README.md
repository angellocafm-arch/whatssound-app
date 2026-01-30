# WhatsSound - Audio Collaboration Mobile App

> React Native app para colaboración musical y gestión de audio en tiempo real

## 📱 Descripción

WhatsSound es la aplicación móvil nativa que complementa la plataforma OpenParty, ofreciendo una experiencia optimizada para dispositivos móviles con funcionalidades avanzadas de audio.

## ⚡ Características

- 🎵 **Audio Streaming**: Reproducción nativa de alta calidad
- 🎤 **Voice Messages**: Mensajes de voz en chat
- 📹 **Live Streaming**: Transmisión audio en vivo
- 🔊 **Background Play**: Reproducción en segundo plano
- 📲 **Push Notifications**: Alertas de nuevas canciones/mensajes
- 🎛️ **Audio Effects**: Filtros y efectos en tiempo real

## 🛠️ Stack Tecnológico

- **Framework**: React Native + Expo
- **Audio**: Expo AV + react-native-sound
- **Streaming**: WebRTC para audio en tiempo real
- **Backend**: Supabase + RESTful API
- **State**: Redux Toolkit + React Query
- **UI**: Native Base + React Native Elements

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Configurar environment
cp .env.example .env
# Editar variables de entorno

# Desarrollo iOS
npx expo run:ios

# Desarrollo Android  
npx expo run:android

# Web (testing)
npx expo start --web
```

## 📁 Estructura

```
src/
├── components/          # UI Components
│   ├── audio/          # Audio-specific components
│   ├── chat/           # Chat components
│   └── ui/             # Shared UI components
├── screens/            # Screen components
│   ├── session/        # Session-related screens
│   ├── profile/        # User profile
│   └── settings/       # App settings
├── services/           # API services
│   ├── api/            # REST API calls
│   ├── audio/          # Audio management
│   └── streaming/      # Real-time streaming
├── hooks/              # Custom hooks
├── utils/              # Utilities
└── types/              # TypeScript types
```

## 🔊 Audio Features

### Reproducción Local
```typescript
import { Audio } from 'expo-av';

const playAudio = async (uri: string) => {
  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true }
  );
};
```

### Streaming en Tiempo Real
```typescript
import { RTCPeerConnection } from 'react-native-webrtc';

const startAudioStream = async () => {
  const pc = new RTCPeerConnection(iceServers);
  const stream = await mediaDevices.getUserMedia({ audio: true });
  pc.addStream(stream);
};
```

## 📱 Plataformas

### iOS Features
- **Background Audio**: Continúa reproduciendo en background
- **Control Center**: Controles nativos en iOS Control Center
- **Siri Integration**: "Hey Siri, play next song in WhatsSound"
- **AirPlay**: Transmisión a dispositivos compatibles

### Android Features
- **Foreground Service**: Audio continuo en background
- **Media Session**: Controles en notification panel
- **Android Auto**: Integración para automóviles
- **Bluetooth**: Controles desde dispositivos Bluetooth

## 🔄 Sincronización

### Sincronización con OpenParty Web
- **Real-time sync**: Estado compartido vía WebSocket
- **Offline queue**: Cola local cuando no hay conexión
- **Auto-sync**: Sincronización automática al reconectar

### Estado Compartido
```typescript
interface SharedState {
  currentSong: Song | null;
  queue: Song[];
  reactions: Record<string, number>;
  participants: User[];
}
```

## 🎛️ Audio Engine

### Audio Pipeline
```
Microphone → Processing → Effects → Encoding → Streaming
            ↓
Local Storage ← Buffering ← Decoding ← Network
```

### Efectos Disponibles
- **Echo/Reverb**: Efectos espaciales
- **EQ**: Ecualizador de 10 bandas
- **Pitch**: Modificación de tono
- **Speed**: Cambio de velocidad
- **Noise Gate**: Supresión de ruido

## 📦 Build & Deploy

### Development Build
```bash
# Debug build
npx expo build:android --type apk
npx expo build:ios --type simulator

# Release build
npx expo build:android --type app-bundle
npx expo build:ios --type archive
```

### App Store Deployment
```bash
# iOS App Store
npx expo upload:ios

# Google Play Store  
npx expo upload:android
```

## 🔧 Configuración

### Environment Variables
```bash
EXPO_PUBLIC_API_URL=https://api.whatssound.app
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_STREAM_KEY=your_streaming_key
```

### Audio Settings
```javascript
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-av",
        {
          "microphonePermission": "Allow WhatsSound to access your microphone for voice messages",
          "recordAudioAndroid": "Allow WhatsSound to record audio"
        }
      ]
    ]
  }
}
```

## 📲 Features Roadmap

### v1.0 - Core Features
- [x] Basic audio playback
- [x] Chat integration
- [x] Queue management
- [x] Real-time sync

### v1.1 - Enhanced Audio
- [ ] Background playback
- [ ] Audio effects
- [ ] Voice messages
- [ ] Audio recording

### v1.2 - Social Features  
- [ ] User profiles
- [ ] Friend system
- [ ] Playlist sharing
- [ ] Social discovery

### v2.0 - Pro Features
- [ ] Live streaming
- [ ] DJ mode
- [ ] Audio collaboration
- [ ] Monetization features

## 🎯 Performance

### Optimizaciones
- **Lazy loading**: Componentes cargados bajo demanda
- **Audio caching**: Cache inteligente de audio files
- **Memory management**: Gestión optimizada de memoria para audio
- **Network optimization**: Compresión y streaming adaptativos

### Métricas
- **Startup time**: <3 segundos cold start
- **Audio latency**: <100ms para audio local
- **Battery usage**: <5% por hora de uso activo
- **Data usage**: <1MB por hora de streaming

---
*WhatsSound Mobile - Powered by Expo & React Native*