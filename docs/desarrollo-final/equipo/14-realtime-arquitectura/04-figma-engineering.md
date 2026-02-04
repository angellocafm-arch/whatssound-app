# Figma Engineering - Multiplayer Collaboration

## Perfil
- **Producto**: Herramienta de diseño colaborativo real-time
- **Stack**: Rust (servers), WebAssembly, WebSockets
- **Innovación**: Sistema propio inspirado en CRDTs sin usarlos completamente

## Arquitectura de Figma

### Modelo Cliente-Servidor
```
┌─────────────┐     WebSocket      ┌─────────────────┐
│   Client    │───────────────────▶│   Multiplayer   │
│   (Web)     │◀───────────────────│   Server        │
└─────────────┘    Diffs/Updates   │   (per doc)     │
      │                            └─────────────────┘
      │                                    │
      │  1. Download inicial               │
      │  2. Updates bidireccionales        │
      │  3. Offline → reconecta + reaplica │
      │                                    │
      │                            ┌───────▼───────┐
      │                            │   Document    │
      └────────────────────────────│   Storage     │
                                   └───────────────┘
```

### Estructura de un Documento Figma
```
Document = Tree de Objects (similar a HTML DOM)

Root
 ├── Page 1
 │    ├── Frame
 │    │    ├── Rectangle
 │    │    └── Text
 │    └── Component
 └── Page 2
      └── ...

Internamente: Map<ObjectID, Map<Property, Value>>
```

### Por qué NO OTs (Operational Transforms)
- **Complejidad**: Explosión combinatoria de estados posibles
- **Overkill**: Figma no es un editor de texto
- **Difícil**: De implementar correctamente y debuggear

### Por qué CRDTs (parcialmente)
- **Propiedades matemáticas**: Garantizan eventual consistency
- **Simplificación**: Al tener servidor central, pueden relajar requisitos
- **Base sólida**: Intuición para diseñar sistema correcto

## Sistema de Sincronización

### Last-Writer-Wins por Propiedad
```javascript
// Conflicto solo si 2 clientes cambian MISMA propiedad del MISMO objeto
// Resolución: último en llegar al servidor gana

// NO conflicto:
// - Cambiar diferentes propiedades del mismo objeto
// - Cambiar misma propiedad de diferentes objetos

// Ejemplo:
// User A: cambia rectangle.width
// User B: cambia rectangle.height
// → Ambos se aplican, no hay conflicto
```

### Manejo de Conflictos en Cliente
```javascript
// Problema: "Flickering" cuando cambios locales son sobrescritos
// por ACKs tardíos del servidor

// Solución: Mostrar la mejor predicción del estado final

// 1. Aplicar cambios locales inmediatamente (responsividad)
// 2. Descartar updates del servidor que conflicten con
//    cambios locales no-acknowledgeados
// 3. Razón: nuestro cambio es más reciente que lo del servidor
```

### Atomic Property Changes
```javascript
// Cambios son atómicos a nivel de VALOR de propiedad
// El valor final siempre es de UN cliente

// Implicación para texto:
// Si texto es "B"
// User A cambia a "AB"
// User B cambia a "BC" (simultáneamente)
// Resultado: "AB" o "BC", nunca "ABC"

// Por eso Figma NO es ideal para edición de texto colaborativa
// (pero está bien para diseño!)
```

## Object IDs Únicos
```javascript
// Cada cliente tiene un unique client ID
// Object IDs incluyen el client ID
// → Garantiza unicidad sin coordinación

const newObjectId = `${clientId}-${localCounter++}`;
```

## Creación y Eliminación de Objetos
- **Creación**: Acción explícita (no auto-crear por escribir a ID inexistente)
- **Eliminación**: Borra todos los datos del objeto del servidor
- **Undo**: Cliente que eliminó es responsable de restaurar propiedades

## 🎯 Mejoras para WhatsSound

### 1. **Estado de Room como Documento**
Inspirado en la estructura de Figma:
```javascript
// Room como árbol de objetos
const roomDocument = {
  root: {
    id: 'room-123',
    type: 'room',
    properties: {
      name: 'Friday Vibes',
      hostId: 'user-456',
      theme: 'dark'
    }
  },
  queue: {
    id: 'queue-123',
    type: 'queue',
    parent: 'room-123',
    properties: {
      currentIndex: 2,
      isPlaying: true
    }
  },
  songs: [
    {
      id: 'song-1',
      type: 'song',
      parent: 'queue-123',
      properties: {
        spotifyId: 'abc',
        addedBy: 'user-789',
        votes: 5
      }
    }
  ]
};
```

### 2. **Last-Writer-Wins para Votos**
```javascript
// Cada voto es una propiedad única
// user-123:vote-song-456 → { value: 1, timestamp: ... }

async function vote(songId, value) {
  const voteKey = `${userId}:vote:${songId}`;
  
  // Aplicar localmente primero
  setLocalVote(voteKey, value);
  
  // Sync con servidor
  await channel.track({
    [voteKey]: { value, timestamp: Date.now() }
  });
  
  // Server reconcilia con last-writer-wins
}
```

### 3. **Sync Selectivo de Propiedades**
```javascript
// No sync TODO el estado, solo deltas de propiedades cambiadas

// En lugar de:
channel.send({ type: 'broadcast', event: 'room:state', payload: entireRoomState });

// Hacer:
channel.send({ 
  type: 'broadcast', 
  event: 'property:change', 
  payload: { 
    objectId: 'queue-123',
    property: 'currentIndex',
    value: 3,
    timestamp: Date.now()
  }
});
```

### 4. **Offline-First con Rebase**
```javascript
// Inspirado en cómo Figma maneja offline

class OfflineManager {
  pendingChanges = [];
  
  async applyChange(change) {
    // 1. Aplicar localmente
    this.applyLocally(change);
    
    // 2. Si offline, guardar
    if (!isConnected) {
      this.pendingChanges.push(change);
      await this.persistToIndexedDB(change);
      return;
    }
    
    // 3. Si online, enviar
    await this.syncToServer(change);
  }
  
  async onReconnect() {
    // 1. Descargar estado actual del servidor
    const serverState = await fetchRoomState();
    
    // 2. Rebase cambios locales sobre estado del servidor
    for (const change of this.pendingChanges) {
      const rebased = this.rebaseChange(change, serverState);
      await this.syncToServer(rebased);
    }
    
    // 3. Limpiar pending
    this.pendingChanges = [];
    await this.clearIndexedDB();
  }
}
```

### 5. **Prevención de Flickering**
```javascript
// Mantener registro de cambios unacknowledged

const unacknowledgedChanges = new Map();

function applyLocalChange(objectId, property, value) {
  const key = `${objectId}:${property}`;
  unacknowledgedChanges.set(key, { value, timestamp: Date.now() });
  
  // Aplicar a UI
  updateUI(objectId, property, value);
  
  // Enviar a servidor
  sendChange(objectId, property, value);
}

function handleServerUpdate(update) {
  const key = `${update.objectId}:${update.property}`;
  
  // Si tenemos un cambio local pendiente, ignorar update del server
  if (unacknowledgedChanges.has(key)) {
    const local = unacknowledgedChanges.get(key);
    if (local.timestamp > update.serverTimestamp) {
      // Nuestro cambio es más reciente, ignorar
      return;
    }
  }
  
  // Aplicar update del servidor
  updateUI(update.objectId, update.property, update.value);
}

function handleAck(objectId, property) {
  const key = `${objectId}:${property}`;
  unacknowledgedChanges.delete(key);
}
```

### 6. **Object IDs para Songs y Votes**
```javascript
// Generar IDs únicos sin colisión
const clientId = crypto.randomUUID().slice(0, 8);
let counter = 0;

function generateId(type) {
  return `${type}-${clientId}-${counter++}`;
}

// Uso:
const songId = generateId('song'); // "song-a1b2c3d4-0"
const voteId = generateId('vote'); // "vote-a1b2c3d4-1"
```

## Lecciones Clave de Figma
1. **Simplicidad > Complejidad**: No usar OTs si no necesitas
2. **Servidor es autoridad**: Simplifica mucho vs sistemas peer-to-peer
3. **Granularidad correcta**: Conflictos a nivel de propiedad, no objeto completo
4. **Predecir estado final**: Mostrar lo más probable, no lo confirmado
5. **Offline primero**: Diseñar para desconexión desde el inicio

## Referencias
- [How Figma's Multiplayer Technology Works](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)
- [Rust in Production at Figma](https://www.figma.com/blog/rust-in-production-at-figma/)
- [Multiplayer Editing in Figma](https://www.figma.com/blog/multiplayer-editing-in-figma/)
