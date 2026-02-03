-- ============================================================
-- Seed Data Visibility System
-- Add is_seed flag to distinguish seed data from test data
-- ============================================================

-- Add is_seed column to all tables with seed data
ALTER TABLE ws_profiles ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE ws_sessions ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE ws_songs ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE ws_messages ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE ws_tips ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE ws_session_members ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE ws_now_playing ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE ws_follows ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE ws_user_settings ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;

-- Add is_visible column (controls whether seed data appears in queries)
ALTER TABLE ws_profiles ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
ALTER TABLE ws_sessions ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

-- Mark all existing seed data
UPDATE ws_profiles SET is_seed = TRUE WHERE id::text LIKE 'd0000001%' OR id::text LIKE 'a0000001%';
UPDATE ws_sessions SET is_seed = TRUE WHERE id::text LIKE 'b0000001%';
UPDATE ws_songs SET is_seed = TRUE WHERE id::text LIKE 'c0000001%' OR id::text LIKE 'c0000002%';
UPDATE ws_messages SET is_seed = TRUE WHERE session_id::text LIKE 'b0000001%';
UPDATE ws_tips SET is_seed = TRUE;
UPDATE ws_session_members SET is_seed = TRUE WHERE user_id::text NOT LIKE 'eeee%';
UPDATE ws_now_playing SET is_seed = TRUE;
UPDATE ws_follows SET is_seed = TRUE;
UPDATE ws_user_settings SET is_seed = TRUE;

-- Admin settings table for global config (seed visibility, etc.)
CREATE TABLE IF NOT EXISTS ws_admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ws_admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin settings readable" ON ws_admin_settings FOR SELECT USING (true);
CREATE POLICY "Admin settings writable" ON ws_admin_settings FOR ALL USING (true);

-- Default: seed data visible
INSERT INTO ws_admin_settings (key, value) VALUES ('seed_visible', 'true') ON CONFLICT (key) DO NOTHING;
