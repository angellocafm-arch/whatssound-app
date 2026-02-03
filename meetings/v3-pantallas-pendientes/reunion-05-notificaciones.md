# Reunión 5: NOTIFICACIONES — 2 Pantallas

**Fecha:** 3 Feb 2026

## 👥 Participantes
- 13-Notificaciones Engagement
- 05-Experto Mobile
- 01-Arquitecto Frontend

---

## 🎯 ESPECIFICACIONES FINALES

### 8.1 Centro de Notificaciones
```
Acceso: Icono campana en header (badge con contador)
Agrupación por tipo:
  - 🎵 Sesiones (DJ que sigues empezó, invitación)
  - 💬 Social (mensaje privado, mención, nuevo seguidor)
  - 🔥 Actividad (tu canción fue votada, propina recibida)
  - 📢 Sistema (actualizaciones, promociones)
Por cada notificación:
  - Icono tipo
  - Título + descripción
  - Timestamp relativo
  - Indicador leída/no leída
Acciones:
  - Tap → navega al contenido
  - Swipe izq → marcar leída
  - Swipe der → eliminar
Botón: "Marcar todas como leídas"
```

### 8.2 Invitación a Sesión
```
Trigger: Push notification + in-app
Contenido:
  - Avatar DJ
  - "[DJ Name] te invita a su sesión"
  - Nombre sesión + género
  - Preview: canción actual (si hay)
  - Oyentes actuales
Acciones:
  - "Unirse" → abre sesión
  - "Más tarde" → dismiss
  - "No molestar de [DJ]" → silenciar
Deep link: whatssound://session/[id]
```

---

## 🛠️ Dependencias
```bash
npm install expo-notifications
# Configurar Firebase Cloud Messaging
# Configurar APNs para iOS
```

### Tabla Supabase
- Nueva: `ws_notifications` (id, user_id, type, title, body, data, read, created_at)
- Trigger: Insertar notificación → Edge Function → Push via Expo
