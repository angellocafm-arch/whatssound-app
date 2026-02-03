# Reunión 1: ONBOARDING — 6 Pantallas (v2 con Agentes)

**Fecha:** 3 Feb 2026  
**Moderador:** Tanque (Opus)  
**Método:** 4 sub-agentes simulando expertos en paralelo

## 👥 Participantes (Agentes)
- **experto-frontend** — Arquitecto Frontend
- **experto-backend** — Arquitecto Backend  
- **experto-producto** — CraftMaster (UX/Producto)
- **experto-legal** — Seguridad y Legal

---

## 🎯 ESPECIFICACIONES CONSOLIDADAS

### 1.1 Splash Screen
| Aspecto | Especificación |
|---------|----------------|
| **Duración** | 1.5-2s auto-dismiss |
| **Visual** | Logo animado + "WhatsSound" |
| **Técnico** | `expo-splash-screen` + `react-native-reanimated` |
| **Preload** | Assets, fonts, check auth state en Zustand |
| **Legal** | Sin requerimientos |

---

### 1.2 Onboarding Slides
| Aspecto | Especificación |
|---------|----------------|
| **Cantidad** | 3 slides |
| **Skip** | Visible arriba derecha desde slide 1 |
| **Navegación** | `react-native-pager-view` con parallax sutil |
| **Persistencia** | `hasSeenOnboarding` en `expo-secure-store` |

**Copy exacto:**
```
Slide 1: "Tu música. Sin complicaciones."
         Escucha lo que quieras, cuando quieras

Slide 2: "Descubre tu próxima obsesión"
         Recomendaciones que entienden tu gusto

Slide 3: "Comparte momentos, no links"
         Tu música en tus estados de WhatsApp

CTA: "Empezar"
```

---

### 1.3 Login Teléfono
| Aspecto | Especificación |
|---------|----------------|
| **Título** | "¿Cuál es tu número?" |
| **Subtítulo** | "Te enviaremos un código para verificar" |
| **Input** | Selector país (auto-detectado) + teléfono con máscara |
| **Validación** | `zod` + `react-hook-form` + `libphonenumber-js` |
| **CTA** | "Continuar" |

**Requisitos Legales (RGPD):**
```
☐ Confirmo que tengo 14 años o más (obligatorio, no premarcado)

Texto pie: "Al continuar, aceptas los [Términos] y [Privacidad]"
           (enlaces clicables a documentos completos)
```

**Backend:**
```typescript
supabase.auth.signInWithOtp({ phone })
// Rate limit: 5 OTP/hora por número, 20/hora por IP
// Respuesta uniforme para evitar timing attacks
```

---

### 1.4 Verificación OTP
| Aspecto | Especificación |
|---------|----------------|
| **Título** | "Ingresa el código" |
| **Subtítulo** | "Enviado al +34 XXX XXX XXX" [Editar] |
| **Input** | 6 campos numéricos, auto-focus forward/backward |
| **Auto-submit** | Al completar 6 dígitos |
| **Reenvío** | Timer 30-60s, luego "Reenviar código" |
| **Expiración** | OTP válido 10 minutos |

**Backend:**
```typescript
supabase.auth.verifyOtp({ phone, token, type: 'sms' })
// Si OK: session + access_token + refresh_token
// Trigger: handle_new_user() crea perfil automático
```

**Seguridad:**
- 3 intentos fallidos → 5min espera
- 5 intentos fallidos → 30min espera
- 10 intentos fallidos → Bloqueo manual
- Audit log con phone_hash (SHA256)

---

### 1.5 Crear Perfil
| Aspecto | Especificación |
|---------|----------------|
| **Título** | "¿Cómo te llamamos?" |
| **Campo nombre** | Solo primero, 20 chars max, requerido |
| **Avatar** | Opcional, placeholder atractivo |
| **CTA** | "Continuar" (funciona sin foto) |

**NO pedir:** apellido, username, edad, género, email, bio

**Frontend:**
- Avatar: `expo-image-picker` → `expo-image-manipulator` (resize 400px, compress 0.7)
- Upload: `FileSystem.uploadAsync()` o presigned URL a Supabase Storage

**Backend:**
```sql
UPDATE profiles SET 
  display_name = $1,
  avatar_url = $2,
  onboarding_completed = true
WHERE id = auth.uid();
```

---

### 1.6 Permisos
| Aspecto | Especificación |
|---------|----------------|
| **Método** | **Just-in-time** (en contexto de uso) |
| **NO hacer** | Pantalla dedicada pidiendo todo junto |

**Cuándo pedir cada permiso:**
| Permiso | Momento |
|---------|---------|
| Notificaciones | Después de primera canción escuchada |
| Micrófono | Al intentar grabar audio |
| Contactos | Al ir a "Invitar amigos" |
| Ubicación | Al filtrar "Cerca de mí" |

**Legal:** Mostrar card explicativa ANTES del prompt nativo del sistema.

---

## 🔥 PUNTOS DE DEBATE RESUELTOS

### Debate 1: ¿Permisos en pantalla dedicada o just-in-time?
- **Producto:** Pantalla única "Permitir todo" es más rápido
- **Legal:** Just-in-time es mejor práctica RGPD
- **Resolución:** ✅ **Just-in-time** — Legal tiene razón, mejor conversión a largo plazo

### Debate 2: ¿Checkbox edad visible o implícito?
- **Producto:** Fricción innecesaria
- **Legal:** Obligatorio por LOPD-GDD España (14 años)
- **Resolución:** ✅ **Checkbox visible** — Requisito legal no negociable

### Debate 3: ¿Email de respaldo?
- **Backend:** Útil para recovery
- **Producto:** Fricción innecesaria, WhatsApp no lo pide
- **Resolución:** ✅ **No pedir email** — El teléfono es suficiente

---

## 📊 MÉTRICAS TARGET

| Pantalla | Conversion Rate |
|----------|-----------------|
| Splash → Slides | 99% |
| Slides → Login | 85% |
| Login → OTP | 90% |
| OTP → Perfil | 95% |
| Perfil → Home | 92% |
| **Total funnel** | **67%** |

---

## 🛠️ STACK TÉCNICO

### Librerías NPM
```bash
npm install react-native-reanimated react-native-gesture-handler
npm install react-native-pager-view
npm install @tanstack/react-query zustand zod react-hook-form
npm install expo-image-picker expo-image-manipulator
npm install expo-secure-store
```

### Estructura Navegación
```
app/
├── (auth)/
│   ├── _layout.tsx      → Stack con animación fade
│   ├── splash.tsx
│   ├── onboarding.tsx
│   ├── phone.tsx
│   ├── otp.tsx
│   └── profile.tsx
```

### Tablas Supabase
```sql
-- profiles (ya existe, verificar campos)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  permissions JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  age_confirmed BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
CREATE POLICY "Users own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Trigger auto-crear perfil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Audit log
CREATE TABLE auth_events (
  id UUID DEFAULT gen_random_uuid(),
  phone_hash TEXT,
  event_type TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## ✅ APROBACIÓN

**Especificaciones listas para:**
1. [ ] Validación de Ángel
2. [ ] Creación de mockups visuales
3. [ ] Picar código

---

**Reunión completada:** 3 Feb 2026 21:55  
**Método:** 4 sub-agentes en paralelo, consolidado por Tanque  
**Siguiente:** Repetir método para reuniones 2-6
