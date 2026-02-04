# 🎯 Reunión Equipo Virtual — Revisión V3 + Sistema Botón de Oro

**Fecha:** 2026-02-04 03:30
**Asistentes:** 7 Superexpertos virtuales
**Objetivo:** Revisar V3 y diseñar sistema de reconocimiento tipo "Botón de Oro"

---

## 📋 Agenda

1. Cada experto revisa lo implementado en V3
2. Feedback: qué se hizo bien, qué faltó
3. Diseño colaborativo: Sistema "Botón de Oro"
4. Plan de implementación

---

## 🎤 APERTURA

**Contexto de Ángel:**
> El sistema actual de propinas (dinero directo) debe evolucionar a algo tipo "Botón de Oro" de Got Talent:
> - NO es dinero, pero es MUY valioso
> - Tienes MUY POCOS (o uno)
> - CUESTA darlo — significa algo
> - Beneficia al DJ (pro o amateur con amigos)
> - NO se regenera fácil
> - Se puede ACELERAR regeneración con acciones

---

## 👥 INTERVENCIONES DE EXPERTOS

### 🎮 EXPERTO GAMIFICACIÓN (Yu-kai Chou + Nir Eyal + Duolingo)

**Revisión V3:**
- ✅ Rachas implementadas — bien aplicado Loss Avoidance
- ✅ Reacciones flotantes — Unpredictability
- ⚠️ Falta Epic Meaning — el usuario no siente que es parte de algo grande
- ⚠️ Falta Scarcity real — las reacciones son infinitas

**Propuesta Botón de Oro:**

Aplicando **Octalysis Core Drive 6 (Scarcity & Impatience)**:

```
🏆 GOLDEN BOOST (Botón de Oro)
├── Cada usuario tiene: 1 por semana
├── Se regenera: Domingo 00:00
├── Acelerador: +1 extra si escuchas 5 sesiones diferentes
├── Efecto para DJ:
│   ├── Notificación especial con animación
│   ├── +50 puntos de ranking
│   ├── Badge visible en su perfil "X Golden Boosts recibidos"
│   └── Aparece en "Hall of Fame" semanal
└── Efecto para quien da:
    ├── Satisfacción de escasez (solo tengo 1, lo usé bien)
    └── Conexión emocional con el DJ
```

**Psicología detrás:**
- **Loss Aversion:** Si no lo uso esta semana, no se acumula
- **FOMO:** Ver que otros dan Golden Boosts y tú no
- **Social Proof:** "Este DJ tiene 47 Golden Boosts"
- **Reciprocity:** El DJ sabe quién se lo dio

---

### 🚀 EXPERTO GROWTH (Andrew Chen + Sean Ellis)

**Revisión V3:**
- ✅ Deep links implementados — viral loop básico
- ⚠️ Falta K-factor medible
- ⚠️ No hay incentivo real para invitar

**Propuesta Botón de Oro para Growth:**

```
VIRAL MECHANIC:
├── Si invitas a 3 amigos que se unen → +1 Golden Boost extra
├── El Golden Boost se puede dar a cualquier DJ
├── Pero cuando lo das, aparece:
│   "🏆 Golden Boost de @tunombre"
│   → El DJ ve quién se lo dio
│   → Puede agradecerle públicamente
│   → Crea conexión 1:1
└── Esto genera contenido compartible:
    "DJ Carlos recibió un Golden Boost de María 🏆"
    → Historia de Instagram/TikTok automática
```

**Métrica clave:** Cada Golden Boost = mini-momento viral

---

### 💰 EXPERTO MONETIZACIÓN (Patreon + Twitch + Ko-fi)

**Revisión V3:**
- ✅ Sistema de propinas básico
- ⚠️ Muy transaccional — "pago = servicio"
- ⚠️ No hay emoción en dar dinero

**Propuesta Botón de Oro + Monetización:**

```
MODELO HÍBRIDO:
├── Golden Boost: GRATIS (1/semana) — engagement
├── Golden Boost EXTRA: €4.99 (compra única)
│   └── "Quiero dar más reconocimiento"
├── Pack 3 Golden Boosts: €9.99
└── Golden Boost PERMANENTE: €19.99
    └── Tu nombre queda SIEMPRE en el perfil del DJ

PARA EL DJ:
├── Golden Boosts NO son dinero directo
├── PERO desbloquean:
│   ├── 10 GB → Badge "Rising Star" 🌟
│   ├── 50 GB → Badge "Fan Favorite" ⭐
│   ├── 100 GB → Verificación especial ✓
│   └── 500 GB → "Hall of Fame" permanente
└── Los badges atraen más oyentes → más propinas reales
```

**Insight:** El Golden Boost es la EMOCIÓN, la propina es la TRANSACCIÓN. Separarlos aumenta ambos.

---

### 🎨 EXPERTO UX (Spotify + Discord + Shazam)

**Revisión V3:**
- ✅ UI limpia y funcional
- ⚠️ El botón de propina no tiene "momento especial"
- ⚠️ Falta ceremonia al dar algo valioso

**Propuesta UX del Botón de Oro:**

```
INTERACCIÓN:
1. Usuario ve botón dorado pulsante (si tiene disponible)
2. Long-press (no tap accidental) → Confirmación
3. "¿Dar tu Golden Boost a DJ Carlos?"
   [Cancelar] [🏆 DARLO]
4. Al confirmar:
   ├── Animación ÉPICA (confetti dorado, sonido especial)
   ├── El DJ recibe notificación en pantalla
   ├── Todos en la sesión ven: "🏆 María dio un Golden Boost!"
   └── Tu botón se "vacía" visualmente hasta regenerarse

VISUAL DEL BOTÓN:
├── Disponible: Dorado brillante, pulsando suavemente
├── Usado: Gris con contador "Próximo en 5 días"
└── Regenerándose: Barra de progreso circular
```

---

### 🔒 EXPERTO SEGURIDAD

**Revisión V3:**
- ✅ 61 RLS policies — excelente
- ⚠️ Falta rate limiting en acciones sensibles

**Para Botón de Oro:**

```sql
-- Tabla nueva
CREATE TABLE ws_golden_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES ws_profiles(id),
  to_dj_id UUID REFERENCES ws_profiles(id),
  session_id UUID REFERENCES ws_sessions(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Prevenir duplicados
  UNIQUE(from_user_id, to_dj_id, DATE_TRUNC('week', created_at))
);

-- Contador en perfil
ALTER TABLE ws_profiles ADD COLUMN 
  golden_boost_available INT DEFAULT 1,
  golden_boost_last_reset TIMESTAMPTZ DEFAULT now(),
  golden_boosts_received INT DEFAULT 0;

-- RLS: Solo puedes dar si tienes disponible
CREATE POLICY "can_give_golden_boost" ON ws_golden_boosts
FOR INSERT WITH CHECK (
  (SELECT golden_boost_available FROM ws_profiles WHERE id = auth.uid()) > 0
);
```

---

### ⚡ EXPERTO REALTIME

**Para Botón de Oro:**

```typescript
// Canal especial para Golden Boosts
supabase
  .channel(`session:${sessionId}:golden`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'ws_golden_boosts',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    // Animación épica para TODOS en la sesión
    showGoldenBoostAnimation(payload.new);
  })
  .subscribe();
```

---

### 🎵 EXPERTO AUDIO

**Para el momento Golden Boost:**

```
SONIDO ESPECIAL:
├── Cuando das: Sonido de "achievement" épico (2-3 seg)
├── Cuando recibes: Fanfarria corta + vibración
└── Para la sala: Sonido sutil de "ding" dorado

Referencia: Sonido de Twitch cuando alguien se suscribe
```

---

## 🎯 CONSENSO DEL EQUIPO

### Nombre Final: **"GOLDEN BOOST"** 🏆

### Mecánica Acordada:

| Aspecto | Decisión |
|---------|----------|
| Cantidad | 1 por semana (regenera domingo) |
| Acelerador | +1 si escuchas 5 sesiones diferentes |
| Compra extra | Sí, €4.99 por unidad |
| Efecto DJ | +50 ranking, badge, visibilidad |
| Efecto dador | Satisfacción, conexión, reconocimiento |
| Visual | Botón dorado pulsante, long-press |
| Sonido | Achievement épico |
| Animación | Confetti dorado para toda la sala |

### Diferencia con Propinas:

| Propinas 💰 | Golden Boost 🏆 |
|-------------|-----------------|
| Dinero real | Reconocimiento |
| Ilimitadas | Escasas (1/semana) |
| Transaccional | Emocional |
| Solo DJ recibe | Ambos ganan |
| Sin momento especial | CEREMONIA |

---

## 📝 PLAN DE IMPLEMENTACIÓN

### Fase 1 (Inmediato)
- [ ] Crear tabla `ws_golden_boosts`
- [ ] Añadir campos a `ws_profiles`
- [ ] Componente `GoldenBoostButton`
- [ ] Animación de confetti

### Fase 2 (Esta semana)
- [ ] Sistema de regeneración
- [ ] Aceleradores
- [ ] Notificaciones push
- [ ] Historial de Golden Boosts

### Fase 3 (Siguiente)
- [ ] Compra de Golden Boosts extra
- [ ] Badges por acumulación
- [ ] Hall of Fame semanal
- [ ] Compartir en redes

---

## 💡 INSIGHTS CLAVE DE LA REUNIÓN

1. **El dinero no crea conexión, la escasez sí**
2. **Lo que cuesta dar, vale más recibir**
3. **El momento de dar debe ser una CEREMONIA**
4. **Separar emoción (Golden) de transacción (Propina)**
5. **El Golden Boost ES el producto viral**

---

*Reunión finalizada: 2026-02-04*
*Próxima acción: Implementar Fase 1*
