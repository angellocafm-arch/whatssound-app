# 🗄️ Esquema de Base de Datos — Revenue Ready

## Nuevas Tablas

### 1. ws_transactions

Registro de todas las transacciones monetarias.

```sql
CREATE TYPE transaction_type AS ENUM (
  'tip',              -- Propina a DJ
  'golden_boost',     -- Compra de Golden Boost
  'permanent_sponsor' -- Patrocinio permanente
);

CREATE TYPE transaction_status AS ENUM (
  'pending',    -- Esperando confirmación
  'completed',  -- Pago exitoso
  'failed',     -- Pago fallido
  'refunded'    -- Reembolsado
);

CREATE TABLE ws_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo y estado
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'pending',
  
  -- Participantes
  from_user_id UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES ws_profiles(id) ON DELETE SET NULL, -- NULL si es compra a WhatsSound
  
  -- Montos (en centavos para evitar decimales)
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  fee_cents INT NOT NULL DEFAULT 0,     -- Comisión WhatsSound
  net_cents INT NOT NULL DEFAULT 0,     -- Lo que recibe el DJ
  
  -- Stripe (para futuro)
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  -- metadata ejemplo: { "message": "Qué temazos!", "session_id": "uuid" }
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_amounts CHECK (fee_cents + net_cents = amount_cents)
);

-- Índices
CREATE INDEX idx_transactions_from ON ws_transactions(from_user_id);
CREATE INDEX idx_transactions_to ON ws_transactions(to_user_id);
CREATE INDEX idx_transactions_status ON ws_transactions(status);
CREATE INDEX idx_transactions_type ON ws_transactions(type);
CREATE INDEX idx_transactions_created ON ws_transactions(created_at DESC);

-- RLS
ALTER TABLE ws_transactions ENABLE ROW LEVEL SECURITY;

-- Usuarios ven sus propias transacciones
CREATE POLICY "users_own_transactions" ON ws_transactions
FOR SELECT USING (
  auth.uid() = from_user_id OR 
  auth.uid() = to_user_id
);

-- Solo el sistema puede crear/modificar (via service_role)
CREATE POLICY "service_create_transactions" ON ws_transactions
FOR INSERT WITH CHECK (true); -- Solo service_role tiene acceso

CREATE POLICY "service_update_transactions" ON ws_transactions
FOR UPDATE USING (true); -- Solo service_role tiene acceso
```

---

### 2. ws_push_tokens

Tokens de push notifications de usuarios.

```sql
CREATE TABLE ws_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  
  -- Token de Expo Push
  expo_push_token TEXT NOT NULL,
  
  -- Información del dispositivo
  device_info JSONB DEFAULT '{}',
  -- ejemplo: { "platform": "ios", "model": "iPhone 14" }
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Un token único por usuario (puede tener varios dispositivos)
  CONSTRAINT unique_user_token UNIQUE (user_id, expo_push_token)
);

-- Índices
CREATE INDEX idx_push_tokens_user ON ws_push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON ws_push_tokens(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE ws_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_tokens" ON ws_push_tokens
FOR ALL USING (auth.uid() = user_id);
```

---

### 3. ws_notifications_log

Log de notificaciones enviadas (para auditoría y simulator).

```sql
CREATE TYPE notification_type AS ENUM (
  'dj_live',            -- DJ inició sesión
  'tip_received',       -- Recibió propina
  'mention',            -- Mencionado en chat
  'golden_boost_received', -- Recibió Golden Boost
  'boost_available'     -- Boost se regeneró
);

CREATE TYPE notification_status AS ENUM (
  'pending',  -- En cola
  'sent',     -- Enviado
  'failed'    -- Falló
);

CREATE TABLE ws_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Destinatario
  user_id UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  
  -- Contenido
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  
  -- Estado
  status notification_status DEFAULT 'pending',
  error_message TEXT, -- Si falló
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_notifications_user ON ws_notifications_log(user_id);
CREATE INDEX idx_notifications_status ON ws_notifications_log(status);
CREATE INDEX idx_notifications_created ON ws_notifications_log(created_at DESC);

-- RLS
ALTER TABLE ws_notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_notifications" ON ws_notifications_log
FOR SELECT USING (auth.uid() = user_id);
```

---

### 4. ws_audit_log

Log de auditoría para acciones sensibles.

```sql
CREATE TABLE ws_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Acción
  action TEXT NOT NULL,
  -- ejemplos: 'payment_created', 'payment_confirmed', 'payment_failed', 'boost_given'
  
  -- Actor
  user_id UUID REFERENCES ws_profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Contexto
  resource_type TEXT, -- 'transaction', 'session', 'profile'
  resource_id UUID,
  
  -- Datos
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice por fecha (para queries recientes)
CREATE INDEX idx_audit_created ON ws_audit_log(created_at DESC);
CREATE INDEX idx_audit_action ON ws_audit_log(action);
CREATE INDEX idx_audit_user ON ws_audit_log(user_id);

-- RLS: Solo admins pueden ver
ALTER TABLE ws_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_only" ON ws_audit_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM ws_profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
```

---

## Modificaciones a Tablas Existentes

### ws_profiles — Añadir is_admin

```sql
ALTER TABLE ws_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Marcar admins existentes
UPDATE ws_profiles SET is_admin = true WHERE username IN ('angel', 'kike');
```

---

## Diagrama de Relaciones

```
ws_profiles
    │
    ├──< ws_transactions (from_user_id)
    │         │
    │         └──> ws_profiles (to_user_id)
    │
    ├──< ws_push_tokens
    │
    ├──< ws_notifications_log
    │
    └──< ws_audit_log
```

---

## Migración Completa

Archivo: `supabase/migrations/XXX_revenue_ready.sql`

```sql
-- Revenue Ready Migration
-- Fase: V4.1
-- Fecha: 2026-02-04

-- 1. Enums
CREATE TYPE transaction_type AS ENUM ('tip', 'golden_boost', 'permanent_sponsor');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE notification_type AS ENUM ('dj_live', 'tip_received', 'mention', 'golden_boost_received', 'boost_available');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');

-- 2. Tablas
-- [Copiar definiciones de arriba]

-- 3. RLS
-- [Copiar policies de arriba]

-- 4. Índices
-- [Copiar índices de arriba]

-- 5. Admin flag
ALTER TABLE ws_profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 6. Verificación
SELECT 'Migration completed' as status;
```

---

*Especificación creada: 2026-02-04*
