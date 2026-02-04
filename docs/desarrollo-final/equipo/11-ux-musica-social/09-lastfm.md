# Last.fm - Music Discovery UX

## 🎯 Perfil

**Plataforma:** Last.fm  
**Especialización:** Scrobbling (tracking), estadísticas musicales, descubrimiento  
**Historia:** Pionero del social music (2002), ahora parte de CBS Interactive  
**Propuesta:** "Music Counts" - Track, Find, Rediscover  

---

## 📐 Patrones de Diseño Clave

### 1. Scrobbling (Auto-Track)
- Tracking pasivo de todo lo escuchado
- Integración con múltiples servicios
- Historial completo de escucha

### 2. Estadísticas Profundas
- Weekly/Monthly/Yearly reports
- Top artists, albums, tracks
- Listening time metrics
- Charts personalizados

### 3. Music DNA / Taste Profile
- Análisis de gustos
- Tags y géneros preferidos
- Evolución temporal de gustos

### 4. Discovery Engine
- Recommendations basadas en historial
- Similar artists
- Next_30 playlist (nuevo descubrimiento)
- Radio personalizada

### 5. Social Listening
- Ver qué escuchan amigos
- Comparar compatibilidad musical
- Neighbours (usuarios con gustos similares)

### 6. Rediscovery
- "On this day" memories
- Forgotten favorites
- Listening history completo

---

## 🎵 Principios UX para Audio/Música

1. **Data as Value**: Las estadísticas son el producto
2. **Passive Tracking**: No requiere acción del usuario
3. **Long-term Memory**: Años de historial disponible
4. **Compatibility Metric**: Cuantificar afinidad musical
5. **Nostalgia Engine**: Redescubrir el pasado

---

## 💡 Mejoras Propuestas para WhatsSound

### 1. Scrobbling Social

**Auto-track de música compartida:**
```
📊 Tu historial de shares:

Esta semana:
├── 12 canciones compartidas
├── 8 géneros diferentes  
├── Top: Rock (45%)
└── Más compartida: "Song X" (a 5 personas)

Este mes:
├── 47 canciones
├── 23 artistas únicos
└── Conexión más activa: @maría (15 shares)
```

### 2. Compatibility Score

```
┌─────────────────────────────────────┐
│ 🎵 Tu compatibilidad con @carlos    │
│ ═══════════════════════════════════ │
│                                     │
│        ████████████░░░░  78%        │
│                                     │
│ Artistas en común: 23               │
│ Géneros match: Rock, Indie, Alt     │
│ Canción puente: "Song X"            │
│                                     │
│ 💡 "Quizás te guste lo que Carlos   │
│    escucha de [Artist Y]"           │
│                                     │
│ [🎧 Blend playlist] [📊 Más stats]  │
└─────────────────────────────────────┘
```

### 3. Weekly Report

```
📧 Tu semana musical en WhatsSound

📊 RESUMEN
├── 15 canciones compartidas
├── 8 reacciones recibidas
├── 2 nuevas conexiones musicales
└── Mood dominante: Energético 🔥

🏆 TOP SHARE
"Song X" - Artist
Compartida 3 veces, 5 reacciones

🔗 MEJOR CONEXIÓN
@maría - 6 intercambios esta semana
Compatibilidad: 82% (+4%)

💡 DESCUBRIMIENTO
Basado en tus shares, quizás te guste:
[Artist A] • [Artist B] • [Artist C]

🗓️ ON THIS DAY (hace 1 año)
Compartiste "Song Y" con @pedro
```

### 4. Listening History Timeline

```
📅 2025

Enero ████████████░░░░ 156 shares
├── Top: Arctic Monkeys
├── Mood: Melancólico → Energético
└── Highlight: Discovered [Artist]

Febrero ████████░░░░░░░░ 98 shares
...
```

### 5. "Super Listener" Neighbours

**Encontrar almas gemelas musicales:**
```
👥 Neighbours (90%+ compatibility)

1. @music_lover_madrid (94%)
   └── 45 artistas en común
   └── También ama: Post-punk, Synthwave
   
2. @indie_dreams (91%)
   └── 38 artistas en común
   └── "Oye, escuchamos casi lo mismo!"
   
[💬 Connect] [🎧 Listen to their recent]
```

### 6. Rediscovery Engine

**"Tesoros olvidados":**
```
🎵 Hace 6 meses compartías mucho a [Artist]
   Últimamente no tanto... ¿Los recordamos?
   
   [▶️ Play their best] [👋 Skip]

📅 On This Day:
   "Song X" compartida con @friend hace 1 año
   [🔄 Re-share con memoria]
```

### 7. Tags y Moods

Usuarios pueden taggear sus shares:
- #workout #chill #roadtrip #late-night
- Filtrar shares por mood/contexto
- "Shows me @carlos's chill recommendations"

---

## 📊 Stats Dashboard

```
┌─────────────────────────────────────────────┐
│            TU WHATSSOUND STATS              │
├─────────────────────────────────────────────┤
│                                             │
│  📈 ALL TIME                                │
│  ├── 1,247 canciones compartidas           │
│  ├── 342 artistas únicos                   │
│  ├── 89 conexiones musicales               │
│  └── 45,678 minutos de música compartida   │
│                                             │
│  🎯 TU MUSICAL DNA                          │
│  ┌────────────────────────────────┐        │
│  │ Rock      ██████████░░ 45%    │        │
│  │ Indie     ████████░░░░ 30%    │        │
│  │ Electronic████░░░░░░░░ 15%    │        │
│  │ Pop       ██░░░░░░░░░░ 10%    │        │
│  └────────────────────────────────┘        │
│                                             │
│  🏆 ACHIEVEMENTS                            │
│  [🎸 Rock Expert] [🌙 Night Owl]           │
│  [🤝 Connector] [🔮 Trend Spotter]         │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔗 Referencias

- [Last.fm](https://www.last.fm/)
- [Last.fm API](https://www.last.fm/api)
- Caso de estudio: De social music pioneer a data platform
