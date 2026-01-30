/**
 * WhatsSound — Chats (pestaña principal)
 * Lista de conversaciones reales desde Supabase (direct fetch)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';

const SUPABASE_URL = 'https://xyehncvvvprrqwnsefcr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTA4OTgsImV4cCI6MjA4NTIyNjg5OH0.VEaTmqpMA7XdUa-tZ7mXib1ciweD7y5UU4dFGZq3EtQ';

function getHeaders() {
  let token = '';
  try { token = JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').access_token || ''; } catch {}
  return { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token || ANON_KEY}`, 'Content-Type': 'application/json' };
}

function getCurrentUserId(): string {
  try { return JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').user?.id || ''; } catch { return ''; }
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online?: boolean;
  isGroup?: boolean;
}

interface Contact {
  id: string;
  display_name: string;
  username: string;
  is_dj: boolean;
}

// ── Chat item row ──
const ChatItem = ({ chat, onPress }: { chat: Chat; onPress: () => void }) => (
  <TouchableOpacity style={styles.chatItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.avatarWrap}>
      {chat.isGroup ? (
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '22', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="people" size={24} color={colors.primary} />
        </View>
      ) : (
        <Avatar name={chat.name} size="lg" />
      )}
      {chat.online && !chat.isGroup && <View style={styles.onlineDot} />}
    </View>
    <View style={styles.chatInfo}>
      <View style={styles.topRow}>
        <Text style={styles.chatName} numberOfLines={1}>{chat.name}</Text>
        <Text style={[styles.time, chat.unread > 0 && styles.timeActive]}>{chat.time}</Text>
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.lastMsg} numberOfLines={1}>{chat.lastMessage}</Text>
        {chat.unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{chat.unread}</Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

// ── Contact item row (for empty state) ──
const ContactItem = ({ contact, onPress }: { contact: Contact; onPress: () => void }) => (
  <TouchableOpacity style={styles.contactItem} onPress={onPress} activeOpacity={0.7}>
    <Avatar name={contact.display_name} size="lg" />
    <View style={styles.contactInfo}>
      <Text style={styles.contactName}>{contact.display_name}</Text>
      <Text style={styles.contactHandle}>@{contact.username} {contact.is_dj ? '🎧 DJ' : ''}</Text>
    </View>
    <View style={styles.startChatBtn}>
      <Ionicons name="chatbubble" size={18} color={colors.textOnPrimary} />
    </View>
  </TouchableOpacity>
);

export default function ChatsScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!currentUserId) { setLoading(false); return; }

      // Get all contacts (other users)
      const profilesRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=neq.${currentUserId}&select=id,display_name,username,is_dj&order=display_name`,
        { headers: getHeaders() }
      );
      const allProfiles = await profilesRes.json();
      if (Array.isArray(allProfiles)) setContacts(allProfiles);

      // Get chats where current user is a member
      const membershipsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/chat_members?user_id=eq.${currentUserId}&select=chat_id`,
        { headers: getHeaders() }
      );
      const memberships = await membershipsRes.json();
      if (!Array.isArray(memberships) || memberships.length === 0) {
        setChats([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const chatIds = memberships.map((m: any) => m.chat_id);

      // Get chat details
      const chatsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/chats?id=in.(${chatIds.join(',')})&select=*`,
        { headers: getHeaders() }
      );
      const chatsData = await chatsRes.json();
      if (!Array.isArray(chatsData)) { setChats([]); setLoading(false); return; }

      // Build profile map for direct chats
      const profileMap: Record<string, string> = {};
      if (Array.isArray(allProfiles)) {
        allProfiles.forEach((p: any) => { profileMap[p.id] = p.display_name || p.username || 'Usuario'; });
      }

      const chatList: Chat[] = [];

      for (const chat of chatsData) {
        // Get last message
        const lastMsgRes = await fetch(
          `${SUPABASE_URL}/rest/v1/chat_messages?chat_id=eq.${chat.id}&select=content,created_at,user_id&order=created_at.desc&limit=1`,
          { headers: getHeaders() }
        );
        const lastMsgs = await lastMsgRes.json();
        const lastMsg = Array.isArray(lastMsgs) ? lastMsgs[0] : null;

        // Determine display name
        let displayName = chat.name || 'Chat';
        const isGroup = chat.type === 'group';

        if (!isGroup) {
          // Get other member
          const otherRes = await fetch(
            `${SUPABASE_URL}/rest/v1/chat_members?chat_id=eq.${chat.id}&user_id=neq.${currentUserId}&select=user_id`,
            { headers: getHeaders() }
          );
          const others = await otherRes.json();
          if (Array.isArray(others) && others[0]?.user_id) {
            displayName = profileMap[others[0].user_id] || displayName;
          }
        }

        chatList.push({
          id: chat.id,
          name: displayName,
          lastMessage: lastMsg?.content || (isGroup ? 'Grupo creado' : 'Chat nuevo'),
          time: lastMsg?.created_at
            ? new Date(lastMsg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            : '',
          unread: lastMsg && lastMsg.user_id !== currentUserId ? 1 : 0,
          online: !isGroup,
          isGroup,
        });
      }

      // Sort by most recent message
      chatList.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
      setChats(chatList);
    } catch (e) {
      console.error('Error loading chats:', e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const startChat = async (contact: Contact) => {
    if (!currentUserId) return;

    // Check if direct chat already exists
    const existing = chats.find(c => c.name === contact.display_name && !c.isGroup);
    if (existing) {
      router.push(`/chat/${existing.id}`);
      return;
    }

    try {
      // Create new direct chat
      const chatRes = await fetch(`${SUPABASE_URL}/rest/v1/chats`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Prefer': 'return=representation' },
        body: JSON.stringify({ type: 'direct', name: contact.display_name, created_by: currentUserId }),
      });
      const newChats = await chatRes.json();
      const newChat = Array.isArray(newChats) ? newChats[0] : null;
      if (!newChat) return;

      // Add both members
      await fetch(`${SUPABASE_URL}/rest/v1/chat_members`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify([
          { chat_id: newChat.id, user_id: currentUserId, role: 'member' },
          { chat_id: newChat.id, user_id: contact.id, role: 'member' },
        ]),
      });

      router.push(`/chat/${newChat.id}`);
    } catch (e) {
      console.error('Error creating chat:', e);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <TouchableOpacity onPress={() => router.push('/new-group')}>
            <Ionicons name="people-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/new-chat')}>
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {chats.length > 0 ? (
        <FlatList
          data={chats}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ChatItem chat={item} onPress={() => router.push(`/chat/${item.id}`)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyHeader}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.primary} />
            <Text style={styles.emptyTitle}>Empieza a chatear</Text>
            <Text style={styles.emptySubtitle}>Elige un contacto para iniciar una conversación</Text>
          </View>

          <Text style={styles.sectionTitle}>Contactos ({contacts.length})</Text>

          <FlatList
            data={contacts}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <ContactItem contact={item} onPress={() => startChat(item)} />
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            contentContainerStyle={styles.contactsList}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  list: { paddingBottom: spacing['3xl'] },

  chatItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  avatarWrap: { position: 'relative' },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.background,
  },
  chatInfo: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { ...typography.bodyBold, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  time: { ...typography.caption, color: colors.textMuted },
  timeActive: { color: colors.primary },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lastMsg: { ...typography.bodySmall, color: colors.textMuted, flex: 1 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { ...typography.captionBold, color: colors.textOnPrimary, fontSize: 11 },
  sep: { height: 0.5, backgroundColor: colors.divider, marginLeft: 76 },

  emptyContainer: { flex: 1 },
  emptyHeader: { alignItems: 'center', paddingVertical: spacing['2xl'], gap: spacing.sm },
  emptyTitle: { ...typography.h2, color: colors.textPrimary },
  emptySubtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing['2xl'] },
  sectionTitle: {
    ...typography.captionBold, color: colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 1, paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
  },
  contactsList: { paddingBottom: spacing['3xl'] },
  contactItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  contactInfo: { flex: 1, gap: 2 },
  contactName: { ...typography.bodyBold, color: colors.textPrimary },
  contactHandle: { ...typography.bodySmall, color: colors.textMuted },
  startChatBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
