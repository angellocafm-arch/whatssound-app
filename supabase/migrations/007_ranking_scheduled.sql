-- =====================================================
-- MIGRACIÓN 007: DJ Ranking + Sesiones Programadas
-- WhatsSound — 4 Feb 2026
-- =====================================================

-- -----------------------------------------------------
-- 1. FUNCIÓN: Top DJs de la semana
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_top_djs_weekly(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  avatar_url TEXT,
  dj_verified BOOLEAN,
  total_listeners BIGINT,
  total_tips NUMERIC,
  sessions_count BIGINT,
  score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH weekly_stats AS (
    SELECT 
      s.dj_id,
      COUNT(DISTINCT sm.user_id) as listeners,
      COALESCE(SUM(t.amount), 0) as tips,
      COUNT(DISTINCT s.id) as sessions
    FROM ws_sessions s
    LEFT JOIN ws_session_members sm ON s.id = sm.session_id
    LEFT JOIN ws_tips t ON s.id = t.session_id AND t.payment_status = 'succeeded'
    WHERE s.created_at > NOW() - INTERVAL '7 days'
    GROUP BY s.dj_id
  )
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    COALESCE(p.dj_verified, false),
    COALESCE(ws.listeners, 0)::BIGINT,
    COALESCE(ws.tips, 0),
    COALESCE(ws.sessions, 0)::BIGINT,
    (COALESCE(ws.listeners, 0) * 0.5 + COALESCE(ws.tips, 0) * 2 + COALESCE(ws.sessions, 0) * 10) as score
  FROM ws_profiles p
  LEFT JOIN weekly_stats ws ON p.id = ws.dj_id
  WHERE p.is_dj = true
  ORDER BY score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------
-- 2. TABLA: Sesiones Programadas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ws_scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dj_id UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  genres TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  max_attendees INTEGER,
  entry_fee DECIMAL(10,2) DEFAULT 0, -- 0 = gratis
  status TEXT DEFAULT 'scheduled', -- scheduled, live, ended, cancelled
  session_id UUID REFERENCES ws_sessions(id), -- Se llena cuando empieza
  notify_before_minutes INTEGER DEFAULT 15,
  notified_at TIMESTAMPTZ, -- Cuando se envió notificación
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scheduled_upcoming ON ws_scheduled_sessions(scheduled_at) 
  WHERE status = 'scheduled';
CREATE INDEX idx_scheduled_dj ON ws_scheduled_sessions(dj_id);
CREATE INDEX idx_scheduled_status ON ws_scheduled_sessions(status);

ALTER TABLE ws_scheduled_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Sesiones programadas públicas visibles" 
  ON ws_scheduled_sessions FOR SELECT 
  USING (is_public = true OR dj_id = auth.uid());

CREATE POLICY "DJs pueden crear sesiones programadas" 
  ON ws_scheduled_sessions FOR INSERT 
  WITH CHECK (auth.uid() = dj_id);

CREATE POLICY "DJs pueden editar sus sesiones programadas" 
  ON ws_scheduled_sessions FOR UPDATE 
  USING (auth.uid() = dj_id);

CREATE POLICY "DJs pueden cancelar sus sesiones programadas" 
  ON ws_scheduled_sessions FOR DELETE 
  USING (auth.uid() = dj_id);

-- -----------------------------------------------------
-- 3. TABLA: Suscripciones a sesiones programadas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ws_session_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_session_id UUID NOT NULL REFERENCES ws_scheduled_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  notify BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(scheduled_session_id, user_id)
);

CREATE INDEX idx_subscriptions_session ON ws_session_subscriptions(scheduled_session_id);
CREATE INDEX idx_subscriptions_user ON ws_session_subscriptions(user_id);

ALTER TABLE ws_session_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus suscripciones" 
  ON ws_session_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden suscribirse" 
  ON ws_session_subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden desuscribirse" 
  ON ws_session_subscriptions FOR DELETE 
  USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- 4. FUNCIÓN: Próximas sesiones (de DJs que sigo)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_upcoming_sessions(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  dj_id UUID,
  dj_name TEXT,
  dj_avatar TEXT,
  dj_verified BOOLEAN,
  name TEXT,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  genres TEXT[],
  subscriber_count BIGINT,
  is_subscribed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.dj_id,
    p.display_name as dj_name,
    p.avatar_url as dj_avatar,
    COALESCE(p.dj_verified, false),
    ss.name,
    ss.description,
    ss.scheduled_at,
    ss.genres,
    (SELECT COUNT(*) FROM ws_session_subscriptions WHERE scheduled_session_id = ss.id) as subscriber_count,
    EXISTS(SELECT 1 FROM ws_session_subscriptions WHERE scheduled_session_id = ss.id AND user_id = user_uuid) as is_subscribed
  FROM ws_scheduled_sessions ss
  JOIN ws_profiles p ON ss.dj_id = p.id
  WHERE ss.status = 'scheduled'
    AND ss.scheduled_at > NOW()
    AND ss.is_public = true
  ORDER BY 
    -- Primero los de DJs que sigo
    CASE WHEN EXISTS(SELECT 1 FROM ws_follows WHERE follower_id = user_uuid AND following_id = ss.dj_id) THEN 0 ELSE 1 END,
    ss.scheduled_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------
-- 5. AÑADIR dj_verified a ws_profiles si no existe
-- -----------------------------------------------------
ALTER TABLE ws_profiles ADD COLUMN IF NOT EXISTS dj_verified BOOLEAN DEFAULT false;

-- -----------------------------------------------------
-- 6. TRIGGER: Actualizar updated_at
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scheduled_sessions_updated_at
  BEFORE UPDATE ON ws_scheduled_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- 7. SEED DATA: Sesiones programadas de ejemplo
-- -----------------------------------------------------
INSERT INTO ws_scheduled_sessions (dj_id, name, description, scheduled_at, genres, duration_minutes)
SELECT 
  id,
  'Viernes Latino 🔥',
  '¡La mejor sesión de reggaetón y música latina! No te la pierdas.',
  NOW() + INTERVAL '2 days' + INTERVAL '22 hours',
  ARRAY['reggaeton', 'latin', 'dembow'],
  180
FROM ws_profiles 
WHERE display_name LIKE '%Carlos%' OR is_dj = true
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ws_scheduled_sessions (dj_id, name, description, scheduled_at, genres, duration_minutes)
SELECT 
  id,
  'Chill Sunday 🌤️',
  'Música relajada para terminar el fin de semana.',
  NOW() + INTERVAL '4 days' + INTERVAL '18 hours',
  ARRAY['chill', 'lofi', 'ambient'],
  120
FROM ws_profiles 
WHERE is_dj = true
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- FIN MIGRACIÓN 007
-- =====================================================
