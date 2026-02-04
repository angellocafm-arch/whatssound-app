# Phoenix LiveView Team - Real-time Patterns en Elixir

## Perfil
- **Framework**: Phoenix LiveView (Elixir)
- **Modelo**: Server-rendered real-time (no client framework)
- **Base de Supabase Realtime**: Construido sobre Phoenix Channels

## Arquitectura de LiveView

### Ciclo de Vida
```
┌──────────────────────────────────────────────────────────────┐
│                    Phoenix LiveView                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   1. HTTP Request                                             │
│         │                                                     │
│         ▼                                                     │
│   2. mount/3 (params, session, socket)                       │
│         │                                                     │
│         ▼                                                     │
│   3. handle_params/3 (URL handling)                          │
│         │                                                     │
│         ▼                                                     │
│   4. render/1 → HTML Response                                │
│         │                                                     │
│         ▼                                                     │
│   5. WebSocket Upgrade (if JS enabled)                       │
│         │                                                     │
│         ▼                                                     │
│   6. mount/3 again (connected)                               │
│         │                                                     │
│         ▼                                                     │
│   7. push_event/3 → Diffs to client                          │
│         │                                                     │
│         ▼                                                     │
│   8. handle_event/3 ← Events from client                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Características Clave

#### 1. **Stateful Process (GenServer)**
```elixir
# Cada LiveView es un proceso Erlang/Elixir
# Estado se mantiene en memoria
# Puede recibir mensajes de otros procesos

defmodule MyAppWeb.RoomLive do
  use Phoenix.LiveView
  
  def mount(%{"room_id" => room_id}, _session, socket) do
    if connected?(socket) do
      # Solo en conexión WebSocket
      Phoenix.PubSub.subscribe(MyApp.PubSub, "room:#{room_id}")
    end
    
    {:ok, assign(socket, room_id: room_id, messages: [])}
  end
  
  # Recibir broadcasts de otros procesos
  def handle_info({:new_message, message}, socket) do
    {:noreply, update(socket, :messages, &[message | &1])}
  end
end
```

#### 2. **Efficient Diffs**
```elixir
# LiveView solo envía cambios (diffs), no página completa

# Cambio de estado
socket = assign(socket, :count, 42)

# Solo envía el nuevo valor de count al cliente
# No re-renderiza toda la página
```

#### 3. **Async Operations**
```elixir
# assign_async para operaciones lentas
def mount(_params, _session, socket) do
  {:ok,
    socket
    |> assign(:loading, true)
    |> assign_async(:user_data, fn -> 
      {:ok, %{user_data: fetch_user_data()}} 
    end)}
end

# start_async para más control
def mount(_params, _session, socket) do
  {:ok,
    socket
    |> assign(:org, AsyncResult.loading())
    |> start_async(:fetch_org, fn -> fetch_org!() end)}
end

def handle_async(:fetch_org, {:ok, result}, socket) do
  {:noreply, assign(socket, :org, AsyncResult.ok(result))}
end
```

#### 4. **Streams para Listas Grandes**
```elixir
# Streams: manejo eficiente de listas grandes
def mount(_params, _session, socket) do
  {:ok, stream(socket, :messages, fetch_recent_messages())}
end

# Insertar al stream
def handle_info({:new_message, msg}, socket) do
  {:noreply, stream_insert(socket, :messages, msg)}
end

# En template
<div id="messages" phx-update="stream">
  <div :for={{dom_id, message} <- @streams.messages} id={dom_id}>
    <%= message.content %>
  </div>
</div>
```

## Phoenix Presence

### Modelo de Presencia
```elixir
# Phoenix.Presence - tracking distribuido de usuarios

defmodule MyApp.Presence do
  use Phoenix.Presence,
    otp_app: :my_app,
    pubsub_server: MyApp.PubSub
end

# En LiveView
def mount(%{"room_id" => room_id}, session, socket) do
  if connected?(socket) do
    # Track presencia
    {:ok, _} = MyApp.Presence.track(self(), "room:#{room_id}", session["user_id"], %{
      username: session["username"],
      joined_at: DateTime.utc_now()
    })
    
    # Escuchar cambios
    Phoenix.PubSub.subscribe(MyApp.PubSub, "room:#{room_id}")
  end
  
  {:ok, assign(socket, presences: MyApp.Presence.list("room:#{room_id}"))}
end

# Actualizar cuando cambia presencia
def handle_info(%Phoenix.Socket.Broadcast{event: "presence_diff", payload: diff}, socket) do
  {:noreply, assign(socket, presences: MyApp.Presence.list("room:#{socket.assigns.room_id}"))}
end
```

### Presence Diff Events
```elixir
# Eventos de presencia
%{
  joins: %{"user_1" => %{metas: [%{phx_ref: "abc", username: "Alice"}]}},
  leaves: %{"user_2" => %{metas: [%{phx_ref: "xyz", username: "Bob"}]}}
}
```

## PubSub Pattern

### Broadcast a Múltiples Clientes
```elixir
# Publicar a todos los suscritos
Phoenix.PubSub.broadcast(MyApp.PubSub, "room:123", {:new_message, message})

# Cada LiveView suscrito recibe el mensaje en handle_info/2
```

### Distribución Automática
```
Node 1 (User A, User B)    Node 2 (User C, User D)
     │                           │
     └─────── PubSub ────────────┘
           (pg, pg2, Redis)
           
# Broadcast automáticamente llega a todos los nodos
```

## 🎯 Mejoras para WhatsSound

### 1. **Streams para Cola de Reproducción**
Inspirado en LiveView Streams:
```javascript
// Implementar patrón similar para cola eficiente
class QueueStream {
  constructor() {
    this.items = new Map(); // id -> item
    this.order = []; // ids en orden
  }
  
  insert(item, position = 'append') {
    this.items.set(item.id, item);
    if (position === 'prepend') {
      this.order.unshift(item.id);
    } else if (typeof position === 'number') {
      this.order.splice(position, 0, item.id);
    } else {
      this.order.push(item.id);
    }
    
    // Solo notificar el cambio, no toda la lista
    this.notifyInsert(item, position);
  }
  
  delete(id) {
    this.items.delete(id);
    this.order = this.order.filter(i => i !== id);
    this.notifyDelete(id);
  }
  
  // El cliente solo actualiza el elemento afectado
}
```

### 2. **Async Loading Pattern**
```javascript
// Cargar datos pesados sin bloquear UI
const [roomState, setRoomState] = useState({ 
  loading: true, 
  error: null, 
  data: null 
});

useEffect(() => {
  const loadRoom = async () => {
    try {
      // Mostrar UI inmediatamente con estado loading
      const data = await fetchRoomWithHistory(roomId);
      setRoomState({ loading: false, error: null, data });
    } catch (error) {
      setRoomState({ loading: false, error, data: null });
    }
  };
  
  loadRoom();
}, [roomId]);

// Template con estados
{roomState.loading && <LoadingSpinner />}
{roomState.error && <ErrorMessage error={roomState.error} />}
{roomState.data && <RoomContent room={roomState.data} />}
```

### 3. **Presence con Metadatos Ricos**
```javascript
// Similar a Phoenix.Presence.track con metadata
await channel.track({
  user_id: userId,
  username: user.name,
  avatar_url: user.avatar,
  joined_at: new Date().toISOString(),
  // Metadata dinámica
  is_typing: false,
  current_reaction: null,
  last_activity: Date.now(),
  listening_position: null, // null si no está synced
  audio_state: 'playing' // playing | paused | buffering
});

// Actualizar solo campos específicos
async function updatePresenceField(field, value) {
  const currentPresence = channel.presenceState()[myKey];
  await channel.track({
    ...currentPresence,
    [field]: value,
    last_activity: Date.now()
  });
}
```

### 4. **PubSub Topics Granulares**
```javascript
// Inspirado en Phoenix PubSub topics
const topics = {
  roomMain: `room:${roomId}`,           // Estado general
  roomChat: `room:${roomId}:chat`,       // Solo chat
  roomQueue: `room:${roomId}:queue`,     // Cola de canciones
  roomPlayback: `room:${roomId}:playback`, // Sync de audio
  roomVotes: `room:${roomId}:votes`,     // Votaciones
  roomReactions: `room:${roomId}:reactions` // Reacciones
};

// Suscribirse solo a lo necesario
const chatChannel = supabase.channel(topics.roomChat);
const playbackChannel = supabase.channel(topics.roomPlayback);

// Publicar a topic específico
chatChannel.send({
  type: 'broadcast',
  event: 'message',
  payload: { text, userId }
});
```

### 5. **Handle Reconnection como LiveView**
```javascript
// LiveView hace mount/3 de nuevo al reconectar
// Implementar patrón similar

async function handleReconnect() {
  // 1. Re-fetch estado completo (como mount en LiveView)
  const freshState = await fetchRoomState(roomId);
  
  // 2. Re-suscribirse a canales
  await setupChannelSubscriptions();
  
  // 3. Re-track presencia
  await channel.track(getMyPresenceState());
  
  // 4. Aplicar estado fresco
  setRoomState(freshState);
  
  // 5. Re-aplicar cambios locales pendientes
  await reapplyPendingChanges();
}

channel.on('system', { event: 'reconnected' }, handleReconnect);
```

### 6. **Efficient Diffs para Updates**
```javascript
// Enviar solo cambios, no estado completo
function broadcastQueueChange(changeType, data) {
  channel.send({
    type: 'broadcast',
    event: 'queue:diff',
    payload: {
      type: changeType, // 'insert' | 'delete' | 'reorder' | 'update'
      data: data
    }
  });
}

// Recibir y aplicar diffs
channel.on('broadcast', { event: 'queue:diff' }, ({ payload }) => {
  switch (payload.type) {
    case 'insert':
      queueStream.insert(payload.data);
      break;
    case 'delete':
      queueStream.delete(payload.data.id);
      break;
    case 'reorder':
      queueStream.reorder(payload.data.fromIndex, payload.data.toIndex);
      break;
    case 'update':
      queueStream.update(payload.data.id, payload.data.changes);
      break;
  }
});
```

## Conceptos Clave de LiveView para WhatsSound

| Concepto LiveView | Aplicación WhatsSound |
|-------------------|----------------------|
| mount/3 | Inicialización de room |
| handle_event/3 | Acciones del usuario |
| handle_info/2 | Mensajes de otros usuarios |
| Streams | Cola de reproducción |
| Presence | Usuarios en room |
| PubSub | Canales de Supabase |
| Async assigns | Carga de datos pesados |

## Referencias
- [Phoenix LiveView Docs](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html)
- [Phoenix Presence](https://hexdocs.pm/phoenix/Phoenix.Presence.html)
- [Phoenix PubSub](https://hexdocs.pm/phoenix_pubsub/Phoenix.PubSub.html)
