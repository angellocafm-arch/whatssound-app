-- ============================================================
-- WhatsSound — Initial Database Schema
-- Based on: docs/desarrollo-final/arquitectura/estructura-datos.md
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE music_service AS ENUM ('spotify', 'apple_music', 'youtube_music', 'deezer');
CREATE TYPE session_role AS ENUM ('dj', 'moderator', 'vip', 'listener');
CREATE TYPE song_status AS ENUM ('pending', 'queued', 'playing', 'played', 'rejected', 'skipped');
CREATE TYPE tip_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE message_type AS ENUM ('text', 'audio', 'song_share', 'system', 'dj_announce', 'tip_announce', 'image');

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================

CREATE TABLE ws_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone           TEXT UNIQUE,
  display_name    TEXT NOT NULL CHECK (char_length(display_name) <= 25),
  username        TEXT UNIQUE CHECK (char_length(username) <= 30),
  bio             TEXT CHECK (char_length(bio) <= 140),
  avatar_url      TEXT,
  is_dj           BOOLEAN DEFAULT FALSE,
  dj_name         TEXT CHECK (char_length(dj_name) <= 30),
  dj_bio          TEXT CHECK (char_length(dj_bio) <= 200),
  dj_avatar_url   TEXT,
  genres          TEXT[] DEFAULT '{}',
  music_service   music_service,
  music_service_id TEXT,
  is_verified     BOOLEAN DEFAULT FALSE,
  last_seen       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON ws_profiles(username);
CREATE INDEX idx_profiles_is_dj ON ws_profiles(is_dj) WHERE is_dj = TRUE;

-- ============================================================
-- SESSIONS
-- ============================================================

CREATE TABLE ws_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL CHECK (char_length(code) <= 8),
  name            TEXT NOT NULL CHECK (char_length(name) <= 40),
  description     TEXT CHECK (char_length(description) <= 200),
  cover_url       TEXT,
  genres          TEXT[] DEFAULT '{}',
  is_private      BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  tips_enabled    BOOLEAN DEFAULT TRUE,
  chat_enabled    BOOLEAN DEFAULT TRUE,
  requests_enabled BOOLEAN DEFAULT TRUE,
  auto_approve    BOOLEAN DEFAULT TRUE,
  max_songs_per_user INT DEFAULT 3 CHECK (max_songs_per_user >= 1 AND max_songs_per_user <= 10),
  slow_mode_seconds INT CHECK (slow_mode_seconds IS NULL OR slow_mode_seconds >= 0),
  dj_id           UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_active ON ws_sessions(is_active, started_at DESC);
CREATE INDEX idx_sessions_code ON ws_sessions(code);
CREATE INDEX idx_sessions_dj ON ws_sessions(dj_id);

-- ============================================================
-- SESSION MEMBERS
-- ============================================================

CREATE TABLE ws_session_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES ws_sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  role            session_role DEFAULT 'listener',
  is_muted        BOOLEAN DEFAULT FALSE,
  muted_until     TIMESTAMPTZ,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  left_at         TIMESTAMPTZ,
  UNIQUE(user_id, session_id)
);

CREATE INDEX idx_members_session ON ws_session_members(session_id) WHERE left_at IS NULL;
CREATE INDEX idx_members_user ON ws_session_members(user_id);

-- ============================================================
-- SONG REQUESTS (Cola de canciones)
-- ============================================================

CREATE TABLE ws_songs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES ws_sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  external_id     TEXT NOT NULL,                          -- Deezer/Spotify track ID
  title           TEXT NOT NULL CHECK (char_length(title) <= 200),
  artist          TEXT NOT NULL CHECK (char_length(artist) <= 200),
  album_art       TEXT,
  duration_ms     INT NOT NULL CHECK (duration_ms > 0),
  preview_url     TEXT,
  status          song_status DEFAULT 'pending',
  message         TEXT CHECK (char_length(message) <= 200),
  has_tip         BOOLEAN DEFAULT FALSE,
  vote_count      INT DEFAULT 0,                          -- Denormalized for sorting
  played_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, external_id)                         -- No duplicates per session
);

CREATE INDEX idx_songs_session_status ON ws_songs(session_id, status);
CREATE INDEX idx_songs_session_votes ON ws_songs(session_id, vote_count DESC) WHERE status = 'queued';

-- ============================================================
-- VOTES
-- ============================================================

CREATE TABLE ws_votes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  song_id         UUID NOT NULL REFERENCES ws_songs(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  value           INT DEFAULT 1 CHECK (value IN (1, -1)),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, song_id)                                -- 1 vote per user per song
);

CREATE INDEX idx_votes_song ON ws_votes(song_id);

-- Trigger: update vote_count on ws_songs when vote is added/removed
CREATE OR REPLACE FUNCTION update_song_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ws_songs SET vote_count = vote_count + NEW.value WHERE id = NEW.song_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ws_songs SET vote_count = vote_count - OLD.value WHERE id = OLD.song_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE ws_songs SET vote_count = vote_count - OLD.value + NEW.value WHERE id = NEW.song_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vote_count
AFTER INSERT OR UPDATE OR DELETE ON ws_votes
FOR EACH ROW EXECUTE FUNCTION update_song_vote_count();

-- ============================================================
-- TIPS (Propinas)
-- ============================================================

CREATE TABLE ws_tips (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES ws_sessions(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  receiver_id     UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  song_id         UUID REFERENCES ws_songs(id) ON DELETE SET NULL,
  amount          DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  platform_fee    DECIMAL(10,2) DEFAULT 0,
  net_amount      DECIMAL(10,2) DEFAULT 0,
  currency        TEXT DEFAULT 'EUR' CHECK (char_length(currency) = 3),
  message         TEXT CHECK (char_length(message) <= 100),
  stripe_payment_id TEXT,
  status          tip_status DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tips_receiver ON ws_tips(receiver_id, created_at DESC);
CREATE INDEX idx_tips_session ON ws_tips(session_id);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================

CREATE TABLE ws_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES ws_sessions(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  type            message_type DEFAULT 'text',
  content         TEXT NOT NULL CHECK (char_length(content) <= 500),
  audio_url       TEXT,
  audio_duration_ms INT,
  is_pinned       BOOLEAN DEFAULT FALSE,
  is_deleted      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON ws_messages(session_id, created_at DESC);

-- ============================================================
-- REACTIONS (on messages)
-- ============================================================

CREATE TABLE ws_reactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id      UUID NOT NULL REFERENCES ws_messages(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  emoji           TEXT NOT NULL CHECK (char_length(emoji) <= 10),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id, emoji)
);

CREATE INDEX idx_reactions_message ON ws_reactions(message_id);

-- ============================================================
-- NOW PLAYING
-- ============================================================

CREATE TABLE ws_now_playing (
  session_id      UUID PRIMARY KEY REFERENCES ws_sessions(id) ON DELETE CASCADE,
  song_id         UUID NOT NULL REFERENCES ws_songs(id) ON DELETE CASCADE,
  progress_ms     INT DEFAULT 0,
  is_playing      BOOLEAN DEFAULT TRUE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REPORTS (for moderation)
-- ============================================================

CREATE TABLE ws_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id     UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES ws_profiles(id) ON DELETE CASCADE,
  session_id      UUID REFERENCES ws_sessions(id) ON DELETE CASCADE,
  message_id      UUID REFERENCES ws_messages(id) ON DELETE SET NULL,
  reason          TEXT NOT NULL CHECK (char_length(reason) <= 500),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolved_by     UUID REFERENCES ws_profiles(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON ws_reports(status) WHERE status != 'resolved';

-- ============================================================
-- FOLLOWS (DJ followers)
-- ============================================================

CREATE TABLE ws_follows (
  follower_id     UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  following_id    UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX idx_follows_following ON ws_follows(following_id);

-- ============================================================
-- USER SETTINGS
-- ============================================================

CREATE TABLE ws_user_settings (
  user_id                 UUID PRIMARY KEY REFERENCES ws_profiles(id) ON DELETE CASCADE,
  notifications_sessions  BOOLEAN DEFAULT TRUE,
  notifications_tips      BOOLEAN DEFAULT TRUE,
  notifications_mentions  BOOLEAN DEFAULT TRUE,
  notifications_followers BOOLEAN DEFAULT TRUE,
  show_last_seen          BOOLEAN DEFAULT TRUE,
  show_listening_activity BOOLEAN DEFAULT TRUE,
  theme                   TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  language                TEXT DEFAULT 'es' CHECK (char_length(language) = 2),
  audio_quality           TEXT DEFAULT 'high' CHECK (audio_quality IN ('low', 'medium', 'high')),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE ws_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_session_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_now_playing ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "Profiles are viewable by everyone" ON ws_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON ws_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON ws_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Sessions: public read, DJ can manage own
CREATE POLICY "Active sessions are viewable" ON ws_sessions FOR SELECT USING (true);
CREATE POLICY "DJs can create sessions" ON ws_sessions FOR INSERT WITH CHECK (auth.uid() = dj_id);
CREATE POLICY "DJs can update own sessions" ON ws_sessions FOR UPDATE USING (auth.uid() = dj_id);

-- Members: visible to session participants
CREATE POLICY "Members visible to all" ON ws_session_members FOR SELECT USING (true);
CREATE POLICY "Users can join sessions" ON ws_session_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave sessions" ON ws_session_members FOR UPDATE USING (auth.uid() = user_id);

-- Songs: visible in session, users can request
CREATE POLICY "Songs visible to all" ON ws_songs FOR SELECT USING (true);
CREATE POLICY "Users can request songs" ON ws_songs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Votes: visible, users can vote
CREATE POLICY "Votes visible" ON ws_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON ws_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change vote" ON ws_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove vote" ON ws_votes FOR DELETE USING (auth.uid() = user_id);

-- Tips: sender and receiver can see
CREATE POLICY "Tips visible to sender/receiver" ON ws_tips FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send tips" ON ws_tips FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Messages: visible in session
CREATE POLICY "Messages visible to all" ON ws_messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages" ON ws_messages FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Reactions: visible, users can react
CREATE POLICY "Reactions visible" ON ws_reactions FOR SELECT USING (true);
CREATE POLICY "Users can react" ON ws_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove reaction" ON ws_reactions FOR DELETE USING (auth.uid() = user_id);

-- Now Playing: public read, DJ can update
CREATE POLICY "Now playing visible" ON ws_now_playing FOR SELECT USING (true);

-- Reports: user can create, admins can see
CREATE POLICY "Users can report" ON ws_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can see own reports" ON ws_reports FOR SELECT USING (auth.uid() = reporter_id);

-- Follows: public read, users manage own
CREATE POLICY "Follows visible" ON ws_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON ws_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON ws_follows FOR DELETE USING (auth.uid() = follower_id);

-- Settings: own only
CREATE POLICY "Users see own settings" ON ws_user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own settings" ON ws_user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users modify own settings" ON ws_user_settings FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Auto-generate session code
CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS TRIGGER AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INT;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    LOOP
      code := '';
      FOR i IN 1..6 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM ws_sessions WHERE ws_sessions.code = code);
    END LOOP;
    NEW.code := code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_session_code
BEFORE INSERT ON ws_sessions
FOR EACH ROW EXECUTE FUNCTION generate_session_code();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated ON ws_profiles
BEFORE UPDATE FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_settings_updated ON ws_user_settings
BEFORE UPDATE FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_now_playing_updated ON ws_now_playing
BEFORE UPDATE FOR EACH ROW EXECUTE FUNCTION update_updated_at();
