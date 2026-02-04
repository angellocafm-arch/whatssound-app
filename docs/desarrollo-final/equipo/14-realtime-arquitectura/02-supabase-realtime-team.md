# Supabase Realtime Team

## Perfil
- **Producto**: Supabase Realtime (motor de WhatsSound)
- **Stack**: Elixir/Phoenix, PostgreSQL
- **Modelo**: Pub/Sub distribuido con presencia nativa

## Arquitectura de Supabase Realtime

### Componentes Principales
```
┌─────────────────────────────────────────────────────────┐
│                   Supabase Realtime                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  Broadcast  │  │  Presence   │  │ Postgres Changes│ │
│  │  (Pub/Sub)  │  │  (State)    │  │  (CDC/Triggers) │ │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                │                   │          │
│         └────────────────┼───────────────────┘          │
│                          │                              │
│                    ┌─────▼─────┐                        │
│                    │  Phoenix  │                        │
│                    │  Channels │                        │
│                    └─────┬─────┘                        │
│                          │                              │
│                    ┌─────▼─────┐                        │
│                    │ WebSocket │                        │
│                    └───────────┘                        │
└─────────────────────────────────────────────────────────┘
```

### Tres Pilares de Realtime

#### 1. **Broadcast** - Mensajería Low-Latency
```javascript
// Enviar a todos en el canal
channel.send({
  type: 'broadcast',
  event: 'cursor-move',
  payload: { x: 100, y: 200 }
});

// Recibir broadcasts
channel.on('broadcast', { event: 'cursor-move' }, (payload) => {
  moveCursor(payload.x, payload.y);
});
```

#### 2. **Presence** - Estado Compartido entre Usuarios
```javascript
// Estructura del estado
{
  "client_key_1": [{ "userId": 1, "typing": false }],
  "client_key_2": [{ "userId": 2, "typing": true }]
}

// Eventos de presencia
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
});

channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
  console.log('User joined:', newPresences);
});

channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
  console.log('User left:', leftPresences);
});
```

#### 3. **Postgres Changes** - CDC en Tiempo Real
```javascript
// Escuchar cambios en tabla
channel.on(
  'postgres_changes',
  { event: 'INSERT', schema: 'public', table: 'messages' },
  (payload) => {
    console.log('New message:', payload.new);
  }
);

// Filtrar por columna
channel.on(
  'postgres_changes',
  { 
    event: '*', 
    schema: 'public', 
    table: 'messages',
    filter: 'room_id=eq.123'
  },
  handleChange
);
```

## Patrones de Presencia en Detalle

### Ciclo de Vida de Presencia
```
1. Cliente se conecta
         │
         ▼
2. channel.subscribe()
         │
         ▼
3. channel.track({ user_id, status })
         │
         ▼
4. Server genera presence_key único (UUIDv1)
         │
         ▼
5. Broadcast 'join' a todos los suscriptores
         │
         ▼
6. Cada cliente recibe 'sync' con estado completo
         │
         ▼
7. En desconexión → 'leave' event automático
```

### Presence Key Personalizado
```javascript
// Usar ID de usuario como key
const channel = supabase.channel('room', {
  config: {
    presence: {
      key: `user-${userId}`,
    },
  },
});

// Beneficio: evita duplicados si usuario abre múltiples tabs
```

### Tracking de Estado
```javascript
// Trackear estado inicial
await channel.track({
  userId: user.id,
  username: user.name,
  online_at: new Date().toISOString(),
  isTyping: false,
  currentSong: null
});

// Actualizar estado
await channel.track({
  ...currentState,
  isTyping: true
});

// Dejar de trackear
await channel.untrack();
```

## Patrones de Sincronización

### Optimistic Updates + Realtime
```javascript
// 1. Update local inmediato
setMessages(prev => [...prev, newMessage]);

// 2. Persistir en DB
await supabase.from('messages').insert(newMessage);

// 3. Otros usuarios reciben vía postgres_changes
// (ya está en tu UI, no duplicar)
channel.on('postgres_changes', { event: 'INSERT' }, (payload) => {
  if (payload.new.user_id !== currentUserId) {
    setMessages(prev => [...prev, payload.new]);
  }
});
```

### Broadcast vs Postgres Changes

| Aspecto | Broadcast | Postgres Changes |
|---------|-----------|------------------|
| Persistencia | ❌ Efímero | ✅ Persiste en DB |
| Latencia | ⚡ Más rápido | 🐢 Pasa por DB |
| Uso ideal | Cursores, typing | Mensajes, datos |
| Confiabilidad | Fire & forget | Garantizado |

## 🎯 Mejoras para WhatsSound

### 1. **Sistema de Presencia Mejorado**
```javascript
// Presence con más contexto
await channel.track({
  userId: user.id,
  username: user.name,
  avatar: user.avatar_url,
  status: 'active', // active | idle | away
  isListening: true,
  currentPosition: 45.2, // segundos de la canción
  volume: 0.8,
  lastActivity: Date.now()
});

// Detectar usuarios idle
setInterval(() => {
  const lastActivity = channel.presenceState()[myKey]?.lastActivity;
  if (Date.now() - lastActivity > 60000) {
    channel.track({ ...state, status: 'idle' });
  }
}, 30000);
```

### 2. **Sincronización de Playback**
```javascript
// Host broadcast posición cada segundo
if (isHost) {
  setInterval(() => {
    channel.send({
      type: 'broadcast',
      event: 'playback:sync',
      payload: {
        position: audioPlayer.currentTime,
        isPlaying: !audioPlayer.paused,
        timestamp: Date.now()
      }
    });
  }, 1000);
}

// Listeners ajustan con drift compensation
channel.on('broadcast', { event: 'playback:sync' }, (payload) => {
  const networkDelay = Date.now() - payload.timestamp;
  const targetPosition = payload.position + (networkDelay / 1000);
  
  // Solo ajustar si drift > 0.5s
  if (Math.abs(audioPlayer.currentTime - targetPosition) > 0.5) {
    audioPlayer.currentTime = targetPosition;
  }
});
```

### 3. **Sistema de Votaciones Robusto**
```javascript
// Combinar broadcast (velocidad) + DB (persistencia)
async function vote(songId, value) {
  // Broadcast inmediato para UI
  channel.send({
    type: 'broadcast',
    event: 'vote:preview',
    payload: { songId, userId: user.id, value }
  });
  
  // Persistir en DB (fuente de verdad)
  await supabase.from('votes').upsert({
    song_id: songId,
    user_id: user.id,
    value
  });
}

// Escuchar votos de DB para reconciliar
channel.on('postgres_changes', { 
  event: '*', 
  table: 'votes',
  filter: `room_id=eq.${roomId}`
}, reconcileVotes);
```

### 4. **Canal por Tipo de Evento**
```javascript
// Separar canales por concern
const presenceChannel = supabase.channel(`room:${roomId}:presence`);
const chatChannel = supabase.channel(`room:${roomId}:chat`);
const playbackChannel = supabase.channel(`room:${roomId}:playback`);
const votesChannel = supabase.channel(`room:${roomId}:votes`);

// Beneficios:
// - Menos ruido por canal
// - Puedes suscribirte solo a lo necesario
// - Mejor debugging
```

### 5. **Heartbeat para Presencia Activa**
```javascript
// Detectar si usuario realmente está activo
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

## Casos de Uso Ideales
- ✅ Chat applications
- ✅ Collaborative tools
- ✅ Live dashboards
- ✅ Multiplayer games
- ✅ **Listening parties (WhatsSound!)**

## Referencias
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Realtime GitHub](https://github.com/supabase/realtime)
- [Presence Guide](https://supabase.com/docs/guides/realtime/presence)
