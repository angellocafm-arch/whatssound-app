# Martin Kleppmann - Distributed Systems & CRDTs

## Perfil
- **Rol**: Investigador en Distributed Systems (Cambridge)
- **Expertise**: CRDTs, Replicación, Consistencia eventual
- **Impacto**: Automerge, "Designing Data-Intensive Applications"

## CRDTs: The Hard Parts

### ¿Qué son los CRDTs?
```
Conflict-free Replicated Data Types (CRDTs):
- Estructuras de datos replicadas
- Actualizaciones concurrentes sin coordinación
- Merge automático de inconsistencias
- Convergencia eventual garantizada

Propiedades matemáticas:
- Conmutatividad: A ∘ B = B ∘ A
- Asociatividad: (A ∘ B) ∘ C = A ∘ (B ∘ C)
- Idempotencia: A ∘ A = A
```

### Tipos Básicos de CRDTs

#### 1. G-Counter (Grow-only Counter)
```javascript
// Cada nodo mantiene su propio contador
// Merge = sumar todos los contadores

class GCounter {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.counts = {}; // nodeId -> count
  }
  
  increment() {
    this.counts[this.nodeId] = (this.counts[this.nodeId] || 0) + 1;
  }
  
  value() {
    return Object.values(this.counts).reduce((a, b) => a + b, 0);
  }
  
  merge(other) {
    for (const [node, count] of Object.entries(other.counts)) {
      this.counts[node] = Math.max(this.counts[node] || 0, count);
    }
  }
}
```

#### 2. PN-Counter (Positive-Negative Counter)
```javascript
// Dos G-Counters: uno para incrementos, uno para decrementos
class PNCounter {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.p = {}; // positive
    this.n = {}; // negative
  }
  
  increment() {
    this.p[this.nodeId] = (this.p[this.nodeId] || 0) + 1;
  }
  
  decrement() {
    this.n[this.nodeId] = (this.n[this.nodeId] || 0) + 1;
  }
  
  value() {
    const pos = Object.values(this.p).reduce((a, b) => a + b, 0);
    const neg = Object.values(this.n).reduce((a, b) => a + b, 0);
    return pos - neg;
  }
  
  merge(other) {
    for (const [node, count] of Object.entries(other.p)) {
      this.p[node] = Math.max(this.p[node] || 0, count);
    }
    for (const [node, count] of Object.entries(other.n)) {
      this.n[node] = Math.max(this.n[node] || 0, count);
    }
  }
}
```

#### 3. LWW-Register (Last-Writer-Wins)
```javascript
// Registro con timestamp - el más reciente gana
class LWWRegister {
  constructor() {
    this.value = null;
    this.timestamp = 0;
    this.nodeId = null;
  }
  
  set(value, timestamp, nodeId) {
    if (timestamp > this.timestamp || 
        (timestamp === this.timestamp && nodeId > this.nodeId)) {
      this.value = value;
      this.timestamp = timestamp;
      this.nodeId = nodeId;
    }
  }
  
  get() {
    return this.value;
  }
  
  merge(other) {
    if (other.timestamp > this.timestamp ||
        (other.timestamp === this.timestamp && other.nodeId > this.nodeId)) {
      this.value = other.value;
      this.timestamp = other.timestamp;
      this.nodeId = other.nodeId;
    }
  }
}
```

#### 4. OR-Set (Observed-Remove Set)
```javascript
// Set donde adds y removes pueden ser concurrentes
class ORSet {
  constructor() {
    this.elements = new Map(); // element -> Set<unique_tag>
    this.tombstones = new Set(); // removed tags
  }
  
  add(element, tag) {
    if (!this.elements.has(element)) {
      this.elements.set(element, new Set());
    }
    this.elements.get(element).add(tag);
  }
  
  remove(element) {
    if (this.elements.has(element)) {
      // Tombstone all current tags
      for (const tag of this.elements.get(element)) {
        this.tombstones.add(tag);
      }
      this.elements.delete(element);
    }
  }
  
  has(element) {
    if (!this.elements.has(element)) return false;
    // Element exists if has any non-tombstoned tag
    for (const tag of this.elements.get(element)) {
      if (!this.tombstones.has(tag)) return true;
    }
    return false;
  }
  
  merge(other) {
    // Merge tags
    for (const [element, tags] of other.elements) {
      if (!this.elements.has(element)) {
        this.elements.set(element, new Set());
      }
      for (const tag of tags) {
        if (!this.tombstones.has(tag)) {
          this.elements.get(element).add(tag);
        }
      }
    }
    // Merge tombstones
    for (const tag of other.tombstones) {
      this.tombstones.add(tag);
    }
  }
}
```

### Problemas Difíciles de CRDTs

#### 1. Interleaving Anomaly
```
Problema en text CRDTs:

User A types: "Hello"
User B types: "World" (concurrentemente)

Resultado indeseado posible: "HWeolrllod"

Solución: Algoritmos como RGA que preservan intención
```

#### 2. Moving Elements in Lists
```
Problema:
- User A mueve item X de posición 1 a 5
- User B mueve item X de posición 1 a 3 (concurrentemente)

¿Dónde queda X?

Kleppmann propuso soluciones en "Moving Elements in List CRDTs"
```

#### 3. Metadata Overhead
```
Problema: CRDTs pueden acumular metadata significativa

Solución de Kleppmann (Automerge):
- Columnar encoding para comprimir
- Garbage collection de tombstones
- Binary format optimizado
```

## Local-First Software

### Principios
```
1. Data ownership: Usuario es dueño de sus datos
2. Offline-first: Funciona sin conexión
3. Real-time sync: Cuando hay conexión, sync automático
4. Longevity: Datos accesibles aunque servicio muera

Implementación:
- Datos en cliente (IndexedDB, SQLite)
- Sync vía CRDTs cuando online
- Server es optional para backup/collaboration
```

## 🎯 Mejoras para WhatsSound

### 1. **PN-Counter para Votos**
```javascript
// Votos como PN-Counter: upvote (+) y downvote (-)
class SongVoteCounter {
  constructor(songId, userId) {
    this.songId = songId;
    this.userId = userId;
    this.upvotes = {};   // userId -> count
    this.downvotes = {}; // userId -> count
  }
  
  upvote() {
    this.upvotes[this.userId] = (this.upvotes[this.userId] || 0) + 1;
  }
  
  downvote() {
    this.downvotes[this.userId] = (this.downvotes[this.userId] || 0) + 1;
  }
  
  removeVote() {
    // Incrementar el opuesto para "cancelar"
    if (this.hasUpvoted()) {
      this.downvotes[this.userId] = (this.downvotes[this.userId] || 0) + 1;
    } else if (this.hasDownvoted()) {
      this.upvotes[this.userId] = (this.upvotes[this.userId] || 0) + 1;
    }
  }
  
  score() {
    const up = Object.keys(this.upvotes).length;
    const down = Object.keys(this.downvotes).length;
    return up - down;
  }
  
  merge(other) {
    // Merge upvotes
    for (const [user, count] of Object.entries(other.upvotes)) {
      this.upvotes[user] = Math.max(this.upvotes[user] || 0, count);
    }
    // Merge downvotes
    for (const [user, count] of Object.entries(other.downvotes)) {
      this.downvotes[user] = Math.max(this.downvotes[user] || 0, count);
    }
  }
}
```

### 2. **LWW-Register para Playback State**
```javascript
// Estado de reproducción con last-writer-wins
class PlaybackState {
  constructor() {
    this.position = { value: 0, timestamp: 0, nodeId: null };
    this.isPlaying = { value: false, timestamp: 0, nodeId: null };
    this.currentSong = { value: null, timestamp: 0, nodeId: null };
  }
  
  setPosition(pos, nodeId) {
    const ts = Date.now();
    if (ts > this.position.timestamp || 
        (ts === this.position.timestamp && nodeId > this.position.nodeId)) {
      this.position = { value: pos, timestamp: ts, nodeId };
    }
  }
  
  setPlaying(playing, nodeId) {
    const ts = Date.now();
    if (ts > this.isPlaying.timestamp) {
      this.isPlaying = { value: playing, timestamp: ts, nodeId };
    }
  }
  
  merge(other) {
    // Merge cada registro
    if (other.position.timestamp > this.position.timestamp) {
      this.position = other.position;
    }
    if (other.isPlaying.timestamp > this.isPlaying.timestamp) {
      this.isPlaying = other.isPlaying;
    }
    if (other.currentSong.timestamp > this.currentSong.timestamp) {
      this.currentSong = other.currentSong;
    }
  }
}
```

### 3. **OR-Set para Cola de Canciones**
```javascript
// Cola como OR-Set: permite add y remove concurrentes
class QueueORSet {
  constructor(userId) {
    this.userId = userId;
    this.songs = new Map();      // songId -> Set<{tag, addedBy, addedAt}>
    this.tombstones = new Set(); // removed tags
    this.tagCounter = 0;
  }
  
  generateTag() {
    return `${this.userId}-${++this.tagCounter}-${Date.now()}`;
  }
  
  add(song) {
    const tag = this.generateTag();
    if (!this.songs.has(song.id)) {
      this.songs.set(song.id, new Set());
    }
    this.songs.get(song.id).add({
      tag,
      addedBy: this.userId,
      addedAt: Date.now(),
      song
    });
    return tag;
  }
  
  remove(songId) {
    if (this.songs.has(songId)) {
      for (const entry of this.songs.get(songId)) {
        this.tombstones.add(entry.tag);
      }
    }
  }
  
  getSongs() {
    const result = [];
    for (const [songId, entries] of this.songs) {
      for (const entry of entries) {
        if (!this.tombstones.has(entry.tag)) {
          result.push(entry);
        }
      }
    }
    // Ordenar por tiempo de agregado
    return result.sort((a, b) => a.addedAt - b.addedAt);
  }
  
  merge(other) {
    // Merge songs
    for (const [songId, entries] of other.songs) {
      if (!this.songs.has(songId)) {
        this.songs.set(songId, new Set());
      }
      for (const entry of entries) {
        if (!this.tombstones.has(entry.tag) && !other.tombstones.has(entry.tag)) {
          this.songs.get(songId).add(entry);
        }
      }
    }
    // Merge tombstones
    for (const tag of other.tombstones) {
      this.tombstones.add(tag);
    }
  }
}
```

### 4. **Local-First para Offline**
```javascript
// Patrón local-first para WhatsSound
class LocalFirstRoom {
  constructor(roomId, userId) {
    this.roomId = roomId;
    this.userId = userId;
    
    // Estado local (CRDT)
    this.state = {
      queue: new QueueORSet(userId),
      votes: new Map(), // songId -> SongVoteCounter
      playback: new PlaybackState()
    };
    
    // Pendientes para sync
    this.pendingOperations = [];
  }
  
  // Operaciones locales (siempre funcionan)
  addToQueue(song) {
    const op = { type: 'add', song, timestamp: Date.now() };
    this.state.queue.add(song);
    this.pendingOperations.push(op);
    this.trySync();
  }
  
  vote(songId, value) {
    if (!this.state.votes.has(songId)) {
      this.state.votes.set(songId, new SongVoteCounter(songId, this.userId));
    }
    const counter = this.state.votes.get(songId);
    value > 0 ? counter.upvote() : counter.downvote();
    
    this.pendingOperations.push({ type: 'vote', songId, value, timestamp: Date.now() });
    this.trySync();
  }
  
  // Sync cuando hay conexión
  async trySync() {
    if (!navigator.onLine) return;
    
    try {
      // Enviar operaciones pendientes
      for (const op of this.pendingOperations) {
        await this.sendOperation(op);
      }
      this.pendingOperations = [];
      
      // Recibir estado remoto y merge
      const remoteState = await this.fetchRemoteState();
      this.merge(remoteState);
    } catch (e) {
      // Retry later
      console.log('Sync failed, will retry');
    }
  }
  
  merge(remoteState) {
    this.state.queue.merge(remoteState.queue);
    for (const [songId, counter] of remoteState.votes) {
      if (!this.state.votes.has(songId)) {
        this.state.votes.set(songId, new SongVoteCounter(songId, this.userId));
      }
      this.state.votes.get(songId).merge(counter);
    }
    this.state.playback.merge(remoteState.playback);
  }
}
```

### 5. **Vector Clocks para Causalidad**
```javascript
// Detectar y ordenar eventos concurrentes
class VectorClock {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.clock = {};
  }
  
  tick() {
    this.clock[this.nodeId] = (this.clock[this.nodeId] || 0) + 1;
    return { ...this.clock };
  }
  
  update(other) {
    for (const [node, time] of Object.entries(other)) {
      this.clock[node] = Math.max(this.clock[node] || 0, time);
    }
    this.tick();
  }
  
  compare(other) {
    let dominated = true;
    let dominates = true;
    
    const allNodes = new Set([...Object.keys(this.clock), ...Object.keys(other)]);
    
    for (const node of allNodes) {
      const mine = this.clock[node] || 0;
      const theirs = other[node] || 0;
      
      if (mine < theirs) dominates = false;
      if (mine > theirs) dominated = false;
    }
    
    if (dominates && !dominated) return 1;  // this > other
    if (dominated && !dominates) return -1; // this < other
    if (dominates && dominated) return 0;   // equal
    return null; // concurrent!
  }
}

// Uso: detectar si eventos son concurrentes
const vc1 = new VectorClock('user-1');
const vc2 = new VectorClock('user-2');

const event1 = { type: 'vote', clock: vc1.tick() };
const event2 = { type: 'vote', clock: vc2.tick() };

const relation = vc1.compare(event2.clock);
if (relation === null) {
  console.log('Events are concurrent - need merge strategy');
}
```

## Lecciones de Kleppmann

1. **CRDTs no son magia**: Tienen overhead y edge cases
2. **Simplicidad cuando posible**: LWW-Register es suficiente para muchos casos
3. **Local-first es el futuro**: Mejor UX con datos locales
4. **El server puede simplificar**: Si tienes servidor central, no necesitas full CRDT
5. **Intención del usuario**: El merge debe preservar lo que el usuario quiso hacer

## Referencias
- [CRDTs: The Hard Parts (video)](https://www.youtube.com/watch?v=PMVBuMK_pJY)
- [Local-first software](https://www.inkandswitch.com/local-first.html)
- [Designing Data-Intensive Applications (book)](https://dataintensive.net/)
- [Automerge](https://automerge.org/)
