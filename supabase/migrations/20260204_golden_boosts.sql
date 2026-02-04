-- ============================================
-- WhatsSound — Golden Boost System
-- Migración: 2026-02-04
-- ============================================

-- ============================================
-- TABLA: ws_golden_boosts
-- Registro de Golden Boosts dados
-- ============================================

CREATE TABLE IF NOT EXISTS ws_golden_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Quién da el Golden Boost
  from_user_id UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  
  -- Quién recibe (el DJ)
  to_dj_id UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  
  -- Sesión donde se dio (opcional, puede ser desde perfil)
  session_id UUID REFERENCES ws_sessions(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Mensaje opcional del usuario
  message TEXT,
  
  -- Constraints
  CONSTRAINT no_self_boost CHECK (from_user_id != to_dj_id)
);

-- Índices para queries frecuentes
CREATE INDEX idx_golden_boosts_from_user ON ws_golden_boosts(from_user_id);
CREATE INDEX idx_golden_boosts_to_dj ON ws_golden_boosts(to_dj_id);
CREATE INDEX idx_golden_boosts_session ON ws_golden_boosts(session_id);
CREATE INDEX idx_golden_boosts_created ON ws_golden_boosts(created_at DESC);

-- Índice para verificar si ya dio boost esta semana
CREATE INDEX idx_golden_boosts_weekly ON ws_golden_boosts(
  from_user_id, 
  DATE_TRUNC('week', created_at)
);

-- ============================================
-- CAMPOS EN ws_profiles
-- Contadores y estado de Golden Boost
-- ============================================

-- Golden Boosts disponibles para dar
ALTER TABLE ws_profiles 
ADD COLUMN IF NOT EXISTS golden_boost_available INT DEFAULT 1;

-- Último reset de Golden Boost (domingo)
ALTER TABLE ws_profiles 
ADD COLUMN IF NOT EXISTS golden_boost_last_reset TIMESTAMPTZ DEFAULT now();

-- Total de Golden Boosts recibidos (lifetime)
ALTER TABLE ws_profiles 
ADD COLUMN IF NOT EXISTS golden_boosts_received INT DEFAULT 0;

-- Total de Golden Boosts dados (lifetime)
ALTER TABLE ws_profiles 
ADD COLUMN IF NOT EXISTS golden_boosts_given INT DEFAULT 0;

-- Sesiones únicas escuchadas esta semana (para acelerador)
ALTER TABLE ws_profiles 
ADD COLUMN IF NOT EXISTS sessions_listened_this_week INT DEFAULT 0;

-- Último reset del contador de sesiones
ALTER TABLE ws_profiles 
ADD COLUMN IF NOT EXISTS sessions_listened_reset TIMESTAMPTZ DEFAULT now();

-- Badge actual basado en Golden Boosts recibidos
-- 'none', 'rising_star', 'fan_favorite', 'verified', 'hall_of_fame'
ALTER TABLE ws_profiles 
ADD COLUMN IF NOT EXISTS golden_badge TEXT DEFAULT 'none';

-- ============================================
-- TRIGGER: Al dar Golden Boost
-- Actualiza contadores automáticamente
-- ============================================

CREATE OR REPLACE FUNCTION handle_golden_boost_given()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar que el usuario tiene Golden Boost disponible
  IF (SELECT golden_boost_available FROM ws_profiles WHERE id = NEW.from_user_id) < 1 THEN
    RAISE EXCEPTION 'No tienes Golden Boosts disponibles';
  END IF;
  
  -- Decrementar disponible del que da
  UPDATE ws_profiles 
  SET 
    golden_boost_available = golden_boost_available - 1,
    golden_boosts_given = golden_boosts_given + 1
  WHERE id = NEW.from_user_id;
  
  -- Incrementar recibidos del DJ
  UPDATE ws_profiles 
  SET golden_boosts_received = golden_boosts_received + 1
  WHERE id = NEW.to_dj_id;
  
  -- Actualizar badge del DJ si corresponde
  PERFORM update_golden_badge(NEW.to_dj_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_golden_boost_given
BEFORE INSERT ON ws_golden_boosts
FOR EACH ROW EXECUTE FUNCTION handle_golden_boost_given();

-- ============================================
-- FUNCIÓN: Actualizar badge según Golden Boosts
-- ============================================

CREATE OR REPLACE FUNCTION update_golden_badge(profile_id UUID)
RETURNS VOID AS $$
DECLARE
  total_received INT;
  new_badge TEXT;
BEGIN
  SELECT golden_boosts_received INTO total_received
  FROM ws_profiles WHERE id = profile_id;
  
  new_badge := CASE
    WHEN total_received >= 500 THEN 'hall_of_fame'
    WHEN total_received >= 100 THEN 'verified'
    WHEN total_received >= 50 THEN 'fan_favorite'
    WHEN total_received >= 10 THEN 'rising_star'
    ELSE 'none'
  END;
  
  UPDATE ws_profiles 
  SET golden_badge = new_badge
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Reset semanal de Golden Boosts
-- Ejecutar con pg_cron cada domingo a las 00:00
-- ============================================

CREATE OR REPLACE FUNCTION reset_weekly_golden_boosts()
RETURNS VOID AS $$
BEGIN
  UPDATE ws_profiles
  SET 
    golden_boost_available = 1,
    golden_boost_last_reset = now(),
    sessions_listened_this_week = 0,
    sessions_listened_reset = now()
  WHERE golden_boost_last_reset < DATE_TRUNC('week', now());
  
  RAISE NOTICE 'Golden Boosts reseteados para la semana';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Acelerador - dar +1 si escuchó 5 sesiones
-- ============================================

CREATE OR REPLACE FUNCTION check_golden_boost_accelerator(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  sessions_count INT;
  already_accelerated BOOLEAN;
BEGIN
  SELECT sessions_listened_this_week INTO sessions_count
  FROM ws_profiles WHERE id = user_id;
  
  -- Si llegó a 5 sesiones y aún no tiene el bonus
  IF sessions_count >= 5 THEN
    -- Verificar si ya recibió el bonus esta semana
    -- (tendría más de 1 disponible solo si compró o recibió bonus)
    UPDATE ws_profiles
    SET 
      golden_boost_available = golden_boost_available + 1,
      sessions_listened_this_week = 0  -- Reset para no dar doble
    WHERE id = user_id
    AND sessions_listened_this_week >= 5;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Registrar sesión escuchada
-- Llamar cuando un usuario entra a una sesión
-- ============================================

CREATE OR REPLACE FUNCTION register_session_listened(
  p_user_id UUID,
  p_session_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Incrementar contador si es una sesión nueva esta semana
  -- (evitar contar la misma sesión múltiples veces)
  UPDATE ws_profiles
  SET sessions_listened_this_week = sessions_listened_this_week + 1
  WHERE id = p_user_id
  AND NOT EXISTS (
    SELECT 1 FROM ws_session_listeners
    WHERE user_id = p_user_id 
    AND session_id = p_session_id
    AND joined_at > DATE_TRUNC('week', now())
  );
  
  -- Verificar si ganó el acelerador
  PERFORM check_golden_boost_accelerator(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE ws_golden_boosts ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver Golden Boosts (son públicos)
CREATE POLICY "golden_boosts_select_all"
ON ws_golden_boosts FOR SELECT
USING (true);

-- Solo puedes dar si eres el from_user_id
CREATE POLICY "golden_boosts_insert_own"
ON ws_golden_boosts FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- No se pueden editar
CREATE POLICY "golden_boosts_no_update"
ON ws_golden_boosts FOR UPDATE
USING (false);

-- No se pueden borrar
CREATE POLICY "golden_boosts_no_delete"
ON ws_golden_boosts FOR DELETE
USING (false);

-- ============================================
-- VISTA: Leaderboard de Golden Boosts
-- ============================================

CREATE OR REPLACE VIEW ws_golden_boost_leaderboard AS
SELECT 
  p.id,
  p.display_name,
  p.avatar_url,
  p.golden_boosts_received,
  p.golden_badge,
  RANK() OVER (ORDER BY p.golden_boosts_received DESC) as rank
FROM ws_profiles p
WHERE p.golden_boosts_received > 0
ORDER BY p.golden_boosts_received DESC;

-- ============================================
-- VISTA: Golden Boosts de esta semana
-- ============================================

CREATE OR REPLACE VIEW ws_golden_boosts_this_week AS
SELECT 
  gb.*,
  giver.display_name as giver_name,
  giver.avatar_url as giver_avatar,
  receiver.display_name as receiver_name,
  receiver.avatar_url as receiver_avatar
FROM ws_golden_boosts gb
JOIN ws_profiles giver ON gb.from_user_id = giver.id
JOIN ws_profiles receiver ON gb.to_dj_id = receiver.id
WHERE gb.created_at >= DATE_TRUNC('week', now())
ORDER BY gb.created_at DESC;

-- ============================================
-- GRANT permisos
-- ============================================

GRANT SELECT ON ws_golden_boost_leaderboard TO authenticated;
GRANT SELECT ON ws_golden_boosts_this_week TO authenticated;
