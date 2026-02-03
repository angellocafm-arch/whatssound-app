-- ============================================================
-- WhatsSound — Private Chat Tables
-- ============================================================

-- Conversations table
CREATE TABLE ws_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('private', 'group')),
  name TEXT, -- NULL for private chats
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation members
CREATE TABLE ws_conversation_members (
  conversation_id UUID NOT NULL REFERENCES ws_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

-- Private messages
CREATE TABLE ws_private_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ws_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  encrypted_content TEXT, -- For future E2E encryption
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'audio', 'system')) DEFAULT 'text',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE ws_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES ws_profiles(id) ON DELETE CASCADE,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

-- Invite system
CREATE TABLE ws_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL CHECK (char_length(code) = 8),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_name TEXT NOT NULL,
  invitee_country TEXT NOT NULL,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_conversations_updated_at ON ws_conversations(updated_at DESC);
CREATE INDEX idx_conversation_members_user_id ON ws_conversation_members(user_id);
CREATE INDEX idx_private_messages_conversation_id ON ws_private_messages(conversation_id, created_at DESC);
CREATE INDEX idx_contacts_user_id ON ws_contacts(user_id);
CREATE INDEX idx_invites_code ON ws_invites(code);
CREATE INDEX idx_invites_creator_id ON ws_invites(creator_id);

-- ============================================================
-- RLS POLICIES (permissive like existing tables)
-- ============================================================

-- Enable RLS
ALTER TABLE ws_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_invites ENABLE ROW LEVEL SECURITY;

-- Permissive policies (same pattern as existing tables)
CREATE POLICY "ws_conversations_policy" ON ws_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ws_conversation_members_policy" ON ws_conversation_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ws_private_messages_policy" ON ws_private_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ws_contacts_policy" ON ws_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ws_invites_policy" ON ws_invites FOR ALL USING (true) WITH CHECK (true);

-- Add tables to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE ws_private_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE ws_conversations;