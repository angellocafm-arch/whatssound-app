/**
 * WhatsSound — Nuevo Chat
 * Buscar usuarios y abrir conversación directa (direct fetch from Supabase)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';
import { Avatar } from '../src/components/ui/Avatar';

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

interface UserProfile {
  id: string;
  display_name: string;
  username: string;
  is_dj: boolean;
}

export default function NewChatScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=id,display_name,username,is_dj&order=display_name`,
        { headers: getHeaders() }
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data.filter((u: any) => u.id !== currentUserId));
      }
    } catch (e) {
      console.error('Error loading users:', e);
    }
    setLoading(false);
  };

  const openChat = async (targetUser: UserProfile) => {
    if (!currentUserId || creating) return;
    setCreating(true);

    try {
      // Check if a direct chat already exists between these two users
      // Get all my chat memberships
      const myMembersRes = await fetch(
        `${SUPABASE_URL}/rest/v1/chat_members?user_id=eq.${currentUserId}&select=chat_id`,
        { headers: getHeaders() }
      );
      const myMembers = await myMembersRes.json();

      if (Array.isArray(myMembers) && myMembers.length > 0) {
        const myChatIds = myMembers.map((m: any) => m.chat_id);

        // Check if target user is also a member of any of my chats
        const targetMembersRes = await fetch(
          `${SUPABASE_URL}/rest/v1/chat_members?user_id=eq.${targetUser.id}&chat_id=in.(${myChatIds.join(',')})&select=chat_id`,
          { headers: getHeaders() }
        );
        const targetMembers = await targetMembersRes.json();

        if (Array.isArray(targetMembers) && targetMembers.length > 0) {
          // Check if any of these shared chats is a 'direct' type
          const sharedChatIds = targetMembers.map((m: any) => m.chat_id);
          const chatsRes = await fetch(
            `${SUPABASE_URL}/rest/v1/chats?id=in.(${sharedChatIds.join(',')})&type=eq.direct&select=id&limit=1`,
            { headers: getHeaders() }
          );
          const existingChats = await chatsRes.json();

          if (Array.isArray(existingChats) && existingChats.length > 0) {
            router.replace(`/chat/${existingChats[0].id}`);
            return;
          }
        }
      }

      // Create new direct chat
      const chatRes = await fetch(`${SUPABASE_URL}/rest/v1/chats`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Prefer': 'return=representation' },
        body: JSON.stringify({
          type: 'direct',
          name: targetUser.display_name,
          created_by: currentUserId,
        }),
      });
      const newChats = await chatRes.json();
      const newChat = Array.isArray(newChats) ? newChats[0] : null;

      if (!newChat) {
        console.error('Error creating chat');
        setCreating(false);
        return;
      }

      // Add both users as members
      await fetch(`${SUPABASE_URL}/rest/v1/chat_members`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify([
          { chat_id: newChat.id, user_id: currentUserId, role: 'member' },
          { chat_id: newChat.id, user_id: targetUser.id, role: 'member' },
        ]),
      });

      router.replace(`/chat/${newChat.id}`);
    } catch (e) {
      console.error('Error opening chat:', e);
      setCreating(false);
    }
  };

  const filtered = search.trim()
    ? users.filter(u =>
        u.display_name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Nuevo Chat</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuarios..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userItem}
              onPress={() => openChat(item)}
              activeOpacity={0.7}
              disabled={creating}
            >
              <Avatar name={item.display_name} size="lg" />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.display_name}</Text>
                <Text style={styles.userHandle}>
                  @{item.username} {item.is_dj ? '🎧 DJ' : ''}
                </Text>
              </View>
              <Ionicons name="chatbubble-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No se encontraron usuarios</Text>
          }
        />
      )}

      {creating && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.overlayText}>Abriendo chat...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.h2, color: colors.textPrimary },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  list: { paddingBottom: spacing['3xl'] },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  userInfo: { flex: 1, gap: 2 },
  userName: { ...typography.bodyBold, color: colors.textPrimary },
  userHandle: { ...typography.bodySmall, color: colors.textMuted },
  sep: { height: 0.5, backgroundColor: colors.divider, marginLeft: 76 },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  overlayText: { ...typography.body, color: colors.textPrimary },
});
