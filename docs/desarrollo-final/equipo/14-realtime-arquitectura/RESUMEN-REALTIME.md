# RESUMEN: Arquitectura Real-time para WhatsSound

> Investigación de 10 referentes mundiales en sistemas real-time aplicada a WhatsSound

## 📊 Matriz de Expertos

| # | Experto/Equipo | Especialidad | Escala | Tecnología |
|---|----------------|--------------|--------|------------|
| 1 | Guillermo Rauch (Socket.io) | WebSockets, reconexión | Millones apps | Node.js |
| 2 | Supabase Realtime | Presence, Postgres CDC | Miles de apps | Elixir/Phoenix |
| 3 | Discord Engineering | Massive real-time | Trillones msgs | Rust, Elixir |
| 4 | Figma Engineering | Multiplayer, CRDTs | Millones users | Rust, WASM |
| 5 | Phoenix LiveView | Server-rendered RT | Base de Supabase | Elixir |
| 6 | Pusher/Ably | Pub/Sub, Presence | Enterprise | Multi |
| 7 | Slack Engineering | Presence systems | Millones users | Java |
| 8 | Martin Kleppmann | CRDTs, Distributed | Academia + Automerge | Agnóstico |
| 9 | Firebase Realtime | Mobile-first, Offline | Billones ops | Propietario |
| 10 | Liveblocks | Colaboración | Startups-Enterprise | TypeScript |

---

## 🏗️ Patrones Arquitectónicos Clave

### 1. Separación de Canales por Concern
**Fuente**: Discord, Slack, Phoenix

```
WhatsSound debería tener canales separados:

room:{id}:presence  → Quién está conectado
room:{id}:playback  → Sync de audio (alta prioridad)
room:{id}:chat      → Mensajes de chat
room:{id}:queue     → Cola de reproducción
room:{id}:votes     → Sistema de votaciones
room:{id}:reactions → Reacciones efímeras
```

**Beneficios**:
- Menos ruido por canal
- Priorización de mensajes críticos (audio > chat)
- Suscripción selectiva
- Mejor debugging

### 2. Last-Writer-Wins para Estado Simple
**Fuente**: Figma, Supabase, Martin Kleppmann

```javascript
// Para playback state, votos individuales, preferencias
// No necesitas CRDTs complejos

const playbackState = {
  position: { value: 45.2, timestamp: Date.now(), nodeId: 'host-1' },
  isPlaying: { value: true, timestamp: Date.now(), nodeId: 'host-1' }
};

// Merge simple: el más reciente gana
function merge(local, remote) {
  return remote.timestamp > local.timestamp ? remote : local;
}
```

### 3. Message Conflation para Alto Throughput
**Fuente**: Ably, Discord

```javascript
// Problema: Sync de posición de audio 60 veces/segundo
// Solución: Conflation - solo enviar el último valor

class PlaybackConflator {
  pendingUpdate = null;
  
  update(position, isPlaying) {
    this.pendingUpdate = { position, isPlaying, ts: Date.now() };
  }
  
  // Flush cada 500ms (máximo 2 updates/segundo)
  flush() {
    if (this.pendingUpdate) {
      channel.send({ event: 'playback:sync', payload: this.pendingUpdate });
      this.pendingUpdate = null;
    }
  }
}
```

### 4. Request Coalescing para Hot Paths
**Fuente**: Discord

```javascript
// Múltiples usuarios pidiendo el mismo recurso = 1 query

class RequestCoalescer {
  pending = new Map();
  
  async get(key, fetcher) {
    if (this.pending.has(key)) {
      return this.pending.get(key); // Reusar request en vuelo
    }
    
    const promise = fetcher().finally(() => this.pending.delete(key));
    this.pending.set(key, promise);
    return promise;
  }
}

// Uso: 100 usuarios piden room state = 1 query a DB
const state = await coalescer.get(`room:${id}`, () => fetchRoomState(id));
```

### 5. Estructura Plana (Denormalización)
**Fuente**: Firebase

```sql
-- ❌ MAL: Todo anidado
rooms (
  queue jsonb,      -- Si hay 1000 canciones, se carga todo
  messages jsonb,   -- Si hay 10000 mensajes, se carga todo
  ...
)

-- ✅ BIEN: Tablas separadas
rooms (id, name, host_id, ...)
room_queue (id, room_id, song_id, position, ...)
room_messages (id, room_id, user_id, text, ...)

-- Beneficio: Queries granulares, paginación, permisos por tabla
```

---

## 👥 Patrones de Presencia

### Presencia Básica (Ya implementado en Supabase)
```javascript
channel.track({
  user_id: userId,
  username: user.name,
  avatar: user.avatar_url,
  online_at: new Date().toISOString()
});
```

### Presencia Enriquecida (Recomendado)
**Fuente**: Liveblocks, Slack

```javascript
channel.track({
  // Identidad
  user_id: userId,
  username: user.name,
  avatar: user.avatar_url,
  
  // Estado de listening
  isListening: true,
  isPaused: false,
  playbackPosition: 45.2,
  
  // Actividad
  status: 'active', // active | idle | away
  lastActivity: Date.now(),
  isTyping: false,
  
  // Engagement
  currentReaction: '🔥',
  selectedSongId: 'song-123'
});
```

### Presencia Selectiva para Rooms Grandes
**Fuente**: Slack

```javascript
// Solo trackear usuarios VISIBLES en pantalla
const MAX_TRACKED = 50;

function getRelevantPresence(allPresence) {
  // Prioridad: Host > Amigos > Activos recientes > Random
  const host = allPresence.find(p => p.isHost);
  const friends = allPresence.filter(p => userFriends.includes(p.userId));
  const recent = allPresence.filter(p => Date.now() - p.lastActivity < 60000);
  
  return [host, ...friends, ...recent]
    .filter(Boolean)
    .slice(0, MAX_TRACKED);
}
```

### Heartbeat para Detectar Zombies
**Fuente**: Socket.io

```javascript
// Detectar usuarios "fantasma" que no están realmente activos

let lastInteraction = Date.now();
document.addEventListener('mousemove', () => lastInteraction = Date.now());
document.addEventListener('keypress', () => lastInteraction = Date.now());

setInterval(async () => {
  const isIdle = Date.now() - lastInteraction > 120000; // 2 min
  const isVisible = document.visibilityState === 'visible';
  
  await channel.track({
    ...currentPresence,
    status: isIdle ? 'idle' : (isVisible ? 'active' : 'background'),
    lastSeen: Date.now()
  });
}, 30000);
```

---

## 🔄 Patrones de Sincronización

### Optimistic Updates + Realtime
**Fuente**: Figma, Supabase

```javascript
async function addToQueue(song) {
  // 1. Update local inmediato (optimistic)
  setQueue(prev => [...prev, song]);
  
  // 2. Persistir en DB
  await supabase.from('room_queue').insert({
    room_id: roomId,
    song_id: song.id,
    added_by: userId
  });
  
  // 3. Otros usuarios reciben via postgres_changes
  // (nosotros ya lo tenemos, evitar duplicar)
}

channel.on('postgres_changes', { event: 'INSERT', table: 'room_queue' }, (payload) => {
  if (payload.new.added_by !== userId) { // Solo si no soy yo
    setQueue(prev => [...prev, payload.new]);
  }
});
```

### Prevención de Flickering
**Fuente**: Figma

```javascript
// Problema: Cambio local se sobrescribe por ACK tardío del servidor

const unacknowledged = new Map();

function localChange(key, value) {
  unacknowledged.set(key, { value, ts: Date.now() });
  applyToUI(key, value);
  sendToServer(key, value);
}

function handleServerUpdate(key, value, serverTs) {
  const local = unacknowledged.get(key);
  if (local && local.ts > serverTs) {
    // Nuestro cambio es más reciente, ignorar server
    return;
  }
  applyToUI(key, value);
}

function handleAck(key) {
  unacknowledged.delete(key);
}
```

### Sync de Playback con Drift Compensation
**Fuente**: Análisis propio basado en patrones de video sync

```javascript
// Host broadcast posición
if (isHost) {
  setInterval(() => {
    channel.send({
      type: 'broadcast',
      event: 'playback:sync',
      payload: {
        position: audio.currentTime,
        isPlaying: !audio.paused,
        timestamp: Date.now()
      }
    });
  }, 1000);
}

// Listener ajusta con compensación de latencia
channel.on('broadcast', { event: 'playback:sync' }, ({ payload }) => {
  const networkDelay = (Date.now() - payload.timestamp) / 1000;
  const targetPosition = payload.position + networkDelay;
  const drift = Math.abs(audio.currentTime - targetPosition);
  
  // Solo ajustar si drift > 0.5 segundos
  if (drift > 0.5) {
    audio.currentTime = targetPosition;
  }
  
  // Sync play/pause
  if (payload.isPlaying && audio.paused) audio.play();
  if (!payload.isPlaying && !audio.paused) audio.pause();
});
```

---

## 📱 Patrones Offline-First

### Cola de Operaciones Pendientes
**Fuente**: Firebase, Martin Kleppmann

```javascript
class OfflineManager {
  pendingOps = [];
  
  async execute(operation) {
    // Aplicar localmente siempre
    this.applyLocally(operation);
    
    if (!navigator.onLine) {
      // Guardar para después
      this.pendingOps.push(operation);
      await this.persistToIndexedDB(operation);
      return;
    }
    
    await this.syncToServer(operation);
  }
  
  async onReconnect() {
    // Sync pendientes en orden
    for (const op of this.pendingOps) {
      await this.syncToServer(op);
    }
    this.pendingOps = [];
    
    // Reconciliar con estado del servidor
    const serverState = await this.fetchServerState();
    this.merge(serverState);
  }
}

window.addEventListener('online', () => offlineManager.onReconnect());
```

### Cache Local con IndexedDB
```javascript
// Cachear estado del room para carga rápida

const db = await idb.openDB('whatssound', 1, {
  upgrade(db) {
    db.createObjectStore('rooms');
    db.createObjectStore('queues');
    db.createObjectStore('pending-ops', { keyPath: 'id', autoIncrement: true });
  }
});

// Al cargar room: mostrar cache primero, luego actualizar
async function loadRoom(roomId) {
  // 1. Mostrar cache inmediatamente
  const cached = await db.get('rooms', roomId);
  if (cached) setRoomState(cached);
  
  // 2. Fetch fresh data
  const fresh = await fetchRoomFromServer(roomId);
  setRoomState(fresh);
  
  // 3. Actualizar cache
  await db.put('rooms', fresh, roomId);
}
```

---

## 🎯 MEJORAS PRIORITARIAS PARA WHATSSOUND

### Prioridad 1: Arquitectura de Canales
```javascript
// Separar canales por tipo de evento

const channels = {
  presence: supabase.channel(`room:${id}:presence`),
  playback: supabase.channel(`room:${id}:playback`),
  chat: supabase.channel(`room:${id}:chat`),
  queue: supabase.channel(`room:${id}:queue`),
  reactions: supabase.channel(`room:${id}:reactions`)
};

// Playback tiene prioridad - sync más frecuente
// Reactions son efímeras - fire & forget
```

### Prioridad 2: Conflation para Playback
```javascript
// Reducir mensajes de sync de audio

const playbackSync = new PlaybackConflator(channels.playback);
playbackSync.startConflation(500); // Máx 2 msgs/segundo

audio.ontimeupdate = () => {
  playbackSync.update(audio.currentTime, !audio.paused);
};
```

### Prioridad 3: Presencia Rica
```javascript
// Más contexto sobre cada usuario

interface WhatsoundPresence {
  userId: string;
  username: string;
  avatar: string;
  
  // Listening state
  isListening: boolean;
  playbackPosition: number | null;
  isPaused: boolean;
  
  // Activity
  status: 'active' | 'idle' | 'away';
  lastActivity: number;
  isTyping: boolean;
  
  // Engagement
  currentReaction: string | null;
  totalReactions: number;
  songsAdded: number;
}
```

### Prioridad 4: Estructura de DB Plana
```sql
-- Tablas separadas para queries eficientes

CREATE TABLE rooms (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  host_id UUID REFERENCES users(id),
  current_song_id UUID,
  current_position FLOAT DEFAULT 0,
  is_playing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE room_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL, -- Spotify ID
  added_by UUID REFERENCES users(id),
  position INTEGER NOT NULL,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE song_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID REFERENCES room_queue(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  value INTEGER CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(queue_item_id, user_id)
);
```

### Prioridad 5: Optimistic Updates
```javascript
// Framework para updates optimistas

function useOptimisticMutation(mutationFn, { onOptimistic, onError }) {
  const [pending, setPending] = useState(false);
  
  const mutate = async (data) => {
    // 1. Optimistic update
    const rollback = onOptimistic(data);
    setPending(true);
    
    try {
      // 2. Actual mutation
      await mutationFn(data);
    } catch (error) {
      // 3. Rollback on error
      rollback();
      onError?.(error);
    } finally {
      setPending(false);
    }
  };
  
  return { mutate, pending };
}

// Uso
const { mutate: addSong } = useOptimisticMutation(
  (song) => supabase.from('room_queue').insert(song),
  {
    onOptimistic: (song) => {
      const prev = queue;
      setQueue([...queue, song]);
      return () => setQueue(prev); // rollback function
    }
  }
);
```

---

## 📈 Métricas de Referencia

| Métrica | Discord | Slack | WhatsSound Target |
|---------|---------|-------|-------------------|
| Latencia mensaje | <500ms global | <500ms | <300ms |
| Tiempo reconexión | <20s | - | <5s |
| Presencia update | Selectiva | Selectiva | <1s |
| Playback drift | - | - | <0.5s |

---

## 🔗 Referencias Rápidas

1. **Socket.io**: Reconnection, ACKs, Namespaces
2. **Supabase**: Presence, Broadcast, Postgres Changes
3. **Discord**: Coalescing, Consistent Hashing, ScyllaDB
4. **Figma**: LWW-Register, Offline-first, No OTs
5. **Phoenix**: Streams, PubSub, Process per connection
6. **Pusher/Ably**: Conflation, Presence limits, History
7. **Slack**: Selective presence, Multi-region, Transient events
8. **Kleppmann**: CRDTs (G-Counter, PN-Counter, OR-Set)
9. **Firebase**: Flat structure, Bidirectional indexes, Offline
10. **Liveblocks**: Rooms model, LiveList, AI Agents

---

## ✅ Checklist de Implementación

- [ ] Separar canales por concern (presence, playback, chat, queue)
- [ ] Implementar conflation para playback sync
- [ ] Enriquecer modelo de presencia
- [ ] Migrar a estructura de DB plana
- [ ] Implementar optimistic updates
- [ ] Agregar offline queue con IndexedDB
- [ ] Drift compensation para sync de audio
- [ ] Heartbeat para detectar usuarios idle
- [ ] Coalescing para rooms populares
- [ ] Tests de latencia y reconexión

---

*Documento generado: Febrero 2026*
*Basado en investigación de 10 referentes mundiales en sistemas real-time*
