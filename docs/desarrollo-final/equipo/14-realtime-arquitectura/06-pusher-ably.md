# Pusher & Ably - Pub/Sub Patterns at Scale

## Perfiles

### Pusher
- **Modelo**: Channels con Pub/Sub simple
- **Especialidad**: Presence channels, simplicidad
- **Límites**: 100 miembros por presence channel

### Ably
- **Modelo**: Channels avanzados con features enterprise
- **Especialidad**: Message conflation, history, global distribution
- **Diferenciador**: Sin necesidad de "channel groups"

## Arquitectura de Ably Channels

### Concepto de Canales
```
┌─────────────────────────────────────────────────────────┐
│                    Ably Channels                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐                                    │
│  │    Channel      │◀──── publish() ────┐              │
│  │  "chat:room-1"  │                    │              │
│  └────────┬────────┘              ┌─────┴─────┐        │
│           │                       │  Client   │        │
│    subscribe()                    │   (Pub)   │        │
│           │                       └───────────┘        │
│     ┌─────▼─────┐                                      │
│     │ Clients   │                                      │
│     │  (Sub)    │                                      │
│     └───────────┘                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Channel Namespaces
```javascript
// Namespace = primera parte antes de ":"
// Permite aplicar reglas a grupos de canales

customer              // namespace: customer
customer:tracking     // namespace: customer
customer:order:update // namespace: customer

// Reglas a nivel de namespace:
// - Capabilities (permisos)
// - Channel rules (persistencia, TLS, etc.)
// - Integrations
```

### Channel Rules

#### Persistencia
| Regla | Descripción |
|-------|-------------|
| Persist last message | Último mensaje por 1 año (para rewind) |
| Persist all messages | Todos los mensajes por 24-72h (history) |

#### Seguridad
| Regla | Descripción |
|-------|-------------|
| Identified | Solo clientes con client ID |
| TLS only | Solo conexiones HTTPS/WSS |

#### Features
| Regla | Descripción |
|-------|-------------|
| Push notifications | Permite push payload |
| Server-side batching | Agrupa mensajes antes de enviar |
| Message conflation | Deduplica por conflation key |

### Message Conflation (Clave para WhatsSound!)
```javascript
// Problema: Alta frecuencia de updates (ej: posición de audio)
// Solución: Conflation agrupa por key y envía solo el último

// Sin conflation: 60 updates/segundo enviados
// Con conflation: 1 update/segundo (el más reciente)

// Configuración en Ably:
// - Período de agregación
// - Conflation key (ej: "playback_position")
// - Solo el último valor se entrega
```

## Arquitectura de Pusher

### Presence Channels
```
┌─────────────────────────────────────────────────────────┐
│              Pusher Presence Channel                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Channel: presence-room-123                              │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  members object                                  │    │
│  │  ├── count: 45                                   │    │
│  │  ├── me: { id: "user-1", info: {...} }          │    │
│  │  ├── each(callback)                              │    │
│  │  └── get(userId)                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Events:                                                 │
│  • pusher:subscription_succeeded                         │
│  • pusher:member_added                                   │
│  • pusher:member_removed                                 │
│                                                          │
│  Limits:                                                 │
│  • 100 members max                                       │
│  • 1KB user object                                       │
│  • 128 chars user id                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Subscription Flow
```javascript
// 1. Subscribe al canal
var presenceChannel = pusher.subscribe('presence-room-123');

// 2. Esperar confirmación con members
presenceChannel.bind('pusher:subscription_succeeded', (members) => {
  console.log('Total members:', members.count);
  
  members.each((member) => {
    console.log(member.id, member.info);
  });
});

// 3. Escuchar joins
presenceChannel.bind('pusher:member_added', (member) => {
  console.log('Joined:', member.id, member.info);
});

// 4. Escuchar leaves
presenceChannel.bind('pusher:member_removed', (member) => {
  console.log('Left:', member.id);
});
```

### User Object
```javascript
// Durante autorización, proveer user_data:
{
  user_id: "user-123",  // Required, único
  user_info: {          // Optional, hasta 1KB
    name: "Alice",
    avatar: "https://...",
    role: "host"
  }
}
```

### Multi-Tab Handling
```javascript
// Pusher maneja múltiples tabs automáticamente:
// - member_added: solo cuando PRIMERA tab se conecta
// - member_removed: solo cuando ÚLTIMA tab se desconecta

// Usuario abre 3 tabs → 1 join event
// Usuario cierra 2 tabs → 0 leave events
// Usuario cierra última tab → 1 leave event
```

## 🎯 Mejoras para WhatsSound

### 1. **Namespaces para Organizar Canales**
```javascript
// Adoptar convención de namespaces como Ably
const channels = {
  // Namespace: room
  roomMeta: `room:${roomId}`,
  roomChat: `room:${roomId}:chat`,
  roomQueue: `room:${roomId}:queue`,
  roomPlayback: `room:${roomId}:playback`,
  
  // Namespace: user
  userActivity: `user:${userId}:activity`,
  userNotifications: `user:${userId}:notifications`
};

// Aplicar reglas por namespace vía Supabase RLS
```

### 2. **Message Conflation para Playback Sync**
```javascript
// Problema: Host envía posición 60 veces/segundo
// Solución: Conflation local antes de broadcast

class PlaybackSyncManager {
  constructor(channel) {
    this.channel = channel;
    this.pendingUpdate = null;
    this.conflationInterval = null;
  }
  
  updatePosition(position, isPlaying) {
    // Siempre guardar el último valor
    this.pendingUpdate = { position, isPlaying, timestamp: Date.now() };
  }
  
  startConflation(intervalMs = 500) {
    this.conflationInterval = setInterval(() => {
      if (this.pendingUpdate) {
        // Solo enviar el valor más reciente
        this.channel.send({
          type: 'broadcast',
          event: 'playback:position',
          payload: this.pendingUpdate
        });
        this.pendingUpdate = null;
      }
    }, intervalMs);
  }
  
  stopConflation() {
    clearInterval(this.conflationInterval);
    // Enviar último update inmediatamente
    if (this.pendingUpdate) {
      this.channel.send({
        type: 'broadcast',
        event: 'playback:position',
        payload: this.pendingUpdate
      });
    }
  }
}

// Uso
const syncManager = new PlaybackSyncManager(playbackChannel);
syncManager.startConflation(500); // Máximo 2 updates/segundo

audioPlayer.ontimeupdate = () => {
  syncManager.updatePosition(audioPlayer.currentTime, !audioPlayer.paused);
};
```

### 3. **Server-Side Batching Simulado**
```javascript
// Agrupar mensajes de chat antes de enviar
class MessageBatcher {
  constructor(channel, maxBatchSize = 10, maxWaitMs = 100) {
    this.channel = channel;
    this.batch = [];
    this.maxBatchSize = maxBatchSize;
    this.maxWaitMs = maxWaitMs;
    this.timeout = null;
  }
  
  add(message) {
    this.batch.push(message);
    
    if (this.batch.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.timeout) {
      this.timeout = setTimeout(() => this.flush(), this.maxWaitMs);
    }
  }
  
  flush() {
    if (this.batch.length === 0) return;
    
    clearTimeout(this.timeout);
    this.timeout = null;
    
    this.channel.send({
      type: 'broadcast',
      event: 'chat:batch',
      payload: { messages: this.batch }
    });
    
    this.batch = [];
  }
}
```

### 4. **Presence con Límites como Pusher**
```javascript
// Implementar límites sensatos para rooms grandes
const MAX_DETAILED_PRESENCE = 100;

async function getPresenceForUI(roomId) {
  const allPresence = await getRoomPresence(roomId);
  
  if (allPresence.length <= MAX_DETAILED_PRESENCE) {
    // Mostrar todos con detalle
    return {
      type: 'detailed',
      members: allPresence,
      total: allPresence.length
    };
  }
  
  // Room grande: mostrar count + muestra
  return {
    type: 'summary',
    sample: allPresence.slice(0, 10), // Top 10 (host + activos)
    total: allPresence.length,
    hosts: allPresence.filter(p => p.isHost),
    recentlyActive: allPresence
      .filter(p => Date.now() - p.lastActivity < 60000)
      .length
  };
}
```

### 5. **History/Rewind para Late Joiners**
```javascript
// Cuando usuario se une tarde, darle contexto
async function getRecentContext(roomId) {
  // Últimos N mensajes de chat
  const recentChat = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  // Últimas N canciones tocadas
  const recentSongs = await supabase
    .from('play_history')
    .select('*, songs(*)')
    .eq('room_id', roomId)
    .order('played_at', { ascending: false })
    .limit(10);
  
  // Estado actual
  const currentState = await getRoomState(roomId);
  
  return {
    chat: recentChat.data.reverse(), // Orden cronológico
    history: recentSongs.data,
    current: currentState
  };
}

// Al unirse
channel.on('system', { event: 'subscribed' }, async () => {
  const context = await getRecentContext(roomId);
  setInitialContext(context);
});
```

### 6. **Identified Clients**
```javascript
// Requerir identificación como Ably's "Identified" rule
function validatePresenceJoin(presencePayload, session) {
  if (!session.user_id) {
    throw new Error('Anonymous users cannot join presence');
  }
  
  // Verificar que user_id del payload coincide con sesión
  if (presencePayload.userId !== session.user_id) {
    throw new Error('User ID mismatch');
  }
  
  return true;
}
```

## Comparación de Patrones

| Feature | Pusher | Ably | WhatsSound (Supabase) |
|---------|--------|------|----------------------|
| Presence | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| Max members | 100 | Unlimited | Unlimited* |
| Message history | ❌ | ✅ 72h | ✅ Via DB |
| Conflation | ❌ | ✅ Server-side | 🔧 Implementar |
| Batching | ❌ | ✅ Server-side | 🔧 Implementar |
| Namespaces | ❌ | ✅ | 🔧 Convención |

## Referencias
- [Pusher Presence Channels](https://pusher.com/docs/channels/using_channels/presence-channels/)
- [Ably Channels Concepts](https://ably.com/docs/channels)
- [Ably Message Conflation](https://ably.com/docs/channels/options/conflation)
