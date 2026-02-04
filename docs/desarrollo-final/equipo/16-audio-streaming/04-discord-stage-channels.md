# Discord Stage Channels - Live Audio Social

## Visión General

Discord maneja 2.6+ millones de usuarios de voz concurrentes. Sus Stage Channels son la evolución de voice chat para eventos masivos.

## Tecnología de Audio

### Arquitectura WebRTC
```
┌────────────────────────────────────────────────────────┐
│                    DISCORD VOICE                        │
├────────────────────────────────────────────────────────┤
│  Client (WebRTC)                                       │
│       ↓                                                │
│  Discord Gateway (WebSocket) ←→ Discord Guilds        │
│       ↓                                                │
│  Discord Voice Server                                  │
│       ├── Signaling (Elixir)                          │
│       └── SFU (C++) - Selective Forwarding Unit       │
│                                                        │
│  850+ servers en 13 regiones, 30+ data centers        │
└────────────────────────────────────────────────────────┘
```

### Diferencias: Desktop vs Browser

| Característica | Desktop App | Browser |
|---------------|-------------|---------|
| Ducking override | ✓ | ✗ |
| Custom volume control | ✓ | ✗ |
| System-wide PTT | ✓ | ✗ |
| Raw audio access | ✓ | ✗ |
| Bandwidth optimization | ✓ | Limitado |

### Protocolos
- **Desktop**: WebRTC nativo modificado + Salsa20 encryption
- **Browser**: Standard WebRTC (SDP/ICE/DTLS/SRTP)
- **Signaling**: Custom (no SDP estándar, ~1KB vs 10KB)
- **Media**: UDP con RTP

## Latencia y Calidad

### Métricas
| Métrica | Valor |
|---------|-------|
| Latencia típica | 50-100ms |
| Throughput total | 220+ Gbps |
| Packet rate | 120+ Mpps |
| Usuarios concurrentes | 2.6+ millones |
| Max en un canal | 1000+ speakers |

### Optimizaciones Clave
1. **No ICE negotiation**: Conexión directa a servidor
2. **Salsa20 vs DTLS/SRTP**: Encriptación más rápida
3. **Silence suppression**: No enviar durante silencio
4. **Rewrite sequence numbers**: Manejar gaps de silencio

### Codec y Audio
- **Codec**: Opus
- **Sample rate**: 48kHz
- **Bitrate**: Variable (8-128 kbps)
- **Channels**: Mono para voz, stereo para música

## Arquitectura de Failover

### Detección de Fallas
```
1. SFU crash → Signaling detecta → Restart inmediato
2. Voice server down → Ping fail → Remoción de service discovery
3. DDoS attack → IP packet spike → Migración automática
```

### Proceso de Failover
1. Servidor falla/atacado → removido de etcd
2. Discord Guilds asigna nuevo servidor
3. Voice states pushed al nuevo servidor
4. Clientes notificados → reconexión automática
5. Usuarios experimentan ~segundos de interrupción

### Cero Downtime Updates
- SFU puede actualizarse sin reconexión de clientes
- Estado reconstruido por signaling component
- Hot-swap de componentes

## Stage Channels vs Voice Channels

### Diferencias
| Aspecto | Voice Channel | Stage Channel |
|---------|---------------|---------------|
| Propósito | Chat grupal | Eventos/presentaciones |
| Speakers default | Todos | Solo moderadores |
| Audiencia | Participantes activos | Listeners pasivos |
| Hand raise | No | Sí |
| Max users | ~99 | Miles |

### Stage Roles
- **Stage Moderators**: Pueden hablar, mover usuarios
- **Speakers**: Invitados a hablar
- **Audience**: Solo escuchan, pueden levantar mano

## Características Técnicas Destacadas

### Priority Speaker
- Metadata extra en paquetes de audio
- Volume ducking automático de otros
- Indicador visual

### Noise Suppression
- Krisp integration (AI-powered)
- Opcional por usuario
- Procesamiento local

### Soundboard
- Clips de audio cortos
- Triggered por usuarios
- Mixed server-side

## Propuestas para WhatsSound

### Implementar (Crítico)
1. **SFU Architecture**:
   ```
   - Janus/Jitsi/MediaSoup como base
   - Routing selectivo por rol
   - Scalable horizontalmente
   ```

2. **Silence Suppression**:
   ```typescript
   class AudioSender {
     private vad: VoiceActivityDetector;
     private lastPacketSent: number = 0;
     
     processFrame(audioData: Float32Array): void {
       const isSpeaking = this.vad.detect(audioData);
       
       if (isSpeaking) {
         this.sendAudioPacket(audioData);
         this.lastPacketSent = Date.now();
       } else if (Date.now() - this.lastPacketSent < 300) {
         // Send a few silence frames for smooth transition
         this.sendSilencePacket();
       }
       // Skip sending during extended silence
     }
   }
   ```

3. **Regional Servers**:
   - Múltiples regiones para baja latencia
   - Auto-selección basada en ping
   - Failover automático

### Implementar (Alta Prioridad)
4. **Failover System**:
   - Health checks continuos
   - Service discovery (etcd/consul)
   - Automatic reassignment
   - Client-side reconnection logic

5. **DDoS Protection**:
   - IP packet rate monitoring
   - Automatic server migration
   - Anycast para absorción

### Implementar (Media Prioridad)
6. **Desktop-Specific Features**:
   - Push-to-talk global
   - Audio ducking
   - Per-user volume control
   - Input device hot-swap

### Código de Ejemplo (Failover)
```typescript
class VoiceConnectionManager {
  private currentServer: VoiceServer | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  async connect(channelId: string): Promise<void> {
    const serverInfo = await this.gateway.requestVoiceServer(channelId);
    await this.connectToServer(serverInfo);
  }
  
  private async handleDisconnect(reason: string): Promise<void> {
    console.log(`Disconnected: ${reason}`);
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('connection_failed');
      return;
    }
    
    this.reconnectAttempts++;
    
    // Request new server assignment
    const newServer = await this.gateway.requestVoiceServer(this.channelId);
    
    // Exponential backoff
    await this.delay(Math.pow(2, this.reconnectAttempts) * 100);
    
    await this.connectToServer(newServer);
  }
  
  private async connectToServer(server: VoiceServerInfo): Promise<void> {
    // Close existing connection
    this.currentServer?.close();
    
    // Connect to new server
    this.currentServer = new VoiceServer(server);
    await this.currentServer.connect();
    
    // Setup audio streams
    await this.setupAudioPipeline();
    
    this.reconnectAttempts = 0;
    this.emit('connected', server.region);
  }
}
```

## Métricas Relevantes

### Para Monitorear
- Latencia por región
- Packet loss rate
- Jitter buffer health
- Connection success rate
- Time to first audio
- Concurrent users per server

## Referencias

- https://discord.com/blog/how-discord-handles-two-and-half-million-concurrent-voice-users-using-webrtc
- Discord Developer Documentation (Voice Connections)
- WebRTC Native Library
- Opus Codec Documentation

---
*Última actualización: 2026-02-04*
*Experto investigado para WhatsSound*
