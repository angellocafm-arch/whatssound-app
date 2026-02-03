# Plan de Reuniones — 26 Pantallas Pendientes (v3)

## 📅 Objetivo
Definir especificaciones completas de las 26 pantallas pendientes antes de picar código.

## 👥 Grupos de Reuniones Especializadas

### Reunión 1: ONBOARDING (6 pantallas)
**Pantallas:**
- 1.1 Splash Screen
- 1.2 Onboarding slides (3)
- 1.3 Login teléfono
- 1.4 Verificación OTP
- 1.5 Crear Perfil
- 1.6 Permisos

**Participantes:**
- 01-arquitecto-frontend — Componentes, animaciones
- 02-arquitecto-backend — Supabase OTP, auth flow
- 07-experto-producto — UX, copy, conversión
- 17-seguridad-legal — GDPR, privacidad teléfono

**Preguntas clave:**
1. ¿Qué animación en splash? ¿Duración?
2. ¿Cuántos slides de onboarding? ¿Skip opcional?
3. ¿OTP por SMS o WhatsApp?
4. ¿Qué datos mínimos en perfil?
5. ¿Qué permisos pedir y cuándo?

---

### Reunión 2: SESIÓN USUARIO (4 pantallas)
**Pantallas:**
- 3.5 Pedir Canción (modal)
- 3.6 Detalle de Canción
- 3.7 Perfil de Usuario (modal)
- 3.8 Reacciones expandidas

**Participantes:**
- 01-arquitecto-frontend — Modales, animaciones
- 07-experto-producto — UX, flujos
- 10-audio-streaming — Preview de canción
- 03-experto-realtime — Sync de estados

**Preguntas clave:**
1. ¿Búsqueda en Spotify o Deezer para pedir canción?
2. ¿Preview de 30s al seleccionar?
3. ¿Qué acciones desde perfil de usuario?
4. ¿Cuántas reacciones? ¿Animaciones?

---

### Reunión 3: SESIÓN DJ (2 pantallas)
**Pantallas:**
- 4.5 DJ Anunciar (modal)
- 4.6 DJ Stats detalladas

**Participantes:**
- 01-arquitecto-frontend — UI de stats, gráficas
- 07-experto-producto — Métricas relevantes para DJ
- 08-dashboard-analytics — Visualización de datos

**Preguntas clave:**
1. ¿Qué tipo de anuncios puede enviar el DJ?
2. ¿Qué stats son más importantes?
3. ¿Gráficas en tiempo real o históricas?

---

### Reunión 4: PROPINAS Y PAGOS (3 pantallas)
**Pantallas:**
- 7.1 Enviar Propina (modal)
- 7.2 Historial de Propinas
- 7.3 Configurar Pagos

**Participantes:**
- 12-monetizacion-pagos — Stripe, flujos de pago
- 02-arquitecto-backend — Webhooks, tablas
- 17-seguridad-legal — PCI, términos
- 07-experto-producto — UX de pago

**Preguntas clave:**
1. ¿Montos predefinidos o libre?
2. ¿Comisión de la plataforma?
3. ¿Cómo retira el DJ?
4. ¿Propinas anónimas posibles?

---

### Reunión 5: NOTIFICACIONES (2 pantallas)
**Pantallas:**
- 8.1 Centro de Notificaciones
- 8.2 Invitación a Sesión

**Participantes:**
- 13-notificaciones-engagement — Tipos, triggers
- 05-experto-mobile — Push nativo
- 01-arquitecto-frontend — UI del centro

**Preguntas clave:**
1. ¿Qué eventos generan notificación?
2. ¿Agrupación por tipo?
3. ¿Deep links desde notificación?

---

### Reunión 6: EXTRAS Y AJUSTES (9 pantallas)
**Pantallas:**
- 2.4 Escanear QR
- 5.2 Deep Link Landing
- 6.11 Editar Perfil
- 6.12 Perfil DJ público
- 9.1 Historial Sesiones
- 9.2 Favoritos/Guardados
- 9.3 Audio en Directo (walkie-talkie)
- 9.4 Error/Sin conexión
- 9.5 Actualización Requerida

**Participantes:**
- 01-arquitecto-frontend — Todas las UI
- 05-experto-mobile — Cámara QR, offline
- 14-pwa-offline — Estados sin conexión
- 07-experto-producto — Priorización

**Preguntas clave:**
1. ¿QR nativo o librería?
2. ¿Qué mostrar en landing web?
3. ¿Qué datos en perfil DJ público?
4. ¿Walkie-talkie es MVP o post-MVP?

---

## 📋 Secuencia de Ejecución

1. ✅ Crear plan (este documento)
2. ⏳ Reunión 1: Onboarding
3. ⏳ Reunión 2: Sesión Usuario
4. ⏳ Reunión 3: Sesión DJ
5. ⏳ Reunión 4: Propinas
6. ⏳ Reunión 5: Notificaciones
7. ⏳ Reunión 6: Extras
8. ⏳ Reunión Plenaria
9. ⏳ Presentación a Ángel

## 🎯 Output Esperado
- Especificaciones detalladas por pantalla
- Componentes necesarios
- Dependencias entre pantallas
- Stack/librerías a usar
- Mockups aprobados
- Listo para picar código

---
*Creado: 3 Feb 2026*
