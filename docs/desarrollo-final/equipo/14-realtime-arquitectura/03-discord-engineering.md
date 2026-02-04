# Discord Engineering - Massive Real-time at Scale

## Perfil
- **Escala**: Trillones de mensajes, millones de usuarios concurrentes
- **Stack**: Elixir, Rust, ScyllaDB (antes Cassandra)
- **Especialidad**: WebSockets masivos, baja latencia global

## Arquitectura de Discord

### Overview del Sistema
```
┌─────────────────────────────────────────────────────────────────┐
│                    Discord Real-time Architecture                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐   │
│  │   Client    │────▶│   Gateway   │────▶│  Channel Server │   │
│  │  (WebSocket)│◀────│   Server    │◀────│   (por canal)   │   │
│  └─────────────┘     └─────────────┘     └─────────────────┘   │
│                             │                     │              │
│                             │                     │              │
│                      ┌──────▼──────┐       ┌──────▼──────┐      │
│                      │   Admin     │       │  Presence   │      │
│                      │   Server    │       │   Server    │      │
│                      └─────────────┘       └─────────────┘      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      ScyllaDB                            │    │
│  │            (Trillones de mensajes)                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes Clave

#### 1. **Gateway Servers (GS)**
- **Función**: Interface entre clientes y backend
- **Estado**: Stateful, in-memory
- **Almacena**: Info de usuario, suscripciones WebSocket
- **Distribución**: Múltiples regiones geográficas
- **Draining**: Failover automático entre regiones

#### 2. **Channel Servers (CS)**
- **Función**: Maneja mensajes por canal
- **Estado**: Stateful, in-memory con historial
- **Distribución**: Consistent hashing (canal → servidor)
- **Escala**: ~16 millones de canales por host en picos
- **Recuperación**: Nuevo CS listo en <20 segundos

#### 3. **Admin Servers (AS)**
- **Función**: Interface entre Webapp y CS
- **Estado**: Stateless, in-memory
- **Rol**: Routing de mensajes

#### 4. **Presence Servers (PS)**
- **Función**: Track de usuarios online
- **Visible**: Los "puntos verdes"
- **Distribución**: Usuarios hasheados a PS específicos
- **Optimización**: Solo envía presencia de usuarios visibles

### Flujo de Mensaje
```
1. Cliente envía mensaje vía API
         │
         ▼
2. Webapp recibe y envía a Admin Server
         │
         ▼
3. AS descubre CS vía consistent hash ring
         │
         ▼
4. CS recibe mensaje para ese canal
         │
         ▼
5. CS envía a TODOS los Gateway Servers suscritos
         │
         ▼
6. Cada GS envía a clientes suscritos vía WebSocket
```

## Patrones de Presencia

### Sistema de Presencia de Discord
```
┌─────────────┐     Query      ┌─────────────────┐
│   Client    │──────────────▶ │  Presence       │
│  (via GS)   │◀────────────── │  Server         │
└─────────────┘   Notification └─────────────────┘

Optimizaciones:
- Solo presencia de usuarios VISIBLES en pantalla
- Hash de usuarios a PS específicos
- Queries a través de WebSocket vía GS
```

### Notificaciones de Presencia Selectivas
```javascript
// Concepto: solo trackear usuarios relevantes
const visibleUsers = getCurrentlyVisibleUsers();

// Subscribe solo a presencia de usuarios visibles
presenceChannel.subscribe(visibleUsers.map(u => u.id));

// Cuando scroll cambia, actualizar suscripciones
onViewportChange((newVisible) => {
  const added = newVisible.filter(u => !visibleUsers.includes(u));
  const removed = visibleUsers.filter(u => !newVisible.includes(u));
  
  presenceChannel.subscribe(added.map(u => u.id));
  presenceChannel.unsubscribe(removed.map(u => u.id));
});
```

## Patrones de Sincronización y Escalado

### Data Services en Rust
Discord introdujo "Data Services" como capa intermedia:

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│  API/Mono   │────▶│  Data Service   │────▶│  ScyllaDB   │
│             │◀────│  (Rust)         │◀────│             │
└─────────────┘     └─────────────────┘     └─────────────┘
                            │
                    ┌───────┴───────┐
                    │   Features    │
                    ├───────────────┤
                    │ • Coalescing  │
                    │ • Caching     │
                    │ • Shielding   │
                    └───────────────┘
```

### Request Coalescing (Clave!)
```rust
// Concepto: Si múltiples usuarios piden el mismo row
// Solo hacer UNA query a la DB

// Usuario 1 pide mensaje X → crea worker task
// Usuario 2 pide mensaje X → se suscribe al mismo task
// Usuario 3 pide mensaje X → se suscribe al mismo task
// Worker completa → notifica a los 3 suscriptores

// Reduce dramáticamente load en hot partitions
```

### Consistent Hash-Based Routing
```
Channel ID → Hash → Specific Data Service Instance

// Beneficio: Todas las requests del mismo canal
// van al mismo instance → mejor coalescing
```

## Lecciones de Escala

### Migración Cassandra → ScyllaDB
| Métrica | Cassandra | ScyllaDB |
|---------|-----------|----------|
| Nodos | 177 | 72 |
| Storage/nodo | 4TB | 9TB |
| p99 Fetch | 40-125ms | 15ms |
| p99 Insert | 5-70ms | 5ms |
| GC Pauses | Frecuentes | N/A (C++) |

### Hot Partitions
- **Problema**: Un canal muy activo sobrecarga un nodo
- **Solución**: Data Services con coalescing
- **Resultado**: Spikes de tráfico (ej: goles del Mundial) manejables

## 🎯 Mejoras para WhatsSound

### 1. **Coalescing para Rooms Populares**
```javascript
// Cache layer para rooms con muchos usuarios
const roomCache = new Map();
const pendingRequests = new Map();

async function getRoomState(roomId) {
  // Check cache
  if (roomCache.has(roomId)) {
    return roomCache.get(roomId);
  }
  
  // Check if request in flight
  if (pendingRequests.has(roomId)) {
    return pendingRequests.get(roomId);
  }
  
  // Create new request
  const promise = fetchRoomState(roomId).then(state => {
    roomCache.set(roomId, state);
    pendingRequests.delete(roomId);
    // TTL de cache
    setTimeout(() => roomCache.delete(roomId), 5000);
    return state;
  });
  
  pendingRequests.set(roomId, promise);
  return promise;
}
```

### 2. **Presencia Selectiva**
Solo trackear usuarios "relevantes" para reducir overhead:
```javascript
// En lugar de trackear TODOS los usuarios del room
const MAX_VISIBLE_PRESENCE = 50;

function getRelevantPresence(allPresence, currentUserId) {
  // Priorizar:
  // 1. El host
  // 2. Amigos del usuario
  // 3. Usuarios que han interactuado recientemente
  // 4. Random sample del resto
  
  const host = allPresence.find(p => p.isHost);
  const friends = allPresence.filter(p => userFriends.includes(p.userId));
  const recent = allPresence.filter(p => p.lastMessage > Date.now() - 60000);
  
  const relevant = [host, ...friends, ...recent].filter(Boolean);
  const remaining = MAX_VISIBLE_PRESENCE - relevant.length;
  const others = allPresence
    .filter(p => !relevant.includes(p))
    .slice(0, remaining);
  
  return [...relevant, ...others];
}
```

### 3. **Gateway Regional**
Arquitectura multi-región para WhatsSound:
```
┌─────────────────────────────────────────────────┐
│                   Cloudflare                     │
│              (Edge routing)                      │
└───────────┬─────────────┬─────────────┬─────────┘
            │             │             │
     ┌──────▼───┐  ┌──────▼───┐  ┌──────▼───┐
     │ US-East  │  │   EU     │  │  LATAM   │
     │ Supabase │  │ Supabase │  │ Supabase │
     └──────────┘  └──────────┘  └──────────┘

// Beneficio: Usuarios conectan a región más cercana
```

### 4. **Manejo de Eventos Pico**
Inspirado en cómo Discord manejó el Mundial:
```javascript
// Detectar picos de actividad
let messagesPerSecond = 0;
const MESSAGE_THRESHOLD = 100;

setInterval(() => {
  if (messagesPerSecond > MESSAGE_THRESHOLD) {
    // Activar modo "high traffic"
    enableBatching();
    reducePresenceUpdates();
    throttleNonCriticalEvents();
  }
  messagesPerSecond = 0;
}, 1000);

function enableBatching() {
  // Batch chat messages en grupos de 5
  // En lugar de enviar 1 por 1
}
```

### 5. **Separación de Concerns por Canal**
Similar a Discord con Channel Servers:
```javascript
// Canales separados con prioridades diferentes
const channels = {
  audio: supabase.channel(`room:${id}:audio`, { 
    config: { priority: 'high' } 
  }),
  chat: supabase.channel(`room:${id}:chat`, { 
    config: { priority: 'normal' } 
  }),
  reactions: supabase.channel(`room:${id}:reactions`, { 
    config: { priority: 'low' } 
  }),
};

// Audio sync siempre tiene prioridad
```

## Métricas Inspiracionales
- **Entrega global**: <500ms
- **Escalabilidad**: Lineal con infraestructura
- **Recuperación**: <20s para nuevos servidores
- **Usuarios por host**: Millones

## Referencias
- [How Discord Stores Trillions of Messages](https://discord.com/blog/how-discord-stores-trillions-of-messages)
- [Why Discord is Switching from Go to Rust](https://discord.com/blog/why-discord-is-switching-from-go-to-rust)
- [How Discord Stores Billions of Messages](https://discord.com/blog/how-discord-stores-billions-of-messages)
