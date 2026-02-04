# Guillermo Rauch - Socket.io Creator

## Perfil
- **Rol**: Creador de Socket.io, CEO de Vercel
- **Expertise**: Real-time bidireccional, WebSockets, reconexión automática
- **Impacto**: Socket.io es usado por millones de aplicaciones real-time

## Arquitectura de Socket.io

### Modelo de Comunicación
```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   Cliente   │────▶│  Socket.io      │────▶│   Servidor  │
│   Browser   │◀────│  (Transport)    │◀────│   Node.js   │
└─────────────┘     └─────────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  Fallbacks  │
                    ├─────────────┤
                    │ 1. WebSocket│
                    │ 2. Long-Poll│
                    │ 3. WebTrans │
                    └─────────────┘
```

### Transportes Soportados
1. **WebSocket** - Conexión persistente bidireccional
2. **HTTP Long-Polling** - Fallback para redes restrictivas
3. **WebTransport** - Nuevo estándar de baja latencia

### Features Clave

#### 1. Reconexión Automática
```javascript
// Heartbeat mechanism periódico
// Exponential back-off delay al reconectar
socket.on('disconnect', () => {
  // Auto-reconnect con backoff
});
```

#### 2. Packet Buffering
- Mensajes se almacenan cuando cliente está desconectado
- Se envían automáticamente al reconectar

#### 3. Acknowledgements (ACKs)
```javascript
// Sender
socket.emit("hello", "world", (response) => {
  console.log(response); // "got it"
});

// Receiver
socket.on("hello", (arg, callback) => {
  callback("got it");
});

// Con timeout
socket.timeout(5000).emit("hello", "world", (err, response) => {
  if (err) {
    // No ACK en tiempo
  }
});
```

#### 4. Broadcasting y Rooms
```javascript
// A todos los clientes
io.emit("hello");

// A un room específico
io.to("room-abc").emit("hello");

// Escala a múltiples nodos con Adapters
```

#### 5. Namespaces (Multiplexing)
```javascript
// Usuarios normales
io.on("connection", (socket) => {
  // ...
});

// Canal admin separado
io.of("/admin").on("connection", (socket) => {
  // Solo usuarios autorizados
});
```

## Patrones de Presencia

### Implementación Típica
```javascript
const users = new Map();

io.on('connection', (socket) => {
  // Join con user data
  socket.on('join', (userData) => {
    users.set(socket.id, userData);
    io.emit('presence:update', Array.from(users.values()));
  });

  // Disconnect
  socket.on('disconnect', () => {
    users.delete(socket.id);
    io.emit('presence:update', Array.from(users.values()));
  });
});
```

### Presence con Rooms
```javascript
// Tracking por room
socket.on('enter-room', async (roomId) => {
  socket.join(roomId);
  const clients = await io.in(roomId).fetchSockets();
  io.to(roomId).emit('room:members', clients.length);
});
```

## Patrones de Sincronización

### Event-Driven Sync
```javascript
// State change broadcast
socket.on('state:change', (change) => {
  // Aplicar cambio localmente
  applyChange(change);
  // Broadcast a otros
  socket.broadcast.emit('state:change', change);
});
```

### Scaling con Adapters
```javascript
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
// Ahora múltiples instancias pueden comunicarse
```

## Overhead del Protocolo
- `socket.emit("hello", "world")` → `42["hello","world"]`
- Solo ~2-4 bytes extra por mensaje
- Bundle size: ~10.4 KB (minified + gzipped)

## 🎯 Mejoras para WhatsSound

### 1. **Heartbeat Avanzado**
WhatsSound puede implementar heartbeat similar para detectar usuarios "fantasma":
```javascript
// Supabase channel con heartbeat
const channel = supabase.channel('room', {
  config: {
    presence: {
      key: `user-${userId}`,
    },
  },
});

// Heartbeat cada 10s para confirmar presencia real
setInterval(() => {
  channel.track({ 
    lastSeen: Date.now(),
    isActive: document.hasFocus() 
  });
}, 10000);
```

### 2. **ACKs para Mensajes Críticos**
Para votaciones o eventos importantes en WhatsSound:
```javascript
// En lugar de fire-and-forget
const result = await channel.send({
  type: 'broadcast',
  event: 'vote',
  payload: { songId, value }
}, { ack: true }); // Esperar confirmación
```

### 3. **Namespaces para Separar Concerns**
```javascript
// Canal de audio stream
const audioChannel = supabase.channel('room:audio');

// Canal de chat
const chatChannel = supabase.channel('room:chat');

// Canal de votaciones
const voteChannel = supabase.channel('room:votes');
```

### 4. **Buffering para Reconexión**
Implementar cola local de mensajes pendientes:
```javascript
const pendingMessages = [];

channel.on('broadcast', { event: 'sync' }, (payload) => {
  if (!isConnected) {
    pendingMessages.push(payload);
    return;
  }
  processMessage(payload);
});

// Al reconectar, procesar pendientes
channel.on('system', { event: 'subscribed' }, () => {
  pendingMessages.forEach(processMessage);
  pendingMessages.length = 0;
});
```

## Referencias
- [Socket.io Docs](https://socket.io/docs/v4/)
- [How it Works](https://socket.io/docs/v4/how-it-works/)
- [Scaling](https://socket.io/docs/v4/using-multiple-nodes/)
