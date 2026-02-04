# Firebase Realtime Database - Mobile Real-time

## Perfil
- **Producto**: Firebase Realtime Database (Google)
- **Especialidad**: Mobile-first, JSON tree, offline-first
- **Modelo**: NoSQL con sync automático

## Arquitectura de Firebase Realtime

### Estructura: JSON Tree
```
Firebase Database = Un gran árbol JSON

{
  "users": {
    "user-1": {
      "name": "Alice",
      "email": "alice@example.com"
    },
    "user-2": {
      "name": "Bob"
    }
  },
  "rooms": {
    "room-1": {
      "name": "Friday Vibes",
      "host": "user-1"
    }
  },
  "messages": {
    "room-1": {
      "msg-1": { "text": "Hello", "sender": "user-1" },
      "msg-2": { "text": "Hi!", "sender": "user-2" }
    }
  }
}
```

### Listeners en Tiempo Real
```javascript
// Escuchar cambios en un nodo
const messagesRef = firebase.database().ref('messages/room-1');

// Value - todo el nodo
messagesRef.on('value', (snapshot) => {
  console.log('All messages:', snapshot.val());
});

// Child added - nuevos hijos
messagesRef.on('child_added', (snapshot) => {
  console.log('New message:', snapshot.val());
});

// Child changed - hijo modificado
messagesRef.on('child_changed', (snapshot) => {
  console.log('Updated message:', snapshot.val());
});

// Child removed - hijo eliminado
messagesRef.on('child_removed', (snapshot) => {
  console.log('Deleted message:', snapshot.val());
});
```

## Best Practices de Estructura

### ❌ Evitar: Datos Anidados
```javascript
// MAL: Nesting profundo
{
  "chats": {
    "chat-1": {
      "title": "Tech Chat",
      "messages": {
        // Si hay 10,000 mensajes aquí,
        // descargar el título requiere TODOS los mensajes
        "m1": { "sender": "...", "message": "..." },
        "m2": { "..." },
        // ... miles más
      }
    }
  }
}

// Problema: Leer un nodo = leer TODOS sus hijos
// También hereda permisos
```

### ✅ Preferir: Estructura Plana (Denormalización)
```javascript
// BIEN: Datos aplanados
{
  // Metadata separada
  "chats": {
    "chat-1": {
      "title": "Tech Chat",
      "lastMessage": "Hello!",
      "timestamp": 1699999999
    }
  },
  
  // Miembros separados
  "members": {
    "chat-1": {
      "user-1": true,
      "user-2": true
    }
  },
  
  // Mensajes separados
  "messages": {
    "chat-1": {
      "m1": { "sender": "user-1", "text": "Hello!" },
      "m2": { "..." }
    }
  }
}

// Beneficios:
// - Puedo leer chats sin mensajes
// - Puedo paginar mensajes
// - Permisos más granulares
```

### Índices para Relaciones Bidireccionales
```javascript
// Problema: ¿A qué grupos pertenece el usuario X?
// Si solo tengo groups.members, debo buscar en TODOS los grupos

// Solución: Índice bidireccional
{
  "users": {
    "alice": {
      "name": "Alice",
      "groups": {
        "group-1": true,
        "group-2": true
      }
    }
  },
  "groups": {
    "group-1": {
      "name": "Music Lovers",
      "members": {
        "alice": true,
        "bob": true
      }
    }
  }
}

// Ahora puedo:
// 1. Obtener grupos de Alice: /users/alice/groups
// 2. Obtener miembros de grupo: /groups/group-1/members

// Trade-off: Redundancia = más actualizaciones necesarias
```

### Datos que Escalan
```javascript
// Usar push() para IDs únicos ordenados cronológicamente
const newMessageRef = messagesRef.push();
newMessageRef.set({
  sender: 'user-1',
  text: 'Hello!',
  timestamp: firebase.database.ServerValue.TIMESTAMP
});

// ID generado: "-MXyz123..." (ordenable por tiempo)
```

## Offline First

### Persistencia Local
```javascript
// Habilitar persistencia (mobile SDKs)
firebase.database().setPersistence(firebase.database.LOCALE);

// Los datos se cachean localmente
// Writes funcionan offline (se sincronizan después)
// Reads funcionan offline (del cache)
```

### Manejo de Conexión
```javascript
// Detectar estado de conexión
const connectedRef = firebase.database().ref('.info/connected');
connectedRef.on('value', (snapshot) => {
  if (snapshot.val() === true) {
    console.log('Connected');
  } else {
    console.log('Disconnected');
  }
});

// Presencia con onDisconnect
const presenceRef = firebase.database().ref(`presence/${userId}`);
presenceRef.onDisconnect().remove();
presenceRef.set(true);
```

## 🎯 Mejoras para WhatsSound

### 1. **Estructura Plana para Rooms**
```javascript
// Aplicar patrón de Firebase a Supabase

// Tabla: rooms (metadata)
{
  id: 'room-1',
  name: 'Friday Vibes',
  host_id: 'user-1',
  theme: 'party',
  created_at: '...',
  // NO incluir queue, messages, etc.
}

// Tabla: room_members (relación)
{
  room_id: 'room-1',
  user_id: 'user-1',
  role: 'host',
  joined_at: '...'
}

// Tabla: room_queue (separada)
{
  id: 'queue-item-1',
  room_id: 'room-1',
  song_id: 'spotify:track:xxx',
  added_by: 'user-1',
  position: 0,
  added_at: '...'
}

// Tabla: room_messages (separada)
{
  id: 'msg-1',
  room_id: 'room-1',
  user_id: 'user-1',
  text: 'Great song!',
  created_at: '...'
}
```

### 2. **Índices Bidireccionales**
```javascript
// En Supabase con RLS

// users_rooms: qué rooms tiene un usuario
// (para "mis rooms" rápido)
const myRooms = await supabase
  .from('room_members')
  .select('room_id, rooms(*)')
  .eq('user_id', userId);

// room_members: qué usuarios tiene un room
// (para lista de participantes)
const roomMembers = await supabase
  .from('room_members')
  .select('user_id, users(*)')
  .eq('room_id', roomId);
```

### 3. **Listener Pattern para Updates**
```javascript
// Simular Firebase listeners con Supabase Realtime

class RoomListener {
  constructor(roomId) {
    this.roomId = roomId;
    this.callbacks = {
      roomChanged: [],
      queueItemAdded: [],
      queueItemRemoved: [],
      messageAdded: [],
      memberJoined: [],
      memberLeft: []
    };
  }
  
  on(event, callback) {
    this.callbacks[event].push(callback);
  }
  
  off(event, callback) {
    this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
  }
  
  subscribe() {
    // Room metadata
    this.roomChannel = supabase
      .channel(`room:${this.roomId}:meta`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${this.roomId}`
      }, (payload) => {
        this.callbacks.roomChanged.forEach(cb => cb(payload.new));
      })
      .subscribe();
    
    // Queue
    this.queueChannel = supabase
      .channel(`room:${this.roomId}:queue`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_queue',
        filter: `room_id=eq.${this.roomId}`
      }, (payload) => {
        this.callbacks.queueItemAdded.forEach(cb => cb(payload.new));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'room_queue',
        filter: `room_id=eq.${this.roomId}`
      }, (payload) => {
        this.callbacks.queueItemRemoved.forEach(cb => cb(payload.old));
      })
      .subscribe();
    
    // Messages
    this.messagesChannel = supabase
      .channel(`room:${this.roomId}:messages`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_messages',
        filter: `room_id=eq.${this.roomId}`
      }, (payload) => {
        this.callbacks.messageAdded.forEach(cb => cb(payload.new));
      })
      .subscribe();
  }
  
  unsubscribe() {
    this.roomChannel?.unsubscribe();
    this.queueChannel?.unsubscribe();
    this.messagesChannel?.unsubscribe();
  }
}

// Uso (similar a Firebase)
const listener = new RoomListener('room-1');

listener.on('messageAdded', (message) => {
  addMessageToUI(message);
});

listener.on('queueItemAdded', (item) => {
  addToQueueUI(item);
});

listener.subscribe();
```

### 4. **Offline Queue con IndexedDB**
```javascript
// Cache local para offline
class OfflineQueue {
  constructor() {
    this.dbName = 'whatssound-offline';
    this.storeName = 'pending-operations';
    this.db = null;
  }
  
  async init() {
    this.db = await idb.openDB(this.dbName, 1, {
      upgrade(db) {
        db.createObjectStore('pending-operations', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        db.createObjectStore('cache');
      }
    });
  }
  
  async addPendingOperation(operation) {
    await this.db.add('pending-operations', {
      ...operation,
      timestamp: Date.now()
    });
  }
  
  async getPendingOperations() {
    return this.db.getAll('pending-operations');
  }
  
  async clearOperation(id) {
    await this.db.delete('pending-operations', id);
  }
  
  async cacheData(key, data) {
    await this.db.put('cache', data, key);
  }
  
  async getCachedData(key) {
    return this.db.get('cache', key);
  }
}

// Uso
const offlineQueue = new OfflineQueue();
await offlineQueue.init();

// Cuando usuario hace acción offline
async function addToQueueOffline(song) {
  // Guardar operación pendiente
  await offlineQueue.addPendingOperation({
    type: 'addToQueue',
    payload: { roomId, song }
  });
  
  // Actualizar UI local
  updateLocalQueueUI(song);
}

// Cuando se recupera conexión
window.addEventListener('online', async () => {
  const pending = await offlineQueue.getPendingOperations();
  
  for (const op of pending) {
    try {
      await syncOperation(op);
      await offlineQueue.clearOperation(op.id);
    } catch (e) {
      console.error('Sync failed for operation:', op);
    }
  }
});
```

### 5. **Presence con onDisconnect Pattern**
```javascript
// Similar a Firebase onDisconnect

async function setupPresence(roomId, userId) {
  const presenceChannel = supabase.channel(`room:${roomId}:presence`);
  
  // Track presencia
  await presenceChannel.track({
    user_id: userId,
    online_at: new Date().toISOString()
  });
  
  // Simular onDisconnect: cleanup en beforeunload
  window.addEventListener('beforeunload', async () => {
    await presenceChannel.untrack();
  });
  
  // También en visibilitychange
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
      // Marcar como away pero no remover
      await presenceChannel.track({
        user_id: userId,
        status: 'away',
        away_at: new Date().toISOString()
      });
    } else {
      await presenceChannel.track({
        user_id: userId,
        status: 'active',
        online_at: new Date().toISOString()
      });
    }
  });
  
  return presenceChannel;
}
```

### 6. **ServerValue.TIMESTAMP Equivalent**
```javascript
// Firebase tiene ServerValue.TIMESTAMP
// En Supabase, usar now() en SQL o timestamptz default

// Opción 1: Default en tabla
CREATE TABLE room_messages (
  id uuid DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id),
  user_id uuid REFERENCES users(id),
  text text,
  created_at timestamptz DEFAULT now() -- Server timestamp
);

// Opción 2: En insert
const { data } = await supabase
  .from('room_messages')
  .insert({
    room_id: roomId,
    user_id: userId,
    text: message
    // created_at se llena automáticamente
  })
  .select();
```

## Lecciones de Firebase

1. **Flat is better**: Evitar nesting profundo
2. **Denormalize for reads**: Duplicar datos para lecturas rápidas
3. **Índices bidireccionales**: Para relaciones many-to-many
4. **Offline first**: Diseñar asumiendo desconexión
5. **Listeners granulares**: child_added vs value
6. **Push IDs**: IDs que se ordenan cronológicamente

## Referencias
- [Structure Your Database](https://firebase.google.com/docs/database/web/structure-data)
- [Work with Lists of Data](https://firebase.google.com/docs/database/web/lists-of-data)
- [Offline Capabilities](https://firebase.google.com/docs/database/web/offline-capabilities)
