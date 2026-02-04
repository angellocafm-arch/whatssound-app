# Liveblocks - Collaborative Features

## Perfil
- **Producto**: Plataforma de colaboración real-time
- **Modelo**: Rooms como unidad de colaboración
- **Features**: Presence, Storage (CRDTs), Comments, AI Agents

## Arquitectura de Liveblocks

### Conceptos Clave
```
┌─────────────────────────────────────────────────────────────┐
│                     Liveblocks Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Project (App-level container)                               │
│  │                                                           │
│  ├── Tenants (Organizations/Workspaces)                     │
│  │   │                                                       │
│  │   └── Rooms (Collaboration spaces)                       │
│  │       │                                                   │
│  │       ├── Presence (Who's here, cursors)                 │
│  │       ├── Storage (Shared state, CRDTs)                  │
│  │       ├── Comments (Threaded discussions)                │
│  │       └── AI Agents (Copilots)                           │
│  │                                                           │
│  └── Collaborators                                           │
│      ├── Users (People)                                      │
│      └── AI Agents                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Rooms
```javascript
// Room = espacio donde ocurre la colaboración
// Típicamente mapea a: documento, archivo, página, etc.

// Ejemplos de rooms:
// - Documento de texto: room = "doc-{docId}"
// - Whiteboard: room = "board-{boardId}"
// - Spreadsheet: room = "sheet-{sheetId}"
// - WhatsSound: room = "listening-room-{roomId}"

// Cada room tiene:
// - Su propia presencia
// - Su propio storage
// - Sus propios comments
// - Sus propias notificaciones
```

### Tenants (Multi-tenancy)
```javascript
// Tenants = compartmentalización por organización/workspace

// Beneficios:
// 1. Inbox notifications separados por tenant
// 2. Rooms aislados por tenant
// 3. Permisos por tenant

// Ejemplo para WhatsSound:
// Tenant = "premium-users" → rooms privadas
// Tenant = "free-users" → rooms públicas
// Tenant = "org-{orgId}" → rooms de una organización
```

### Regions
```
| Region | Data Location                              | Availability    |
|--------|-------------------------------------------|-----------------|
| Earth  | Global (Cloudflare edge + AWS us-east-1)  | All plans       |
| US     | US only (FedRAMP compliance)              | Enterprise      |
| EU     | EU only (AWS eu-central-1)                | Enterprise      |
```

## Ready-Made Features

### 1. Presence
```javascript
// Quién está conectado y qué están haciendo

// Update my presence
room.updatePresence({
  cursor: { x: 100, y: 200 },
  selectedId: "element-123",
  name: "Alice"
});

// Subscribe to others' presence
room.subscribe("others", (others) => {
  for (const user of others) {
    console.log(user.presence.cursor);
  }
});

// Self presence
const myPresence = room.getPresence();
```

### 2. Storage (CRDTs)
```javascript
// Estado compartido con conflict resolution automático

// LiveObject - objeto colaborativo
const root = room.getStorage();
root.set("title", "My Document");
root.set("count", 0);

// LiveList - lista colaborativa
const items = new LiveList(["item1", "item2"]);
root.set("items", items);
items.push("item3");
items.delete(0);

// LiveMap - mapa colaborativo
const users = new LiveMap();
root.set("users", users);
users.set("user-1", { name: "Alice" });

// Subscribirse a cambios
room.subscribe(root, () => {
  console.log("Storage updated:", root.toObject());
});
```

### 3. Comments
```javascript
// Comentarios contextuales en el documento

// Crear thread
const thread = room.createThread({
  body: { version: 1, content: [...] },
  metadata: {
    x: 100,
    y: 200,
    elementId: "element-123"
  }
});

// Responder
thread.createComment({
  body: { version: 1, content: [...] }
});

// Mencionar usuarios
// @[user-id] en el contenido
```

### 4. Notifications
```javascript
// Inbox notifications para usuarios

// Tipos de notificaciones:
// - Mentioned in thread
// - Reply to your comment
// - Thread resolved
// - etc.

// Fetch inbox
const { data } = await liveblocks.getInboxNotifications({
  userId: "user-123"
});

// Mark as read
await liveblocks.markInboxNotificationAsRead({
  userId: "user-123",
  inboxNotificationId: "notification-1"
});
```

### 5. AI Agents
```javascript
// AI como colaborador

// Liveblocks AI Copilots:
// - Configurados en dashboard
// - Cualquier LLM (OpenAI, Anthropic, etc.)
// - RAG con PDFs, websites, etc.
// - Componente <AiChat /> listo para usar

// Framework Agents (private beta):
// - Aparecen con presencia en rooms
// - Pueden ser @mencionados
// - Reciben webhooks de eventos
// - Retornan acciones
```

## 🎯 Mejoras para WhatsSound

### 1. **Room como Listening Party**
```javascript
// Mapear conceptos de Liveblocks a WhatsSound

class ListeningRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.channel = supabase.channel(`room:${roomId}`);
  }
  
  // Presence: quién está escuchando
  async updatePresence(data) {
    await this.channel.track({
      ...data,
      lastUpdate: Date.now()
    });
  }
  
  // Storage: estado compartido (cola, playback)
  // Usar tabla de Supabase con RLS
  
  // Comments: chat de la sesión
  // Usar tabla room_messages
  
  // Notifications: @mentions, invitaciones
  // Usar tabla notifications + Supabase Realtime
}
```

### 2. **LiveList para Cola de Reproducción**
```javascript
// Implementar patrón LiveList de Liveblocks

class LiveQueue {
  constructor(roomId) {
    this.roomId = roomId;
    this.items = [];
    this.channel = supabase.channel(`room:${roomId}:queue`);
    this.listeners = [];
  }
  
  async init() {
    // Cargar estado inicial
    const { data } = await supabase
      .from('room_queue')
      .select('*, songs(*)')
      .eq('room_id', this.roomId)
      .order('position');
    
    this.items = data || [];
    
    // Escuchar cambios
    this.channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_queue',
        filter: `room_id=eq.${this.roomId}`
      }, this.handleChange.bind(this))
      .subscribe();
  }
  
  handleChange(payload) {
    switch (payload.eventType) {
      case 'INSERT':
        this.insertAt(payload.new.position, payload.new);
        break;
      case 'DELETE':
        this.removeById(payload.old.id);
        break;
      case 'UPDATE':
        this.updateItem(payload.new);
        break;
    }
    this.notify();
  }
  
  // Operaciones locales + sync
  async push(song) {
    const position = this.items.length;
    const item = {
      room_id: this.roomId,
      song_id: song.id,
      added_by: getCurrentUserId(),
      position
    };
    
    // Optimistic update
    this.items.push({ ...item, songs: song });
    this.notify();
    
    // Sync to DB
    await supabase.from('room_queue').insert(item);
  }
  
  async delete(index) {
    const item = this.items[index];
    
    // Optimistic update
    this.items.splice(index, 1);
    this.reindex();
    this.notify();
    
    // Sync to DB
    await supabase.from('room_queue').delete().eq('id', item.id);
  }
  
  async move(fromIndex, toIndex) {
    // Optimistic update
    const [item] = this.items.splice(fromIndex, 1);
    this.items.splice(toIndex, 0, item);
    this.reindex();
    this.notify();
    
    // Sync to DB (batch update positions)
    const updates = this.items.map((item, index) => ({
      id: item.id,
      position: index
    }));
    await supabase.from('room_queue').upsert(updates);
  }
  
  reindex() {
    this.items.forEach((item, index) => {
      item.position = index;
    });
  }
  
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  notify() {
    this.listeners.forEach(l => l([...this.items]));
  }
}
```

### 3. **Presence con Cursores/Actividad**
```javascript
// Rich presence como Liveblocks

interface UserPresence {
  id: string;
  name: string;
  avatar: string;
  // Cursor de audio (dónde está en la canción)
  playbackPosition: number | null;
  // Estado
  isListening: boolean;
  isPaused: boolean;
  // UI state
  selectedSongId: string | null;
  isTyping: boolean;
  // Activity
  lastActive: number;
}

// Hook de React
function useOthersPresence(roomId) {
  const [others, setOthers] = useState<UserPresence[]>([]);
  
  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat() as UserPresence[];
        setOthers(users.filter(u => u.id !== currentUserId));
      })
      .subscribe();
    
    return () => channel.unsubscribe();
  }, [roomId]);
  
  return others;
}

// Componente
function OthersAvatars({ roomId }) {
  const others = useOthersPresence(roomId);
  
  return (
    <div className="flex -space-x-2">
      {others.slice(0, 5).map(user => (
        <Avatar 
          key={user.id}
          src={user.avatar}
          className={user.isListening ? 'ring-2 ring-green-500' : ''}
        />
      ))}
      {others.length > 5 && (
        <span className="text-sm">+{others.length - 5}</span>
      )}
    </div>
  );
}
```

### 4. **Comments/Reactions en Canciones**
```javascript
// Threads de comentarios por canción (inspirado en Liveblocks)

async function createSongThread(songId, comment) {
  const thread = await supabase
    .from('song_threads')
    .insert({
      room_id: roomId,
      song_id: songId,
      created_by: userId,
      timestamp_seconds: currentPlaybackPosition // posición en la canción
    })
    .select()
    .single();
  
  await supabase.from('thread_comments').insert({
    thread_id: thread.data.id,
    user_id: userId,
    content: comment
  });
  
  return thread.data;
}

// Mostrar comentarios anclados a timestamp
function SongTimeline({ song }) {
  const [threads, setThreads] = useState([]);
  const duration = song.duration_ms / 1000;
  
  useEffect(() => {
    loadThreads(song.id).then(setThreads);
  }, [song.id]);
  
  return (
    <div className="relative h-8 bg-gray-200 rounded">
      {threads.map(thread => (
        <div
          key={thread.id}
          className="absolute w-2 h-2 bg-blue-500 rounded-full cursor-pointer"
          style={{ left: `${(thread.timestamp_seconds / duration) * 100}%` }}
          onClick={() => showThread(thread)}
        />
      ))}
    </div>
  );
}
```

### 5. **Notifications para @mentions**
```javascript
// Sistema de notificaciones inspirado en Liveblocks

// Detectar mentions en mensaje
function parseMentions(text) {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      name: match[1],
      userId: match[2]
    });
  }
  
  return mentions;
}

// Crear notificaciones
async function sendMessageWithMentions(roomId, text) {
  const mentions = parseMentions(text);
  
  // Insert message
  const { data: message } = await supabase
    .from('room_messages')
    .insert({ room_id: roomId, user_id: userId, text })
    .select()
    .single();
  
  // Create notifications for mentioned users
  const notifications = mentions.map(mention => ({
    user_id: mention.userId,
    type: 'mention',
    room_id: roomId,
    message_id: message.id,
    actor_id: userId,
    read: false
  }));
