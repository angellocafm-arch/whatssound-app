-- ============================================
-- RLS Production Hardening Migration
-- Applied: 2026-03-21 22:47-22:51 UTC
-- ============================================
-- All policies below were applied directly to Supabase.
-- This file documents the changes for version control.

-- T4.1: ws_messages INSERT → auth.uid() = author_id
DROP POLICY IF EXISTS "Allow send messages" ON ws_messages;
CREATE POLICY "Allow send messages" ON ws_messages
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- T4.2: ws_songs INSERT → authenticated only
DROP POLICY IF EXISTS "Allow request songs" ON ws_songs;
CREATE POLICY "Allow request songs" ON ws_songs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- T4.3: ws_votes INSERT → auth.uid() = user_id
DROP POLICY IF EXISTS "Allow vote" ON ws_votes;
CREATE POLICY "Allow vote" ON ws_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- T4.4: ws_tips INSERT → auth.uid() = sender_id
DROP POLICY IF EXISTS "Allow send tips" ON ws_tips;
CREATE POLICY "Allow send tips" ON ws_tips
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- T4.5: ws_session_members INSERT → auth.uid() = user_id
DROP POLICY IF EXISTS "Allow join sessions" ON ws_session_members;
CREATE POLICY "Allow join sessions" ON ws_session_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- T4.6a: ws_contacts → scoped CRUD
DROP POLICY IF EXISTS "ws_contacts_policy" ON ws_contacts;
CREATE POLICY "ws_contacts_select" ON ws_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ws_contacts_insert" ON ws_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ws_contacts_update" ON ws_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ws_contacts_delete" ON ws_contacts FOR DELETE USING (auth.uid() = user_id);

-- T4.6b: ws_conversations → scoped to members
DROP POLICY IF EXISTS "ws_conversations_policy" ON ws_conversations;
CREATE POLICY "ws_conversations_select" ON ws_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ws_conversation_members
      WHERE ws_conversation_members.conversation_id = ws_conversations.id
        AND ws_conversation_members.user_id = auth.uid()
    )
  );
CREATE POLICY "ws_conversations_insert" ON ws_conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- T4.6c: ws_conversation_members → scoped to own membership
DROP POLICY IF EXISTS "ws_conversation_members_policy" ON ws_conversation_members;
CREATE POLICY "ws_conversation_members_select" ON ws_conversation_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ws_conversation_members_insert" ON ws_conversation_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ws_conversation_members_delete" ON ws_conversation_members FOR DELETE USING (auth.uid() = user_id);

-- T4.6d: ws_invites → scoped to creator
DROP POLICY IF EXISTS "ws_invites_policy" ON ws_invites;
CREATE POLICY "ws_invites_select" ON ws_invites FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = used_by);
CREATE POLICY "ws_invites_insert" ON ws_invites FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "ws_invites_update" ON ws_invites FOR UPDATE USING (auth.uid() IS NOT NULL);

-- T4.7: ws_subscriptions → remove permissive ALL (service_role bypasses RLS)
DROP POLICY IF EXISTS "Service can manage subscriptions" ON ws_subscriptions;

-- T4.8: Additional fixes from security audit
DROP POLICY IF EXISTS "System can update referrals" ON ws_referrals;
DROP POLICY IF EXISTS "System can insert user badges" ON ws_user_badges;
ALTER FUNCTION public.get_user_chat_ids SET search_path = public;
