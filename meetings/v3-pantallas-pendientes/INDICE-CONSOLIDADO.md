# 📋 ÍNDICE CONSOLIDADO — 26 Pantallas Pendientes

**Generado:** 3 Feb 2026  
**Reuniones completadas:** 6/6  
**Estado:** Listo para aprobación de Ángel

---

## 🎯 RESUMEN EJECUTIVO

26 pantallas definidas con especificaciones completas.  
Priorización para demo de inversores incluida.

---

## 📱 PANTALLAS POR BLOQUE

### BLOQUE A: ONBOARDING (6 pantallas) — ALTA PRIORIDAD
| # | Pantalla | Specs | Demo Inversores |
|---|----------|-------|-----------------|
| 1.1 | Splash Screen | 2s, logo animado, preload | ✅ Sí |
| 1.2 | Onboarding Slides | 3 slides, skip visible | ✅ Sí |
| 1.3 | Login Teléfono | OTP, selector país, edad 14+ | ✅ Sí |
| 1.4 | Verificación OTP | 6 dígitos, auto-submit | ✅ Sí |
| 1.5 | Crear Perfil | Avatar, username, bio opt | ✅ Sí |
| 1.6 | Permisos | En contexto, no pantalla | ✅ Implícito |

### BLOQUE B: SESIÓN USUARIO (4 pantallas) — ALTA PRIORIDAD
| # | Pantalla | Specs | Demo Inversores |
|---|----------|-------|-----------------|
| 3.5 | Pedir Canción | Modal, Deezer search, preview | ✅ Sí |
| 3.6 | Detalle Canción | Info, votos, deep link Spotify | ✅ Sí |
| 3.7 | Perfil Usuario | Bottom sheet, acciones | ✅ Sí |
| 3.8 | Reacciones Expandidas | 10 emojis, animaciones | ⚪ Opcional |

### BLOQUE C: SESIÓN DJ (2 pantallas) — MEDIA PRIORIDAD
| # | Pantalla | Specs | Demo Inversores |
|---|----------|-------|-----------------|
| 4.5 | DJ Anunciar | Modal, tipos anuncio, cooldown | ⚪ Opcional |
| 4.6 | DJ Stats | Gráficas real-time, histórico | ✅ Sí |

### BLOQUE D: PROPINAS (3 pantallas) — ALTA PRIORIDAD
| # | Pantalla | Specs | Demo Inversores |
|---|----------|-------|-----------------|
| 7.1 | Enviar Propina | Stripe, montos, mensaje | ✅ Sí |
| 7.2 | Historial Propinas | Enviadas/recibidas, export | ⚪ Opcional |
| 7.3 | Config Pagos | Stripe Connect para DJs | ⚪ Opcional |

### BLOQUE E: NOTIFICACIONES (2 pantallas) — MEDIA PRIORIDAD
| # | Pantalla | Specs | Demo Inversores |
|---|----------|-------|-----------------|
| 8.1 | Centro Notificaciones | Agrupado, swipe actions | ⚪ Opcional |
| 8.2 | Invitación Sesión | Push + in-app, deep link | ✅ Sí |

### BLOQUE F: EXTRAS (9 pantallas) — VARIABLE
| # | Pantalla | Specs | Demo Inversores |
|---|----------|-------|-----------------|
| 2.4 | Escanear QR | Cámara, validación | ⚪ Opcional |
| 5.2 | Deep Link Landing | Web, store links | ✅ Sí |
| 6.11 | Editar Perfil | Todos los campos | ✅ Sí |
| 6.12 | Perfil DJ Público | Stats, historial, follow | ✅ Sí |
| 9.1 | Historial Sesiones | Lista con filtros | ⚪ Opcional |
| 9.2 | Favoritos | Canciones, DJs, sesiones | ❌ No |
| 9.3 | Walkie-Talkie | POST-MVP | ❌ No |
| 9.4 | Error/Sin Conexión | UI offline | ✅ Sí |
| 9.5 | Actualización Requerida | Force update | ❌ No |

---

## 🚀 PLAN DE EJECUCIÓN

### Fase 1: Core Demo (14 pantallas) — 2 semanas
**Para demo de inversores:**
1. Onboarding completo (6)
2. Pedir canción + Detalle (2)
3. Enviar propina (1)
4. Perfil DJ público (1)
5. Editar perfil (1)
6. Deep link landing (1)
7. Error/sin conexión (1)
8. Invitación sesión (1)

### Fase 2: Completar UX (8 pantallas) — 1 semana
- Perfil usuario modal
- Reacciones expandidas
- DJ Anunciar + Stats
- Centro notificaciones
- Historial propinas
- Config pagos
- Escanear QR
- Historial sesiones

### Fase 3: Nice to Have (4 pantallas) — Post-lanzamiento
- Favoritos
- Walkie-talkie
- Actualización requerida

---

## 🛠️ DEPENDENCIAS TÉCNICAS

### NPM Packages necesarios
```bash
npm install react-native-pager-view        # Onboarding slides
npm install react-native-phone-number-input # Login teléfono
npm install @stripe/stripe-react-native    # Propinas
npm install expo-notifications             # Push
npm install expo-camera                    # QR scanner
npm install expo-barcode-scanner           # QR scanner
npm install @react-native-community/netinfo # Offline detection
npm install react-native-bottom-sheet      # Modales
npm install lottie-react-native            # Animaciones
```

### Supabase (nuevas tablas)
```sql
-- ws_notifications
CREATE TABLE ws_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES ws_profiles(id),
  type TEXT NOT NULL, -- 'session', 'social', 'activity', 'system'
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ws_payment_methods
CREATE TABLE ws_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES ws_profiles(id),
  stripe_pm_id TEXT NOT NULL,
  last4 TEXT,
  brand TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ws_dj_payouts
CREATE TABLE ws_dj_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dj_id UUID REFERENCES ws_profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Servicios externos
- Stripe Connect (propinas)
- Firebase Cloud Messaging (push Android)
- APNs (push iOS)
- Twilio (SMS OTP) — ya configurado

---

## ✅ SIGUIENTE PASO

**Pendiente aprobación de Ángel para:**
1. Validar priorización de pantallas
2. Aprobar specs técnicas
3. Autorizar inicio de mockups
4. Luego: picar código

---

**Documentación completa en:**  
`meetings/v3-pantallas-pendientes/`
- `00-PLAN-REUNIONES.md`
- `reunion-01-onboarding.md`
- `reunion-02-sesion-usuario.md`
- `reunion-03-sesion-dj.md`
- `reunion-04-propinas.md`
- `reunion-05-notificaciones.md`
- `reunion-06-extras.md`
