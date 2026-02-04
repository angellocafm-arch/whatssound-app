# 📋 Tareas Golden Boost — WhatsSound V4

**Generado:** 2026-02-04 03:31
**Origen:** Reunión Equipo Virtual
**Lista Apple Reminders:** "WhatsSound Golden"

---

## 🎯 Resumen Ejecutivo

El equipo de 7 superexpertos virtuales revisó la V3 y propuso el sistema **Golden Boost** como evolución del sistema de propinas actual.

### Concepto Core
> "Lo que cuesta dar, vale más recibir"

El Golden Boost NO es dinero. Es reconocimiento escaso que crea conexión emocional entre oyente y DJ.

---

## 📊 Lo que Revisaron los Expertos

### ✅ Bien Implementado en V3
| Área | Qué se hizo bien |
|------|------------------|
| Gamificación | Rachas, reacciones flotantes |
| Seguridad | 61 RLS policies |
| UX | Interfaz limpia, navegación fluida |
| Realtime | Arquitectura Supabase correcta |
| Base de datos | 26 tablas bien estructuradas |

### ⚠️ Oportunidades de Mejora
| Área | Qué faltó |
|------|-----------|
| Gamificación | Epic Meaning, escasez real |
| Growth | K-factor medible, incentivo invitar |
| Monetización | Emoción en dar, no solo transacción |
| UX | Ceremonia/momento especial al dar |

---

## 🏆 Sistema Golden Boost

### Mecánica
```
PARA EL USUARIO:
├── Tiene: 1 Golden Boost por semana
├── Regenera: Domingo 00:00
├── Acelerador: +1 extra si escucha 5 sesiones diferentes
└── Compra opcional: €4.99 por unidad extra

PARA EL DJ:
├── Recibe: Notificación épica + animación
├── Gana: +50 puntos ranking
├── Acumula: Badges por cantidad
└── Visibilidad: Hall of Fame semanal
```

### Badges por Acumulación
| Golden Boosts | Badge | Beneficio |
|---------------|-------|-----------|
| 10 | 🌟 Rising Star | Visibilidad en Descubrir |
| 50 | ⭐ Fan Favorite | Destacado en búsquedas |
| 100 | ✓ Verificado | Check especial |
| 500 | 🏆 Hall of Fame | Permanente |

### Diferencia con Propinas
| Propinas 💰 | Golden Boost 🏆 |
|-------------|-----------------|
| Dinero real | Reconocimiento |
| Ilimitadas | 1 por semana |
| Transaccional | Emocional |
| Frío | Con ceremonia |
| Solo DJ gana | Ambos ganan |

---

## ✅ Lista de Tareas Detallada

### FASE 1: Core (Inmediato)

| # | Tarea | Descripción | Prioridad |
|---|-------|-------------|-----------|
| 1.1 | Crear tabla `ws_golden_boosts` | id, from_user_id, to_dj_id, session_id, created_at | 🔴 Alta |
| 1.2 | Campos en `ws_profiles` | golden_boost_available, golden_boost_last_reset, golden_boosts_received | 🔴 Alta |
| 1.3 | Componente `GoldenBoostButton` | Botón dorado pulsante, long-press, confirmación | 🔴 Alta |
| 1.4 | Animación confetti dorado | react-native-confetti-cannon o similar | 🔴 Alta |
| 1.5 | Sonido achievement | Audio épico 2-3 seg al dar/recibir | 🟡 Media |
| 1.6 | RLS policies | Solo dar si tienes disponible, prevenir duplicados | 🔴 Alta |

### FASE 2: Mecánicas (Esta semana)

| # | Tarea | Descripción | Prioridad |
|---|-------|-------------|-----------|
| 2.1 | Regeneración semanal | Cron job domingo 00:00, reset a 1 | 🔴 Alta |
| 2.2 | Acelerador 5 sesiones | Tracking de sesiones únicas, +1 al completar | 🟡 Media |
| 2.3 | Push notification DJ | Notificación especial cuando recibe | 🟡 Media |
| 2.4 | Historial | Pantalla con Golden Boosts dados/recibidos | 🟡 Media |
| 2.5 | Contador en perfil | Badge con número en perfil público DJ | 🔴 Alta |
| 2.6 | Realtime broadcast | Todos en la sala ven cuando alguien da | 🔴 Alta |

### FASE 3: Monetización (Siguiente sprint)

| # | Tarea | Descripción | Prioridad |
|---|-------|-------------|-----------|
| 3.1 | Compra extra €4.99 | Stripe payment, añade 1 Golden Boost | 🟡 Media |
| 3.2 | Sistema de badges | Rising Star, Fan Favorite, Verificado | 🟡 Media |
| 3.3 | Hall of Fame | Ranking semanal de DJs con más GB | 🟢 Baja |
| 3.4 | Compartir en redes | Story automática Instagram/TikTok | 🟢 Baja |
| 3.5 | GB Permanente €19.99 | Tu nombre siempre en perfil del DJ | 🟢 Baja |

---

## 🗄️ Schema Base de Datos

```sql
-- Nueva tabla
CREATE TABLE ws_golden_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES ws_profiles(id),
  to_dj_id UUID NOT NULL REFERENCES ws_profiles(id),
  session_id UUID REFERENCES ws_sessions(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevenir dar múltiples al mismo DJ en la misma semana
  CONSTRAINT unique_weekly_boost UNIQUE (
    from_user_id, 
    to_dj_id, 
    (DATE_TRUNC('week', created_at))
  )
);

-- Índices
CREATE INDEX idx_golden_boosts_to_dj ON ws_golden_boosts(to_dj_id);
CREATE INDEX idx_golden_boosts_from_user ON ws_golden_boosts(from_user_id);
CREATE INDEX idx_golden_boosts_session ON ws_golden_boosts(session_id);

-- Campos en profiles
ALTER TABLE ws_profiles ADD COLUMN IF NOT EXISTS
  golden_boost_available INT DEFAULT 1,
  golden_boost_last_reset TIMESTAMPTZ DEFAULT now(),
  golden_boosts_received INT DEFAULT 0,
  golden_boosts_given INT DEFAULT 0,
  sessions_listened_this_week INT DEFAULT 0;

-- RLS
ALTER TABLE ws_golden_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can give golden boost if available"
ON ws_golden_boosts FOR INSERT
WITH CHECK (
  auth.uid() = from_user_id
  AND (SELECT golden_boost_available FROM ws_profiles WHERE id = auth.uid()) > 0
);

CREATE POLICY "Anyone can view golden boosts"
ON ws_golden_boosts FOR SELECT
USING (true);

-- Trigger para decrementar disponible y actualizar contadores
CREATE OR REPLACE FUNCTION handle_golden_boost()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrementar disponible del dador
  UPDATE ws_profiles 
  SET golden_boost_available = golden_boost_available - 1,
      golden_boosts_given = golden_boosts_given + 1
  WHERE id = NEW.from_user_id;
  
  -- Incrementar recibidos del DJ
  UPDATE ws_profiles 
  SET golden_boosts_received = golden_boosts_received + 1
  WHERE id = NEW.to_dj_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_golden_boost_given
AFTER INSERT ON ws_golden_boosts
FOR EACH ROW EXECUTE FUNCTION handle_golden_boost();
```

---

## 🧩 Componentes a Crear

### GoldenBoostButton.tsx
```typescript
interface GoldenBoostButtonProps {
  djId: string;
  sessionId: string;
  disabled?: boolean;
}

// Estados:
// - available: dorado brillante, pulsando
// - cooldown: gris con countdown
// - giving: animación de envío
```

### GoldenBoostAnimation.tsx
```typescript
// Confetti dorado + sonido
// Se muestra para TODA la sala
// Dura 3-4 segundos
```

### GoldenBoostNotification.tsx
```typescript
// Toast especial para el DJ
// "🏆 María te dio un Golden Boost!"
// Con sonido especial
```

---

## 📱 Pantallas a Modificar

1. **Session/[id].tsx** — Añadir GoldenBoostButton
2. **Profile/[id].tsx** — Mostrar contador de Golden Boosts
3. **Settings** — Historial de Golden Boosts
4. **Discover** — Badge en DJs con muchos GB

---

## 🎯 Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| % usuarios que dan GB | >30% semanal |
| GB dados por usuario activo | 0.8/semana |
| Retención D7 post-GB | +15% vs control |
| Conversión compra extra | 5% de usuarios |

---

## 📅 Timeline Propuesto

| Semana | Entregable |
|--------|------------|
| Semana 1 | Fase 1 completa (core funcional) |
| Semana 2 | Fase 2 (mecánicas, regeneración) |
| Semana 3 | Fase 3 (monetización, badges) |
| Semana 4 | Testing + lanzamiento |

---

*Documento generado automáticamente desde reunión de expertos*
*Lista de tareas sincronizada con Apple Reminders: "WhatsSound Golden"*
