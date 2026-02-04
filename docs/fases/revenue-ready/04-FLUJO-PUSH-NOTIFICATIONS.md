# 🔔 Flujo Push Notifications — Especificación Visual

## Tipos de Push

| Tipo | Trigger | Destinatario |
|------|---------|--------------|
| DJ en vivo | DJ inicia sesión | Seguidores del DJ |
| Propina recibida | Pago confirmado | DJ |
| Mención en chat | Mensaje con @usuario | Usuario mencionado |
| Golden Boost recibido | Boost confirmado | DJ |
| Boost disponible | Domingo medianoche | Todos los usuarios |

---

## Push 1: DJ en Vivo

### Trigger
DJ hace click en "Iniciar Sesión"

### Preview en móvil

```
┌─────────────────────────────────────────┐
│ 🎵 WhatsSound                     now   │
├─────────────────────────────────────────┤
│                                         │
│  📺 DJ Carlos Madrid está en vivo!      │
│                                         │
│  Únete a "Viernes Latino 🔥" ahora      │
│  45 personas escuchando                 │
│                                         │
└─────────────────────────────────────────┘
```

### Datos

```typescript
{
  type: 'dj_live',
  title: 'DJ Carlos Madrid está en vivo!',
  body: 'Únete a "Viernes Latino 🔥" ahora',
  data: {
    sessionId: 'session-uuid',
    djId: 'dj-uuid',
    action: 'open_session'
  }
}
```

### Acción al tap
Abrir `/session/[sessionId]`

---

## Push 2: Propina Recibida

### Trigger
Admin confirma propina en Simulator

### Preview en móvil

```
┌─────────────────────────────────────────┐
│ 💰 WhatsSound                     now   │
├─────────────────────────────────────────┤
│                                         │
│  ¡Nueva propina! 🎉                     │
│                                         │
│  @mariagarcia te envió €5.00            │
│  "Qué temazos! 🔥"                      │
│                                         │
└─────────────────────────────────────────┘
```

### Datos

```typescript
{
  type: 'tip_received',
  title: '¡Nueva propina! 🎉',
  body: '@mariagarcia te envió €5.00',
  data: {
    transactionId: 'tx-uuid',
    fromUser: '@mariagarcia',
    amount: 500,
    message: 'Qué temazos! 🔥',
    action: 'open_earnings'
  }
}
```

### Acción al tap
Abrir `/profile/earnings` o mostrar detalle

---

## Push 3: Mención en Chat

### Trigger
Usuario escribe mensaje con @mencion

### Preview en móvil

```
┌─────────────────────────────────────────┐
│ 💬 WhatsSound                     now   │
├─────────────────────────────────────────┤
│                                         │
│  Te mencionaron en el chat              │
│                                         │
│  @mariagarcia: "Oye @pablorod qué       │
│  opinas de este tema?"                  │
│                                         │
└─────────────────────────────────────────┘
```

### Datos

```typescript
{
  type: 'mention',
  title: 'Te mencionaron en el chat',
  body: '@mariagarcia: "Oye @pablorod qué opinas..."',
  data: {
    sessionId: 'session-uuid',
    messageId: 'msg-uuid',
    action: 'open_chat'
  }
}
```

### Acción al tap
Abrir `/session/[sessionId]` con chat abierto

---

## Push 4: Golden Boost Recibido

### Trigger
Admin confirma Golden Boost en Simulator

### Preview en móvil

```
┌─────────────────────────────────────────┐
│ ⭐ WhatsSound                     now   │
├─────────────────────────────────────────┤
│                                         │
│  ¡Recibiste un Golden Boost! 🏆         │
│                                         │
│  @pablorod te dio su Golden Boost       │
│  Ya tienes 15 boosts recibidos          │
│                                         │
└─────────────────────────────────────────┘
```

### Datos

```typescript
{
  type: 'golden_boost_received',
  title: '¡Recibiste un Golden Boost! 🏆',
  body: '@pablorod te dio su Golden Boost',
  data: {
    fromUser: '@pablorod',
    totalBoosts: 15,
    action: 'open_profile'
  }
}
```

---

## Push 5: Boost Disponible (Recordatorio)

### Trigger
Cron domingo medianoche (simulado manualmente)

### Preview en móvil

```
┌─────────────────────────────────────────┐
│ ⭐ WhatsSound                   Sunday   │
├─────────────────────────────────────────┤
│                                         │
│  ¡Tu Golden Boost se ha regenerado!     │
│                                         │
│  Tienes 1 boost disponible para dar     │
│  a tu DJ favorito esta semana           │
│                                         │
└─────────────────────────────────────────┘
```

---

## Tabla: ws_notifications_log

```sql
CREATE TABLE ws_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ws_profiles(id),
  type TEXT NOT NULL, -- dj_live, tip_received, mention, etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);
```

---

## Flujo en Simulator

### Vista en Admin

```
┌─────────────────────────────────────────────────────────────┐
│  🔔 Push: DJ en Vivo                                       │
│                                                             │
│  Título: DJ Carlos Madrid está en vivo!                    │
│  Body: Únete a "Viernes Latino 🔥" ahora                   │
│                                                             │
│  Destinatarios: 12 usuarios                                │
│  Status: pending                                            │
│                                                             │
│  [ 📤 Marcar como enviado ]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Al marcar como enviado

```sql
UPDATE ws_notifications_log
SET status = 'sent', sent_at = now()
WHERE id = 'notification-uuid';
```

En producción real, aquí iría:
```typescript
await Expo.sendPushNotificationsAsync(messages);
```

---

## Componentes

| Componente | Archivo |
|------------|---------|
| PushService | `src/lib/push-notifications.ts` |
| usePushNotifications | `src/hooks/usePushNotifications.ts` |
| PushCard (admin) | `src/components/admin/PushCard.tsx` |

---

## Permisos

### Solicitar permiso (onboarding)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                 🔔 Activa las notificaciones                │
│                                                             │
│     No te pierdas cuando tu DJ favorito                     │
│     empiece una sesión en vivo                              │
│                                                             │
│     ┌─────────────────────────────────────────┐            │
│     │      ✅ Activar notificaciones          │            │
│     └─────────────────────────────────────────┘            │
│                                                             │
│                   [ Ahora no ]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

*Especificación creada: 2026-02-04*
