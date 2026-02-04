# Agora - Real-Time Audio SDK

## Visión General

Agora es el líder en SDKs de comunicación en tiempo real. Potencia Clubhouse, y miles de apps con voz/video de ultra-baja latencia.

## Producto: Voice Calling SDK

### Características Principales
- **HD Audio**: 48 kHz sampling, hasta 192 kbps
- **Ultra-low latency**: <400ms global
- **AI Noise Suppression**: Eliminación de ruido inteligente
- **3D Spatial Audio**: Audio inmersivo
- **Flexible Recording**: Cloud o local

### Plataformas Soportadas
```
Mobile:     Android, iOS
Desktop:    Windows, macOS
Web:        Chrome, Firefox, Safari, Edge
Cross:      Flutter, React Native, Unity, Unreal
Embedded:   Electron
```

## Arquitectura

### Software Defined Real-time Network (SD-RTN)
```
┌──────────────────────────────────────────────────────────┐
│                     SD-RTN™                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   User A ──→ Edge Node ──→ Core Network ──→ Edge Node ──→ User B
│              (nearest)      (optimized)      (nearest)   │
│                                                          │
│   Features:                                              │
│   - 200+ data centers globally                           │
│   - Dynamic routing                                      │
│   - Auto failover                                        │
│   - <300ms latency globally                              │
└──────────────────────────────────────────────────────────┘
```

### Codec: Agora NOVA
- Propietario, optimizado para voz
- Mejor calidad que Opus en baja velocidad
- Resiliente a packet loss (hasta 80%)
- CPU efficiency optimizado

## API Básica

### Inicialización
```typescript
import AgoraRTC from 'agora-rtc-sdk-ng';

// Crear cliente
const client = AgoraRTC.createClient({
  mode: 'rtc',  // 'rtc' para calls, 'live' para broadcast
  codec: 'vp8'  // or 'h264' for video
});

// Unirse a canal
await client.join(APP_ID, channelName, token, uid);
```

### Audio Track
```typescript
// Crear track de micrófono
const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
  encoderConfig: 'high_quality_stereo',
  // Options: 'speech_low_quality', 'speech_standard', 
  //          'music_standard', 'high_quality_stereo'
});

// Publicar
await client.publish([localAudioTrack]);

// Suscribirse a usuarios remotos
client.on('user-published', async (user, mediaType) => {
  await client.subscribe(user, mediaType);
  
  if (mediaType === 'audio') {
    const remoteAudioTrack = user.audioTrack;
    remoteAudioTrack.play();
  }
});
```

### Eventos Importantes
```typescript
// Conexión
client.on('connection-state-change', (curState, prevState, reason) => {
  console.log(`Connection: ${prevState} -> ${curState}, reason: ${reason}`);
});

// Usuario se une
client.on('user-joined', (user) => {
  console.log('User joined:', user.uid);
});

// Usuario sale
client.on('user-left', (user, reason) => {
  console.log('User left:', user.uid, reason);
});

// Cambio de volumen
client.enableAudioVolumeIndicator();
client.on('volume-indicator', (volumes) => {
  volumes.forEach(({ uid, level }) => {
    console.log(`User ${uid} volume: ${level}`);
  });
});
```

## Extensiones

### AI Noise Suppression
```typescript
import { AIDenoiserExtension } from 'agora-extension-ai-denoiser';

// Registrar extensión
AgoraRTC.registerExtensions([AIDenoiserExtension]);

// Crear procesador
const denoiser = extension.createProcessor();
await denoiser.enable();

// Aplicar al track
localAudioTrack.pipe(denoiser).pipe(localAudioTrack.processorDestination);
```

### 3D Spatial Audio
```typescript
// Habilitar spatial audio
client.enableSpatialAudio(true);

// Posicionar usuario
const spatialAudioExtension = new SpatialAudioExtension();
spatialAudioExtension.updateSelfPosition({
  position: [0, 0, 0],
  axisForward: [1, 0, 0],
  axisRight: [0, 1, 0],
  axisUp: [0, 0, 1]
});

// Posicionar audio remoto
spatialAudioExtension.updateRemotePosition(remoteUid, {
  position: [5, 0, 0]  // 5 unidades a la derecha
});
```

### Voice Effects
```typescript
// Cambiar voz
localAudioTrack.setVoiceChangerPreset('VOICE_CHANGER_EFFECT_UNCLE');

// Presets disponibles:
// VOICE_CHANGER_EFFECT_UNCLE, VOICE_CHANGER_EFFECT_OLDMAN,
// VOICE_CHANGER_EFFECT_BOY, VOICE_CHANGER_EFFECT_SISTER,
// VOICE_CHANGER_EFFECT_GIRL, VOICE_CHANGER_EFFECT_PIGKING,
// VOICE_CHANGER_EFFECT_HULK
```

## Cloud Recording

### Iniciar Grabación
```typescript
// Via REST API
POST /v1/apps/{appid}/cloud_recording/resourceid/{resourceid}/mode/{mode}/start

{
  "cname": "channel_name",
  "uid": "recording_uid",
  "clientRequest": {
    "recordingConfig": {
      "channelType": 0,
      "streamTypes": 0,  // 0: audio only
      "audioProfile": 1  // High quality
    },
    "storageConfig": {
      "vendor": 1,  // AWS S3
      "region": 0,
      "bucket": "my-bucket",
      "accessKey": "...",
      "secretKey": "..."
    }
  }
}
```

## Propuestas para WhatsSound

### Implementar (Crítico) - Si usamos Agora
1. **Agora Integration Service**:
   ```typescript
   import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
   
   class AgoraAudioService {
     private client: IAgoraRTCClient;
     private localTrack: IMicrophoneAudioTrack | null = null;
     private isJoined = false;
     
     constructor() {
       this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
       this.setupEventListeners();
     }
     
     private setupEventListeners(): void {
       this.client.on('user-published', this.handleUserPublished.bind(this));
       this.client.on('user-unpublished', this.handleUserUnpublished.bind(this));
       this.client.on('user-joined', this.handleUserJoined.bind(this));
       this.client.on('user-left', this.handleUserLeft.bind(this));
     }
     
     async joinRoom(roomId: string, userId: string, token: string): Promise<void> {
       await this.client.join(AGORA_APP_ID, roomId, token, userId);
       this.isJoined = true;
     }
     
     async publishAudio(): Promise<void> {
       this.localTrack = await AgoraRTC.createMicrophoneAudioTrack({
         encoderConfig: 'high_quality',
       });
       await this.client.publish([this.localTrack]);
     }
     
     async muteLocal(muted: boolean): Promise<void> {
       await this.localTrack?.setEnabled(!muted);
     }
     
     async leaveRoom(): Promise<void> {
       this.localTrack?.stop();
       this.localTrack?.close();
       await this.client.leave();
       this.isJoined = false;
     }
     
     private async handleUserPublished(user: any, mediaType: string): Promise<void> {
       await this.client.subscribe(user, mediaType);
       if (mediaType === 'audio') {
         user.audioTrack?.play();
       }
       this.emit('user-audio-started', user.uid);
     }
   }
   ```

2. **Token Server**:
   ```typescript
   // Backend: Generate Agora tokens
   import { RtcTokenBuilder, RtcRole } from 'agora-token';
   
   function generateToken(channelName: string, uid: string, role: 'publisher' | 'subscriber'): string {
     const appId = process.env.AGORA_APP_ID;
     const appCertificate = process.env.AGORA_APP_CERTIFICATE;
     const expirationTimeInSeconds = 3600;
     const currentTimestamp = Math.floor(Date.now() / 1000);
     const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
     
     const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
     
     return RtcTokenBuilder.buildTokenWithUid(
       appId,
       appCertificate,
       channelName,
       uid,
       agoraRole,
       privilegeExpiredTs
     );
   }
   ```

### Implementar (Alta Prioridad)
3. **Volume Indicator**:
   ```typescript
   class VolumeMonitor {
     private client: IAgoraRTCClient;
     private callbacks: Map<string, (level: number) => void> = new Map();
     
     start(): void {
       this.client.enableAudioVolumeIndicator();
       this.client.on('volume-indicator', (volumes) => {
         volumes.forEach(({ uid, level }) => {
           const callback = this.callbacks.get(String(uid));
           callback?.(level);
         });
       });
     }
     
     onVolumeChange(uid: string, callback: (level: number) => void): void {
       this.callbacks.set(uid, callback);
     }
   }
   ```

4. **Connection Quality Monitor**:
   ```typescript
   interface QualityStats {
     uplinkNetworkQuality: number;  // 0-5 (5=excellent)
     downlinkNetworkQuality: number;
     rtt: number;  // Round trip time ms
   }
   
   client.on('network-quality', (stats: QualityStats) => {
     if (stats.uplinkNetworkQuality > 3) {
       // Reducir calidad de envío
       localTrack.setEncoderConfiguration('speech_standard');
     }
   });
   ```

### Alternativa: WebRTC Puro
Si preferimos no depender de Agora:
```typescript
// Usar MediaSoup, Janus, o Jitsi como SFU
// Implementar signaling propio
// Más control, más trabajo de infraestructura
```

## Pricing Agora

### Voice Calling
| Uso | Precio |
|-----|--------|
| Primeros 10,000 min/mes | Gratis |
| Audio HD | $0.99/1000 min |
| Recording | $1.49/1000 min |

### Consideraciones
- Free tier generoso para empezar
- Escala con uso
- Enterprise plans disponibles
- Extensions pueden tener costo adicional

## Métricas y Analytics

### Agora Analytics Dashboard
- QoE (Quality of Experience) metrics
- Network quality por región
- User engagement
- Error rates
- Latency distribution

## Referencias

- https://docs.agora.io/en/voice-calling/overview/product-overview
- https://www.agora.io/en/products/voice-call/
- Agora SDK API Reference
- Agora Extensions Marketplace

---
*Última actualización: 2026-02-04*
*Experto investigado para WhatsSound*
