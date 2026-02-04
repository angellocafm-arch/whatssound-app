# Clubhouse / Twitter Spaces - Live Audio Rooms

## Visión General

Clubhouse (2020) y Twitter Spaces revolucionaron el audio social en vivo. Pioneros en "social audio" con salas de conversación en tiempo real.

## Tecnología de Audio

### Stack Técnico (Clubhouse)
- **Audio Engine**: Agora SDK (principal)
- **Protocolo**: WebRTC modificado
- **Codec**: Opus (optimizado para voz)
- **Arquitectura**: SFU (Selective Forwarding Unit)

### Stack Técnico (Twitter Spaces)
- **Infraestructura**: Periscope (adquirida)
- **Audio**: WebRTC + custom SFU
- **Transcription**: Real-time speech-to-text
- **Codec**: Opus 48kHz

### Arquitectura de Sala
```
┌─────────────────────────────────────────┐
│              AUDIO ROOM                  │
├─────────────────────────────────────────┤
│  Speakers (mic on)  →  SFU Server       │
│                          ↓              │
│  Listeners (mic off) ←  Mixed/Forwarded │
│                                         │
│  Moderators (controls)                  │
│  - Mute speakers                        │
│  - Invite to stage                      │
│  - End room                             │
└─────────────────────────────────────────┘
```

## Latencia y Calidad

### Métricas Objetivo
| Métrica | Clubhouse | Twitter Spaces |
|---------|-----------|----------------|
| Latencia e2e | 200-400ms | 300-500ms |
| Codec | Opus 32-64kbps | Opus 48kbps |
| Sample rate | 48kHz | 48kHz |
| Participantes max | 8000 | 13 speakers, ∞ listeners |

### Optimizaciones para Voz
1. **Voice Activity Detection (VAD)**: No transmitir silencio
2. **Acoustic Echo Cancellation (AEC)**: Evitar feedback
3. **Noise Suppression (NS)**: Filtrar ruido ambiente
4. **Automatic Gain Control (AGC)**: Normalizar volumen

## Roles y Permisos

### Jerarquía de Usuarios
```
Host/Creator
    ↓
Co-hosts/Moderators
    ↓
Speakers (on stage)
    ↓
Listeners (audience)
```

### Acciones por Rol
| Acción | Host | Mod | Speaker | Listener |
|--------|------|-----|---------|----------|
| Hablar | ✓ | ✓ | ✓ | ✗ |
| Invitar a stage | ✓ | ✓ | ✗ | ✗ |
| Mute otros | ✓ | ✓ | ✗ | ✗ |
| Levantar mano | ✓ | ✓ | ✓ | ✓ |
| Cerrar sala | ✓ | ✗ | ✗ | ✗ |

## Características Clave

### Hand Raise (Levantar Mano)
- Notificación a moderadores
- Queue de solicitudes
- Accept/Decline por mods
- Transición suave a speaker

### Recording (Twitter Spaces)
- Grabación automática opcional
- 30 días de retención
- Transcripción automática
- Clip sharing

### Live Captions
- Speech-to-text en tiempo real
- Múltiples idiomas
- Accesibilidad mejorada
- Searchable después

## Propuestas para WhatsSound

### Implementar (Crítico)
1. **Sistema de Roles**:
   ```typescript
   enum RoomRole {
     HOST = 'host',
     MODERATOR = 'moderator', 
     SPEAKER = 'speaker',
     LISTENER = 'listener'
   }
   
   interface RoomParticipant {
     userId: string;
     role: RoomRole;
     isMuted: boolean;
     handRaised: boolean;
     joinedAt: Date;
   }
   ```

2. **Hand Raise Queue**:
   ```typescript
   interface HandRaiseQueue {
     roomId: string;
     requests: {
       userId: string;
       requestedAt: Date;
       status: 'pending' | 'approved' | 'denied';
     }[];
   }
   ```

3. **Audio Processing Pipeline**:
   - VAD: No enviar paquetes en silencio
   - AEC: Cancelación de eco (Agora/WebRTC incluido)
   - NS: Noise suppression (RNNoise o similar)
   - AGC: Normalización de volumen

### Implementar (Alta Prioridad)
4. **Moderación en Tiempo Real**:
   - Mute remoto (force mute)
   - Kick de sala
   - Ban temporal/permanente
   - Content moderation (audio AI)

5. **Stage Management**:
   - Invitar a stage
   - Mover a audiencia
   - Límite de speakers configurable
   - Speaker queue

### Implementar (Media Prioridad)
6. **Recording**:
   - Server-side recording
   - Post-processing (normalize, trim)
   - Transcripción con Whisper/similar
   - Clips exportables

### Código de Ejemplo (Role Management)
```typescript
class AudioRoomManager {
  private participants: Map<string, RoomParticipant> = new Map();
  
  async promoteToSpeaker(userId: string, moderatorId: string): Promise<void> {
    const moderator = this.participants.get(moderatorId);
    if (!moderator || !['host', 'moderator'].includes(moderator.role)) {
      throw new Error('Insufficient permissions');
    }
    
    const participant = this.participants.get(userId);
    if (!participant) throw new Error('User not in room');
    
    // Enable audio send capability
    await this.audioService.enableMicrophone(userId);
    
    // Update role
    participant.role = RoomRole.SPEAKER;
    participant.handRaised = false;
    
    // Notify room
    this.broadcast('participant_promoted', { userId, newRole: 'speaker' });
  }
  
  async raiseHand(userId: string): Promise<void> {
    const participant = this.participants.get(userId);
    if (!participant || participant.role !== RoomRole.LISTENER) return;
    
    participant.handRaised = true;
    
    // Notify moderators
    this.notifyModerators('hand_raised', { userId });
  }
}
```

## Lecciones Aprendidas

### De Clubhouse
- ✅ Exclusividad inicial generó FOMO
- ✅ Audio-only reduce fricción
- ❌ Sin grabaciones = contenido perdido
- ❌ Moderación difícil a escala

### De Twitter Spaces
- ✅ Integración con social graph existente
- ✅ Transcripciones mejoran SEO/accesibilidad
- ✅ Grabaciones aumentan alcance
- ❌ Latencia mayor que Clubhouse

## Referencias

- Agora SDK Documentation
- WebRTC Audio Processing (AEC, NS, AGC)
- Opus Codec Specification
- Twitter Spaces API (limitada)

---
*Última actualización: 2026-02-04*
*Experto investigado para WhatsSound*
