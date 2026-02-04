# Slack Engineering - Presence Systems at Scale

## Perfil
- **Escala**: Millones de mensajes diarios, millones de canales
- **Stack**: Java (Channel, Gateway, Admin, Presence Servers)
- **Especialidad**: Presencia distribuida, low-latency global

## Arquitectura de Slack Real-time

### Componentes del Sistema
```
┌─────────────────────────────────────────────────────────────────┐
│                    Slack Real-time Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐                                               │
│   │   Client    │                                               │
│   │ (WebSocket) │                                               │
│   └──────┬──────┘                                               │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐    │
│   │   Envoy     │───▶│   Gateway   │───▶│    Channel      │    │
│   │ (Load Bal.) │    │   Server    │    │    Server       │    │
│   └─────────────┘    └─────────────┘    └─────────────────┘    │
│                             │                   │                │
│                             │            ┌──────▼──────┐        │
│                      ┌──────▼──────┐     │   Admin     │        │
│                      │  Presence   │     │   Server    │        │
│                      │   Server    │     └─────────────┘        │
│                      └─────────────┘            │                │
│                             │                   │                │
│                             └─────────┬─────────┘                │
│                                       │                          │
│                              ┌────────▼────────┐                 │
│                              │     Webapp      │                 │
│                              │   (Hacklang)    │                 │
│                              └─────────────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Servidores Detallados

#### Gateway Server (GS)
```
Estado: Stateful, in-memory
Función: Interface cliente ↔ backend
Distribución: Multi-región geográfica

Features:
- Mantiene WebSocket connections
- Almacena subscripciones de canales por usuario
- Draining mechanism para failover entre regiones
```

#### Channel Server (CS)
```
Estado: Stateful, in-memory con historial
Función: Maneja mensajes por canal
Distribución: Consistent hashing (16M canales/host en picos)

Registro: Consul (service discovery)
Recovery: <20 segundos para nuevo CS
```

#### Presence Server (PS)
```
Estado: In-memory
Función: Track de usuarios online (green dots)
Distribución: Usuarios hasheados a PS específicos

Optimización: Solo envía presencia de usuarios VISIBLES en pantalla
```

## Flujo de Conexión

### Setup de WebSocket
```
1. Client boot → fetch token + websocket info from Webapp
         │
         ▼
2. Connect to nearest edge region
         │
         ▼
3. Envoy routes to Gateway Server
         │
         ▼
4. GS fetches user info (channels) from Webapp
         │
         ▼
5. GS sends first message to client
         │
         ▼
6. GS subscribes to Channel Servers (async, via consistent hash)
         │
         ▼
7. Client ready for real-time messages
```

### Flujo de Mensaje
```
Client A sends message
         │
         ▼
Webapp API receives
         │
         ▼
Admin Server routes (consistent hash)
         │
         ▼
Channel Server receives
         │
         ▼
CS broadcasts to ALL subscribed Gateway Servers globally
         │
         ├──▶ GS Region 1 → Clients A, B
         │
         └──▶ GS Region 2 → Client C
```

## Patrones de Presencia

### Selectividad de Presencia
```javascript
// Slack solo envía presencia de usuarios VISIBLES
// No de todos los usuarios del workspace

// Concepto:
// - Cliente informa qué usuarios ve en pantalla
// - Servidor solo envía updates de esos usuarios
// - Cuando viewport cambia, re-subscribe

onViewportChange((visibleUserIds) => {
  presenceChannel.unsubscribe(previousVisible);
  presenceChannel.subscribe(visibleUserIds);
});
```

### Green Dots (Online Status)
```
┌─────────────┐     Query       ┌─────────────────┐
│   Client    │───────────────▶ │   Presence      │
│             │                 │   Server        │
│  "Is Alice  │                 │                 │
│   online?"  │◀─────────────── │  Users hashed   │
└─────────────┘   Response      │  to specific PS │
                                └─────────────────┘
```

## Eventos Transitorios

### Typing Indicators
```
Flujo diferente a mensajes persistentes:

Client A typing
       │
       ▼
Gateway Server receives
       │
       ▼
Route to Channel Server (consistent hash)
       │
       ▼
CS broadcasts to subscribed GS
       │
       ▼
GS delivers to other clients in channel

Nota: NO se persiste en DB
```

## Traffic Patterns

### Patrones de Uso
```
Traffic típico:
- Picos: 9am-5pm hora local
- Sub-picos: 11am y 2pm
- Dip: lunch hour

Multiplicador de broadcast:
- Varía por región
- Depende del tamaño promedio de teams
```

### Métricas
- Mensajes entregados globalmente: <500ms
- Canales por host: ~16 millones (pico)
- Escalabilidad: Lineal

## 🎯 Mejoras para WhatsSound

### 1. **Presencia Selectiva (Viewport-Based)**
```javascript
// Solo trackear presencia de usuarios visibles
class SelectivePresence {
  constructor(channel) {
    this.channel = channel;
    this.trackedUsers = new Set();
    this.presenceCache = new Map();
  }
  
  updateVisibleUsers(userIds) {
    const toSubscribe = userIds.filter(id => !this.trackedUsers.has(id));
    const toUnsubscribe = [...this.trackedUsers].filter(id => !userIds.includes(id));
    
    // Actualizar tracked set
    toUnsubscribe.forEach(id => this.trackedUsers.delete(id));
    toSubscribe.forEach(id => this.trackedUsers.add(id));
    
    // En WhatsSound, esto podría ser lista de participantes visibles
    // cuando hay muchos usuarios en un room
  }
  
  getPresence(userId) {
    return this.presenceCache.get(userId);
  }
}

// En UI
const visibleParticipants = participantList.getVisibleItems();
selectivePresence.updateVisibleUsers(visibleParticipants.map(p => p.id));
```

### 2. **Multi-Region Architecture**
```
                    Cloudflare
                        │
         ┌──────────────┼──────────────┐
         │              │              │
    ┌────▼────┐   ┌─────▼─────┐   ┌────▼────┐
    │ US-East │   │  EU-West  │   │ LATAM   │
    │ Gateway │   │  Gateway  │   │ Gateway │
    └────┬────┘   └─────┬─────┘   └────┬────┘
         │              │              │
         └──────────────┼──────────────┘
                        │
                  ┌─────▼─────┐
                  │ Supabase  │
                  │  (Main)   │
                  └───────────┘

// Beneficio: Usuarios conectan a región más cercana
// para mínima latencia en WebSocket
```

### 3. **Consistent Hashing para Rooms**
```javascript
// Distribuir rooms entre workers/canales
import { ConsistentHash } from 'consistent-hash';

const ring = new ConsistentHash();
ring.add('worker-1');
ring.add('worker-2');
ring.add('worker-3');

function getChannelForRoom(roomId) {
  const worker = ring.get(roomId);
  return `${worker}:room:${roomId}`;
}

// Todos los eventos del mismo room van al mismo worker
// Mejor para caching y coalescing
```

### 4. **Eventos Transitorios (No Persistidos)**
```javascript
// Similar a typing indicators de Slack
const transientEvents = ['typing', 'reaction_hover', 'cursor_move', 'seeking'];

function sendTransientEvent(event, data) {
  // Broadcast directo, sin persistir
  channel.send({
    type: 'broadcast',
    event: `transient:${event}`,
    payload: {
      userId: currentUser.id,
      ...data,
      // TTL implícito - receptores ignoran eventos viejos
      timestamp: Date.now()
    }
  });
}

// Receptor
channel.on('broadcast', { event: 'transient:typing' }, ({ payload }) => {
  // Ignorar si muy viejo (>5 segundos)
  if (Date.now() - payload.timestamp > 5000) return;
  
  showTypingIndicator(payload.userId);
});
```

### 5. **Batching para Reactions**
```javascript
// Muchas reactions simultáneas (ej: drop de canción)
class ReactionBatcher {
  constructor(channel) {
    this.channel = channel;
    this.pending = new Map(); // songId -> Set<emoji>
    this.debounceMs = 100;
  }
  
  addReaction(songId, emoji, userId) {
    if (!this.pending.has(songId)) {
      this.pending.set(songId, new Map());
    }
    
    const songReactions = this.pending.get(songId);
    if (!songReactions.has(emoji)) {
      songReactions.set(emoji, new Set());
    }
    songReactions.get(emoji).add(userId);
    
    this.scheduleFlush(songId);
  }
  
  scheduleFlush(songId) {
    clearTimeout(this.flushTimers?.get(songId));
    this.flushTimers = this.flushTimers || new Map();
    
    this.flushTimers.set(songId, setTimeout(() => {
      this.flush(songId);
    }, this.debounceMs));
  }
  
  flush(songId) {
    const reactions = this.pending.get(songId);
    if (!reactions) return;
    
    // Convertir a formato compacto
    const payload = {};
    reactions.forEach((users, emoji) => {
      payload[emoji] = users.size; // Solo count, no user IDs
    });
    
    this.channel.send({
      type: 'broadcast',
      event: 'reactions:batch',
      payload: { songId, reactions: payload }
    });
    
    this.pending.delete(songId);
  }
}
```

### 6. **Draining para Mantenimiento**
```javascript
// Migrar usuarios gracefully (inspirado en Slack's draining)
async function drainConnection(reason) {
  // 1. Notificar cliente que debe reconectar
  channel.send({
    type: 'broadcast',
    event: 'system:drain',
    payload: {
      reason,
      reconnectIn: 5000,
      alternativeServer: getAlternativeServer()
    }
  });
  
  // 2. Esperar a que cliente reconecte
  await wait(5000);
  
  // 3. Forzar desconexión si sigue conectado
  channel.unsubscribe();
}

// Cliente
channel.on('broadcast', { event: 'system:drain' }, ({ payload }) => {
  showNotification('Reconectando...');
  
  setTimeout(() => {
    reconnectTo(payload.alternativeServer);
  }, payload.reconnectIn);
});
```

## Lecciones de Slack

1. **Separar concerns**: Diferentes servidores para diferentes responsabilidades
2. **Consistent hashing**: Para distribución predecible de carga
3. **Presencia selectiva**: No trackear todo, solo lo visible
4. **Multi-región**: Mínima latencia conectando a edge más cercano
5. **Transient vs Persistent**: Diferentes flujos para diferentes tipos de eventos
6. **Service discovery**: Consul o similar para routing dinámico

## Referencias
- [Slack Engineering Blog - Real-time Messaging](https://slack.engineering/real-time-messaging/)
- [How Slack Built Shared Channels](https://slack.engineering/how-slack-built-shared-channels/)
