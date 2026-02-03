# Reunión 2: SESIÓN USUARIO — 4 Pantallas

**Fecha:** 3 Feb 2026

## 👥 Participantes
- 01-Arquitecto Frontend
- 07-CraftMaster (Producto)
- 10-Audio Streaming
- 03-Experto Realtime

---

## 🎯 ESPECIFICACIONES FINALES

### 3.5 Pedir Canción (Modal)
```
Trigger: Botón "+" en cola o FAB
Búsqueda: Deezer API (ya integrada)
Preview: 30s al seleccionar (opcional)
Campos:
  - Input búsqueda con debounce 300ms
  - Lista resultados con artwork, título, artista
  - Botón "Pedir" por canción
Confirmación: Toast "Canción añadida a la cola"
```

### 3.6 Detalle de Canción
```
Trigger: Tap en canción de la cola
Contenido:
  - Artwork grande (200x200)
  - Título + Artista + Álbum
  - Quién la pidió + cuándo
  - Votos actuales
  - Botón "Votar" (si no ha votado)
  - Botón "Abrir en Spotify/Deezer" (deep link)
Animación: Slide up modal
```

### 3.7 Perfil de Usuario (Modal)
```
Trigger: Tap en avatar en chat o lista gente
Contenido:
  - Avatar + Username + Bio
  - Badge si es DJ/VIP/MOD
  - Stats: sesiones, canciones pedidas
  - Acciones: Mensaje privado, Seguir, Reportar
Diseño: Bottom sheet 60% altura
```

### 3.8 Reacciones Expandidas
```
Trigger: Long press en botón reacción
Reacciones: 🔥 ❤️ 👏 😂 🎵 + 5 más
Animación: Burbujas flotantes hacia arriba
Duración animación: 2s
Contador: Muestra total por tipo en tiempo real
```

---

## 🛠️ Dependencias
- Deezer API (ya integrada)
- Supabase Realtime para votos
- react-native-bottom-sheet
