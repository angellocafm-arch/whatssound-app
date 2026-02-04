-- ============================================================
-- WhatsSound — Revenue Ready Migration
-- Fase: V4.1
-- Fecha: 2026-02-04
-- ============================================================

-- 1. ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('tip', 'golden_boost', 'permanent_sponsor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('dj_live', 'tip_received', 'mention', 'golden_boost_received', 'boost_available');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TABLA: ws_transactions
-- ============================================================

CREATE TABLE IF NOT EXISTS ws_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo y estado
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'pending',
  
  -- Participantes
  from_user_id UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES ws_profiles(id) ON DELETE SET NULL,
  
  -- Montos (en centavos)
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  fee_cents INT NOT NULL DEFAULT 0,
  net_cents INT NOT NULL DEFAULT 0,
  
  -- Stripe (futuro)
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transactions_from ON ws_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON ws_transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON ws_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON ws_transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON ws_transactions(created_at DESC);

-- RLS
ALTER TABLE ws_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_transactions" ON ws_transactions;
CREATE POLICY "users_view_own_transactions" ON ws_transactions
FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "service_manage_transactions" ON ws_transactions;
CREATE POLICY "service_manage_transactions" ON ws_transactions
FOR ALL USING (true) WITH CHECK (true);

-- 3. TABLA: ws_push_tokens
-- ============================================================

CREATE TABLE IF NOT EXISTS ws_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_token UNIQUE (user_id, expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON ws_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON ws_push_tokens(is_active) WHERE is_active = true;

ALTER TABLE ws_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_tokens" ON ws_push_tokens;
CREATE POLICY "users_manage_own_tokens" ON ws_push_tokens
FOR ALL USING (auth.uid() = user_id);

-- 4. TABLA: ws_notifications_log
-- ============================================================

CREATE TABLE IF NOT EXISTS ws_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status notification_status DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON ws_notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON ws_notifications_log(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON ws_notifications_log(created_at DESC);

ALTER TABLE ws_notifications_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_notifications" ON ws_notifications_log;
CREATE POLICY "users_view_own_notifications" ON ws_notifications_log
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_manage_notifications" ON ws_notifications_log;
CREATE POLICY "service_manage_notifications" ON ws_notifications_log
FOR ALL USING (true) WITH CHECK (true);

-- 5. TABLA: ws_audit_log
-- ============================================================

CREATE TABLE IF NOT EXISTS ws_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  user_id UUID REFERENCES ws_profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON ws_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON ws_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_user ON ws_audit_log(user_id);

ALTER TABLE ws_audit_log ENABLE ROW LEVEL SECURITY;

-- Solo lectura para usuarios autenticados (admins verán todo via service_role)
DROP POLICY IF EXISTS "authenticated_view_audit" ON ws_audit_log;
CREATE POLICY "authenticated_view_audit" ON ws_audit_log
FOR SELECT USING (auth.role() = 'authenticated');

-- 6. MODIFICAR ws_profiles
-- ============================================================

ALTER TABLE ws_profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Marcar admins
UPDATE ws_profiles SET is_admin = true WHERE username IN ('angel', 'kike');

-- 7. VERIFICACIÓN
-- ============================================================

SELECT 'Revenue Ready Migration Completed!' as status;
