# 📋 Reunión: Plan de Mejoras Pendientes

**Fecha:** 2026-02-06 03:15 CET  
**Convocante:** Director de Orquesta (Tanke)  
**Objetivo:** Priorizar y planificar solución de puntos débiles

---

## 👥 Participantes

| # | Experto | Área |
|---|---------|------|
| 01 | 🎨 UX/UI | Responsive, animaciones |
| 02 | ⚙️ Backend | Caché, optimización |
| 06 | 🚀 DevOps | Push, App Stores |
| 10 | 📈 Growth | Priorización por impacto |

---

## 🐛 Problemas a Resolver

### 1. Audio/carátulas tardan en cargar
### 2. Push notifications
### 3. Responsive en pantallas internas
### 4. App Stores (iOS/Android)
### 5. Animaciones de neón en welcome

---

## 💬 TRANSCRIPCIÓN

### GROWTH (10):
> "Vamos a priorizar por impacto en usuario y dificultad técnica:
> 
> **P0 - Crítico (afecta experiencia core):**
> - Audio/carátulas lentas → usuarios abandonan
> 
> **P1 - Alto (mejora retención):**
> - Push notifications → traer usuarios de vuelta
> 
> **P2 - Medio (mejora percepción):**
> - Responsive desktop → más profesional
> - Animaciones neón → wow factor
> 
> **P3 - Largo plazo:**
> - App Stores → requiere cuentas developer, review process"

### BACKEND (02):
> "Para el problema de carga lenta de audio y carátulas:
> 
> 1. **Implementar caché de imágenes** — Las carátulas se cachean localmente
> 2. **Lazy loading** — Cargar solo lo visible
> 3. **Placeholder mientras carga** — Skeleton o blur
> 4. **Preload de siguiente canción** — Anticipar qué viene
> 
> Tiempo estimado: 1-2 días"

### DEVOPS (06):
> "Para push notifications:
> 
> 1. Ya tenemos Expo Push instalado
> 2. Necesitamos:
>    - Guardar push tokens en Supabase
>    - Edge function para enviar notificaciones
>    - Triggers: 'DJ en vivo', 'te mencionaron', 'nuevo seguidor'
> 
> Tiempo estimado: 2-3 días
> 
> Para App Stores:
> - Necesitamos cuenta Apple Developer ($99/año)
> - Cuenta Google Play ($25 una vez)
> - Build con EAS Build
> - Review process: 1-7 días
> 
> Tiempo estimado: 1-2 semanas (incluye review)"

### UX/UI (01):
> "Para responsive en pantallas internas:
> 
> El approach es tipo WhatsApp Web:
> - Sidebar fija con lista (chats, sesiones)
> - Panel principal con contenido
> - Breakpoint en 1024px
> 
> Pantallas prioritarias:
> 1. /(tabs) layout general
> 2. /session/[id] — La más usada
> 3. /chat/[id]
> 
> Tiempo estimado: 3-4 días
> 
> Para animaciones neón:
> - Usar CSS @keyframes en web
> - Librería react-native-reanimated en native
> - Aplicar a todas las cards con borde
> 
> Tiempo estimado: 1 día"

---

## ✅ PLAN DE ACCIÓN

### Semana 1 (7-13 Feb)

| Día | Tarea | Responsable | Prioridad |
|-----|-------|-------------|-----------|
| Vie 7 | Caché de carátulas + skeleton | Backend | P0 |
| Sáb 8 | Push tokens + edge function | DevOps | P1 |
| Dom 9 | Triggers de push (DJ en vivo) | DevOps | P1 |
| Lun 10 | Layout responsive tabs | UX/UI | P2 |
| Mar 11 | Responsive session/chat | UX/UI | P2 |
| Mié 12 | Animaciones neón | UX/UI | P2 |
| Jue 13 | Testing + pulido | Todos | - |

### Semana 2 (14-20 Feb)

| Tarea | Responsable |
|-------|-------------|
| Crear cuenta Apple Developer | DevOps |
| Crear cuenta Google Play | DevOps |
| Build con EAS | DevOps |
| Submit a stores | DevOps |
| Esperar review | - |

---

## 📊 ORDEN DE EJECUCIÓN

```
1. 🔴 P0: Optimizar carga (audio/carátulas)
   └── Backend: caché, lazy load, skeleton
   └── 1-2 días

2. 🟠 P1: Push notifications
   └── DevOps: tokens, edge function, triggers
   └── 2-3 días

3. 🟡 P2: Responsive desktop
   └── UX/UI: layout WhatsApp Web
   └── 3-4 días

4. 🟡 P2: Animaciones neón
   └── UX/UI: CSS keyframes
   └── 1 día

5. 🟢 P3: App Stores
   └── DevOps: cuentas, build, submit
   └── 1-2 semanas
```

---

## 💬 COMPROMISOS DEL EQUIPO

**Backend:**
> "Mañana mismo implemento el caché de carátulas con React Query y añado skeletons mientras cargan."

**DevOps:**
> "El sábado tengo las push funcionando. Empiezo por 'Tu DJ favorito está en vivo' que es el trigger más importante."

**UX/UI:**
> "Lunes empiezo con el layout responsive. El miércoles están las animaciones de neón funcionando."

**Growth:**
> "Yo coordino el testing y me aseguro de que cada mejora se mida en PostHog."

---

## 🎯 ENTREGABLES

| Fecha | Entregable |
|-------|------------|
| 9 Feb | Carga optimizada + Push básico |
| 13 Feb | Responsive completo + Animaciones |
| 20 Feb | Apps en stores (pendiente review) |

---

*Reunión documentada por: Director de Orquesta (Tanke)*
