# 🎵 RESUMEN: Expertos en Audio Streaming para WhatsSound

> Investigación de 10 referentes en audio streaming y sus aplicaciones para WhatsSound.

## 📋 Expertos Analizados

| # | Experto | Especialidad | Aplicación WhatsSound |
|---|---------|--------------|----------------------|
| 1 | Spotify Engineering | Delivery at scale | Streaming, adaptive bitrate |
| 2 | SoundCloud | User-generated audio | Upload, waveforms, social |
| 3 | Clubhouse/Twitter Spaces | Live audio rooms | Rooms, roles, hand raise |
| 4 | Discord Stage Channels | Massive voice | SFU, failover, latencia |
| 5 | Deezer API | Music metadata | Search, audio features |
| 6 | Web Audio API | Browser audio | Playback, effects, visualization |
| 7 | Expo AV | React Native audio | Mobile playback/recording |
| 8 | Dolby | Audio quality | Loudness, spatial, enhancement |
| 9 | Agora | Real-time SDK | Voice calls, live rooms |
| 10 | Twilio | Voice/PSTN | Quality metrics, transcription |

---

## 🎯 Top 10 Recomendaciones para WhatsSound

### 1. 🔊 Loudness Normalization (-14 LUFS)
**De**: Spotify, Dolby

Todos los audios deben normalizarse para consistencia de volumen.

```typescript
// Target: -14 LUFS (streaming standard), -1 dBTP true peak
await normalizeAudio(track, { targetLUFS: -14, truePeakLimit: -1 });
```

**Beneficio**: UX consistente, no saltar a ajustar volumen entre tracks.

---

### 2. 📊 Waveform Visualization
**De**: SoundCloud

Generar waveform en upload para visualización instantánea.

```typescript
// Backend: audiowaveform -i audio.mp3 -o waveform.json
// Frontend: Canvas render de datos de amplitud
```

**Beneficio**: Seek visual, engagement, identidad de SoundCloud que usuarios reconocen.

---

### 3. 👥 Sistema de Roles para Audio Rooms
**De**: Clubhouse, Discord

Jerarquía clara: Host > Moderators > Speakers > Listeners

```typescript
enum RoomRole {
  HOST = 'host',           // Control total
  MODERATOR = 'moderator', // Gestionar speakers
  SPEAKER = 'speaker',     // Puede hablar
  LISTENER = 'listener'    // Solo escucha
}
```

**Beneficio**: Salas ordenadas, moderación efectiva, escalabilidad.

---

### 4. ✋ Hand Raise + Stage Management
**De**: Clubhouse, Twitter Spaces

Permitir que listeners soliciten hablar.

```typescript
// Listener levanta mano → Mod aprueba → Promueve a speaker
await raiseHand(userId);
await promoteToSpeaker(userId, moderatorId);
```

**Beneficio**: Engagement, participación democrática, control de mods.

---

### 5. 🔇 Silence Suppression (VAD)
**De**: Discord

No transmitir paquetes durante silencio = ahorro masivo de bandwidth.

```typescript
if (voiceActivityDetector.isActive(audioFrame)) {
  sendAudioPacket(audioFrame);
} else {
  // Skip - no enviar silencio
}
```

**Beneficio**: 60-80% menos bandwidth en rooms grandes, mejor rendimiento.

---

### 6. 🌐 Adaptive Bitrate Streaming
**De**: Spotify, SoundCloud

Ajustar calidad según condiciones de red.

```typescript
// Detectar calidad de red
if (networkQuality === 'poor') {
  switchToStream('64kbps');
} else if (networkQuality === 'good') {
  switchToStream('128kbps');
}
```

**Beneficio**: Reproducción sin interrupciones en cualquier conexión.

---

### 7. 🎙️ Audio Processing Pipeline
**De**: Dolby, Agora

Procesar audio antes de enviar/guardar.

```
Input → Noise Reduction → EQ → Compression → Normalization → Output
```

**Beneficio**: Calidad profesional sin esfuerzo del usuario.

---

### 8. 🔄 Failover Automático
**De**: Discord

Reconexión transparente si servidor falla.

```typescript
// Detectar desconexión
onDisconnect(() => {
  // Obtener nuevo servidor
  const newServer = await requestNewVoiceServer(roomId);
  // Reconectar automáticamente
  await reconnect(newServer);
});
```

**Beneficio**: Experiencia sin interrupciones, resiliencia.

---

### 9. 📈 Quality Metrics (MOS)
**De**: Twilio, Discord

Monitorear calidad de audio en tiempo real.

```typescript
interface QualityMetrics {
  mos: number;        // 1-5 (Mean Opinion Score)
  latency: number;    // ms
  jitter: number;     // ms
  packetLoss: number; // %
}
```

**Beneficio**: Detectar problemas, optimizar experiencia, analytics.

---

### 10. 🎵 Metadata Enriquecida
**De**: Deezer

Información rica sobre cada audio.

```typescript
interface TrackMetadata {
  title: string;
  duration: number;
  bpm?: number;
  key?: string;
  energy?: number;
  waveform: number[];
  coverArt: ImageSet;
  // ... social stats
}
```

**Beneficio**: Descubrimiento, búsqueda avanzada, personalización.

---

## 🏗️ Arquitectura Recomendada

### Para Audio Rooms (Live)
```
┌─────────────────────────────────────────────────────────┐
│                    AUDIO ROOMS                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Opción A: Agora SDK                                   │
│   ├── Ventajas: Listo para usar, global, probado       │
│   ├── Desventajas: Costo a escala, vendor lock-in      │
│   └── Best for: MVP rápido, validación                 │
│                                                         │
│   Opción B: WebRTC + MediaSoup/Janus                    │
│   ├── Ventajas: Control total, open source             │
│   ├── Desventajas: Más trabajo, infraestructura        │
│   └── Best for: Escala, personalización                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Para Audio Playback (On-Demand)
```
┌─────────────────────────────────────────────────────────┐
│                   AUDIO PLAYBACK                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Mobile (React Native):                                │
│   └── expo-audio (nuevo) o react-native-track-player   │
│                                                         │
│   Web:                                                  │
│   └── Web Audio API + Howler.js (fallback)             │
│                                                         │
│   Streaming:                                            │
│   └── HLS adaptive bitrate con múltiples calidades     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Para Audio Upload/Processing
```
┌─────────────────────────────────────────────────────────┐
│                   UPLOAD PIPELINE                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   1. Upload chunked (resumable)                         │
│   2. Validate (formato, duración, copyright?)           │
│   3. Process:                                           │
│      ├── Transcode a múltiples bitrates                │
│      ├── Generar waveform                              │
│      ├── Normalizar loudness                           │
│      ├── Extraer metadata (BPM, key, etc.)             │
│      └── Generar preview (30s)                         │
│   4. Store (S3/R2) + CDN                               │
│   5. Index (Elasticsearch/Meilisearch)                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Comparativa de Codecs

| Codec | Uso | Bitrate | Latencia | Notas |
|-------|-----|---------|----------|-------|
| **Opus** | Voz/música | 6-510 kbps | Muy baja | ⭐ Recomendado para todo |
| AAC | Streaming | 64-320 kbps | Baja | Buena compatibilidad |
| MP3 | Legacy | 128-320 kbps | Baja | Universal pero antiguo |
| FLAC | Lossless | ~1000 kbps | Media | Para audiophiles |

**Recomendación**: Usar **Opus** como codec principal.
- Voz: 32-64 kbps (excelente calidad)
- Música: 96-128 kbps (transparente)
- Live rooms: 48 kbps (óptimo)

---

## ⚡ Quick Wins (Implementar Primero)

1. **Waveform generation** - Impacto visual inmediato
2. **Loudness normalization** - Calidad percibida
3. **Silence suppression** - Ahorro de recursos
4. **Hand raise** - Engagement en rooms
5. **Volume indicator** - Feedback visual de quién habla

---

## 🔧 Stack Tecnológico Propuesto

### Frontend (React Native)
```json
{
  "expo-audio": "Playback y recording",
  "expo-av": "Legacy support",
  "react-native-track-player": "Background playback",
  "agora-rtc-react-native": "Live rooms (si usamos Agora)"
}
```

### Backend
```json
{
  "ffmpeg": "Transcoding y análisis",
  "audiowaveform": "Generación de waveforms",
  "whisper": "Transcripción (opcional)",
  "mediasoup": "SFU para WebRTC (si no Agora)"
}
```

### Infraestructura
```json
{
  "storage": "Cloudflare R2 / AWS S3",
  "cdn": "Cloudflare / CloudFront",
  "streaming": "HLS con adaptive bitrate",
  "realtime": "Agora / MediaSoup"
}
```

---

## 💰 Consideraciones de Costo

### Agora Pricing
- 10,000 min gratis/mes
- ~$1/1000 min después
- Recording extra

### Self-hosted (MediaSoup)
- Servers: ~$100-500/mes para empezar
- Bandwidth: Principal costo
- Mantenimiento: Tiempo de dev

### Recomendación
1. **MVP**: Agora (rápido, free tier)
2. **Escala**: Evaluar híbrido o migración a self-hosted

---

## 📚 Archivos de Referencia

```
docs/expertos/audio-streaming/
├── 01-spotify-engineering.md     # Delivery at scale
├── 02-soundcloud-architecture.md # User-generated
├── 03-clubhouse-twitter-spaces.md# Live rooms
├── 04-discord-stage-channels.md  # Massive voice
├── 05-deezer-api.md              # Metadata
├── 06-web-audio-api.md           # Browser
├── 07-expo-av.md                 # React Native
├── 08-dolby.md                   # Quality
├── 09-agora.md                   # Real-time SDK
├── 10-twilio.md                  # Voice/PSTN
└── RESUMEN-AUDIO.md              # Este archivo
```

---

## ✅ Checklist de Implementación

### Fase 1: Fundamentos
- [ ] Setup expo-audio para playback básico
- [ ] Implementar upload con progress
- [ ] Generar waveforms en backend
- [ ] Normalización de loudness
- [ ] CDN para delivery

### Fase 2: Audio Rooms
- [ ] Integrar Agora SDK (o WebRTC)
- [ ] Sistema de roles
- [ ] Hand raise mechanism
- [ ] Mute/unmute controls
- [ ] Volume indicators

### Fase 3: Polish
- [ ] Adaptive bitrate
- [ ] Silence suppression
- [ ] Quality metrics
- [ ] Failover automático
- [ ] Background playback

### Fase 4: Avanzado
- [ ] Spatial audio (opcional)
- [ ] Transcripciones
- [ ] Audio effects
- [ ] Recording de rooms

---

*Generado: 2026-02-04*
*Para: WhatsSound App*
*Investigador: Subagent Audio Streaming*
