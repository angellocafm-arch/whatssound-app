# Reunión 1: ONBOARDING — 6 Pantallas

**Fecha:** 3 Feb 2026  
**Moderador:** Tanque (Opus)

## 👥 Participantes
- **01-Arquitecto Frontend** — Componentes, animaciones, UX técnica
- **02-Arquitecto Backend** — Supabase OTP, auth flow
- **07-CraftMaster (Producto)** — UX, conversión, copy
- **17-Seguridad Legal** — RGPD, privacidad, consentimientos

---

## 🎯 Pantallas a Definir

| # | Pantalla | Prioridad |
|---|----------|-----------|
| 1.1 | Splash Screen | Alta |
| 1.2 | Onboarding Slides | Alta |
| 1.3 | Login Teléfono | Alta |
| 1.4 | Verificación OTP | Alta |
| 1.5 | Crear Perfil | Alta |
| 1.6 | Permisos | Media |

---

## 🗣️ PROPUESTAS POR EXPERTO

### 01-Arquitecto Frontend

**Splash Screen (1.1):**
- Logo animado con Reanimated 4 (2s máximo)
- Fade in del logo + pulse
- Background: color primario (#1DB954 verde WhatsSound)
- Preload de fuentes e iconos en paralelo

**Onboarding Slides (1.2):**
- 3 slides máximo (más es abandono)
- Swipeable con indicadores de puntos
- Botón "Saltar" visible desde slide 1
- Animaciones sutiles en cada slide (Lottie o Reanimated)

**Login/OTP (1.3, 1.4):**
- Input de teléfono con selector de país (react-native-phone-input)
- Máscara automática según país
- OTP: 6 inputs separados con auto-focus
- Countdown de reenvío (60s)

**Perfil (1.5):**
- Avatar opcional (camera/gallery picker)
- Username requerido (validación en tiempo real)
- Bio opcional (max 150 chars)

**Stack:**
```
- expo-splash-screen (nativo)
- react-native-pager-view (slides)
- react-native-phone-number-input
- expo-image-picker
```

---

### 02-Arquitecto Backend

**Auth Flow con Supabase:**
```
1. Usuario ingresa teléfono
2. supabase.auth.signInWithOtp({ phone })
3. Supabase envía SMS via Twilio
4. Usuario ingresa código
5. supabase.auth.verifyOtp({ phone, token })
6. JWT generado → usuario autenticado
```

**Configuración Supabase:**
- SMS Provider: Twilio (ya integrado)
- Rate limit: 5 OTP/hora por número
- Código expira: 5 minutos
- Longitud código: 6 dígitos

**Tablas necesarias:**
```sql
-- Ya existe ws_profiles, se usa para perfil
-- Campos: id, username, display_name, avatar_url, bio, phone, created_at
```

**Edge Cases:**
- Número ya registrado → login directo
- Número nuevo → crear perfil después de OTP
- Timeout de SMS → botón reenviar después de 60s

---

### 07-CraftMaster (Producto)

**Filosofía de Onboarding:**
> "De descarga a primera canción en < 60 segundos"

**Splash (1.1):**
- Duración: 1.5-2s (ni más, ni menos)
- Slogan: "El WhatsApp de la música" (ya definido)
- NO login wall hasta después de slides

**Slides (1.2) — Copy exacto:**

**Slide 1:** "Crea sesiones musicales"
- Ilustración: DJ con ondas de sonido
- Subtítulo: "Pon la música que quieras y compártela en vivo"

**Slide 2:** "Vota y pide canciones"
- Ilustración: Lista con votos subiendo
- Subtítulo: "La comunidad decide qué suena"

**Slide 3:** "Chatea y conecta"
- Ilustración: Burbujas de chat con notas musicales
- Subtítulo: "Música social en tiempo real"

**CTA final:** "Empezar" (verde, grande)

**Login (1.3):**
- Título: "Tu número de teléfono"
- Subtítulo: "Te enviamos un código para verificarte"
- Selector de país arriba del input
- NO pedir email (fricción innecesaria)

**OTP (1.4):**
- Título: "Código de verificación"
- Subtítulo: "Enviado a +34 XXX XXX XXX"
- Link: "¿No lo recibiste? Reenviar" (después de 60s)
- Auto-submit cuando se completan 6 dígitos

**Perfil (1.5):**
- Título: "Crea tu perfil"
- Avatar: Círculo con icono de cámara, tap para cambiar
- Username: Campo con @ prefijo, validación instant
- Botón: "Continuar" (skip bio si quieren)

**Métricas de éxito:**
- Completion rate onboarding > 70%
- Time to first session < 90s
- Drop-off por pantalla < 15%

---

### 17-Seguridad Legal

**RGPD Compliance:**

**Consentimientos requeridos (antes de crear cuenta):**
1. ✅ Términos de servicio (obligatorio)
2. ✅ Política de privacidad (obligatorio)
3. ⬜ Marketing (opcional, unchecked por defecto)

**Implementación en Login (1.3):**
```
Texto legal al pie:
"Al continuar, aceptas nuestros [Términos de Servicio] 
y [Política de Privacidad]"

Checkbox separado (opcional):
☐ Quiero recibir novedades y ofertas
```

**Datos mínimos (Data Minimization - Art. 5 RGPD):**
- Teléfono: Requerido (autenticación)
- Username: Requerido (identificación)
- Avatar: Opcional
- Bio: Opcional
- Email: NO pedir (no necesario para MVP)

**Permisos (1.6) - Timing correcto:**
- NO pedir todos al inicio
- Pedir en contexto de uso:
  - Notificaciones: Después de unirse a primera sesión
  - Micrófono: Al intentar usar walkie-talkie (futuro)
  - Contactos: Al ir a "Invitar amigos"
  - Ubicación: Al filtrar "Sesiones cerca de mí"

**Almacenamiento seguro:**
- Teléfono: Hasheado en BD
- OTP: No se almacena, solo se verifica
- Avatar: Supabase Storage con RLS
- JWT: Secure storage (expo-secure-store)

**Menores (LOPD-GDD España):**
- Edad mínima: 14 años
- Checkbox: "Confirmo que tengo 14 años o más"
- Si <14 detectado → bloquear registro

---

## 🔥 DEBATE Y CONSOLIDACIÓN

### Puntos de Acuerdo ✅

1. **Splash de 2 segundos** — Todos de acuerdo
2. **3 slides con skip** — Producto + Frontend alineados
3. **OTP de 6 dígitos con auto-submit** — Backend + Frontend ok
4. **No pedir email** — Producto + Legal alineados (data minimization)
5. **Permisos en contexto, no al inicio** — Legal + Producto

### Puntos de Debate 🔄

**Debate 1: ¿Checkbox de términos o texto implícito?**
- **Legal:** Preferible checkbox explícito para evidencia
- **Producto:** Checkbox añade fricción, el texto legal basta
- **Resolución:** Texto implícito + checkbox solo para marketing (opcional)

**Debate 2: ¿Verificación de edad?**
- **Legal:** Obligatorio según LOPD-GDD (14 años España)
- **Producto:** Añade fricción, nadie miente menos
- **Resolución:** Checkbox simple "Confirmo que tengo 14+ años" en login

---

## 🎯 ESPECIFICACIONES FINALES

### 1.1 Splash Screen
```
Duración: 2s
Fondo: #1DB954 (verde WhatsSound)
Logo: Centrado, animación pulse
Slogan: "El WhatsApp de la música" (fade in a 1s)
Preload: Fuentes, iconos, auth state
```

### 1.2 Onboarding Slides
```
Slides: 3
Skip: Visible desde slide 1 (esquina superior derecha)
Navegación: Swipe + indicadores de puntos
CTA final: "Empezar" (botón verde grande)

Slide 1: "Crea sesiones musicales"
Slide 2: "Vota y pide canciones"  
Slide 3: "Chatea y conecta"
```

### 1.3 Login Teléfono
```
Título: "Tu número de teléfono"
Subtítulo: "Te enviamos un código para verificarte"
Input: Selector país + número con máscara
Checkbox: ☐ Confirmo que tengo 14 años o más
Texto legal: "Al continuar, aceptas [Términos] y [Privacidad]"
Checkbox opcional: ☐ Quiero recibir novedades
CTA: "Continuar"
```

### 1.4 Verificación OTP
```
Título: "Código de verificación"
Subtítulo: "Enviado a +34 XXX XXX XXX"
Input: 6 campos separados, auto-focus, auto-submit
Timer: 60s countdown
Link: "Reenviar código" (activo después de timer)
Keyboard: numérico
```

### 1.5 Crear Perfil
```
Título: "Crea tu perfil"
Avatar: Círculo 100x100, tap para camera/gallery
Username: @_____ (validación real-time, único)
Display name: Opcional
Bio: Opcional (max 150 chars)
CTA: "Continuar"
```

### 1.6 Permisos
```
NO es pantalla separada.
Se piden en contexto:
- Notificaciones: Al unirse a primera sesión
- Micrófono: Al usar walkie-talkie
- Contactos: Al ir a "Invitar amigos"
- Ubicación: Al filtrar "Cerca de mí"
```

---

## 🛠️ DEPENDENCIAS TÉCNICAS

### Librerías a instalar
```bash
npm install react-native-pager-view
npm install react-native-phone-number-input
npm install expo-secure-store
# Lottie si se usan animaciones en slides
npm install lottie-react-native
```

### Tablas Supabase (existentes)
- `ws_profiles` — Ya tiene los campos necesarios
- `auth.users` — Manejado por Supabase Auth

### Configuración Supabase
- ✅ Phone Auth habilitado
- ✅ Twilio configurado para SMS
- ⚠️ Verificar rate limits en dashboard

---

## ✅ PRÓXIMOS PASOS

1. [ ] Crear mockups visuales de las 6 pantallas
2. [ ] Validar mockups con Ángel
3. [ ] Picar código siguiendo estas specs
4. [ ] Tests de cada pantalla
5. [ ] Deploy y verificación

---

**Reunión completada:** 3 Feb 2026  
**Siguiente:** Reunión 2 - Sesión Usuario
