# Reunión 6: EXTRAS Y AJUSTES — 9 Pantallas

**Fecha:** 3 Feb 2026

## 👥 Participantes
- 01-Arquitecto Frontend
- 05-Experto Mobile
- 14-PWA Offline
- 07-CraftMaster (Producto)

---

## 🎯 ESPECIFICACIONES FINALES

### 2.4 Escanear QR
```
Acceso: Botón QR en header de "En Vivo"
Permisos: Cámara (pedir en contexto)
UI: Viewfinder con marco, flash toggle
Resultado: 
  - QR válido → preview sesión + "Unirse"
  - QR inválido → error message
Librería: expo-camera + expo-barcode-scanner
```

### 5.2 Deep Link Landing (Web)
```
URL: whatssound.app/join/[session-id]
Contenido:
  - Logo WhatsSound
  - Info sesión (DJ, género, oyentes)
  - Botón "Abrir en WhatsSound" (deep link)
  - Botón "Descargar App" (App Store / Play Store)
  - Preview embed (si web player disponible)
Fallback: Si no tiene app → store links
```

### 6.11 Editar Perfil
```
Acceso: Perfil → Editar
Campos editables:
  - Avatar (camera/gallery)
  - Display name
  - Username (con validación único)
  - Bio (max 150 chars)
  - Links sociales (Instagram, Twitter, Spotify)
Guardar: Botón "Guardar cambios"
Validación: Real-time en username
```

### 6.12 Perfil DJ Público
```
Acceso: Tap en DJ desde cualquier lugar
Contenido:
  - Header con avatar grande + nombre + verificado
  - Bio
  - Stats: sesiones totales, oyentes únicos, rating
  - Géneros que pincha
  - Próximas sesiones programadas
  - Historial de sesiones pasadas (últimas 10)
  - Botón "Seguir" / "Siguiendo"
  - Botón "Enviar mensaje"
```

### 9.1 Historial de Sesiones
```
Acceso: Perfil → Historial
Lista de sesiones pasadas:
  - Como oyente
  - Como DJ (si aplica)
Por sesión:
  - Fecha + duración
  - DJ + nombre sesión
  - Canciones que pediste/votaste
  - Propinas enviadas
Filtros: Por rol, por fecha
```

### 9.2 Favoritos/Guardados
```
Acceso: Perfil → Guardados
Tabs: Canciones | Sesiones | DJs
Canciones: Las que votaste o pediste
Sesiones: Las que marcaste como favorita
DJs: Los que sigues
Acciones: Tap → ir al detalle, swipe → quitar
```

### 9.3 Audio en Directo (Walkie-Talkie)
```
⚠️ POST-MVP — No incluir en v3
Requiere: WebRTC avanzado, permisos micrófono
Complejidad: Alta
Prioridad: Baja para inversores
```

### 9.4 Error/Sin Conexión
```
Trigger: Pérdida de conexión detectada
UI:
  - Icono de nube tachada
  - "Sin conexión a Internet"
  - "Comprueba tu conexión y vuelve a intentarlo"
  - Botón "Reintentar"
Comportamiento:
  - Auto-retry cada 5 segundos
  - Mantener último estado en cache
  - Notificar cuando vuelve conexión
```

### 9.5 Actualización Requerida
```
Trigger: API version mismatch
UI:
  - Icono de descarga
  - "Nueva versión disponible"
  - "Actualiza para seguir usando WhatsSound"
  - Botón "Actualizar ahora" → Store
Comportamiento:
  - Bloquea uso de la app
  - No se puede dismiss
  - Force update desde config remota
```

---

## 📊 PRIORIZACIÓN FINAL

| Pantalla | Prioridad | Para Demo Inversores |
|----------|-----------|---------------------|
| Escanear QR | Media | Sí |
| Deep Link Landing | Alta | Sí |
| Editar Perfil | Alta | Sí |
| Perfil DJ Público | Alta | Sí |
| Historial Sesiones | Media | Opcional |
| Favoritos | Baja | No |
| Walkie-Talkie | POST-MVP | No |
| Error/Sin Conexión | Alta | Sí |
| Actualización Requerida | Media | No |

---

## 🛠️ Dependencias
```bash
npm install expo-camera
npm install expo-barcode-scanner
npm install @react-native-community/netinfo
```
