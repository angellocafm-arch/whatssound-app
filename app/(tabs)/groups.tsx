/**
 * WhatsSound — Grupos (estilo WhatsApp + sesiones música)
 * Lista de grupos con último mensaje, conectado a Supabase
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';

// Ionicons web font fix
if (Platform.OS === 'web') {
  const s = document.createElement('style');
  s.textContent = '@font-face{font-family:"Ionicons";src:url("/Ionicons.ttf") format("truetype")}';
  if (!document.querySelector('style[data-ionicons-grp]')) {
    s.setAttribute('data-ionicons-grp', '1');
    document.head.appendChild(s);
  }
}

const SB = 'https://xyehncvvvprrqwnsefcr.supabase.co/rest/v1';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTA4OTgsImV4cCI6MjA4NTIyNjg5OH0.VEaTmqpMA7XdUa-tZ7mXib1ciweD7y5UU4dFGZq3EtQ';

function getHeaders() {
  let token = '';
  try { token = JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').access_token || ''; } catch {}
  return { 'apikey': ANON, 'Authorization': `Bearer ${token || ANON}`, 'Content-Type': 'application/json' };
}

function getCurrentUserId() {
  try { return JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').user?.id || ''; } catch { return ''; }
}

interface GroupData {
  id: string;
  name: string;
  memberCount: number;
  lastMessage?: string;
  lastMessageBy?: string;
  lastMessageTime?: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 172800000) return 'Ayer';
  return d.toLocaleDateString('es-ES', { weekday: 'short' });
}

const GroupItem = ({ group, onPress }: { group: GroupData; onPress: () => void }) => (
  <TouchableOpacity style={styles.groupItem} onPress={onPress} activeOpacity={0.7}>
    <Avatar name={group.name} size="lg" />
    <View style={styles.groupInfo}>
      <View style={styles.topRow}>
        <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
        {group.lastMessageTime && (
          <Text style={styles.time}>{formatTime(group.lastMessageTime)}</Text>
        )}
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {group.lastMessageBy ? (
            <><Text style={styles.senderName}>{group.lastMessageBy}: </Text>{group.lastMessage}</>
          ) : (
            <Text style={styles.senderName}>{group.memberCount} miembros</Text>
          )}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default function GroupsScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    try {
      const userId = getCurrentUserId();
      const headers = getHeaders();

      // Get group chats the user is a member of
      let chatIds: string[] = [];
      if (userId) {
        const memRes = await fetch(`${SB}/chat_members?user_id=eq.${userId}&select=chat_id`, { headers });
        const memberships = await memRes.json();
        chatIds = (memberships || []).map((m: any) => m.chat_id);
      }

      // Fetch group chats
      let url = `${SB}/chats?type=eq.group&select=id,name,created_at&order=created_at.desc`;
      if (chatIds.length > 0) {
        url += `&id=in.(${chatIds.join(',')})`;
      }
      const chatsRes = await fetch(url, { headers });
      const chats = await chatsRes.json();
      if (!Array.isArray(chats)) { setGroups([]); setLoading(false); return; }

      // For each group, get member count and last message
      const groupData: GroupData[] = await Promise.all(chats.map(async (chat: any) => {
        // Member count
        const countRes = await fetch(`${SB}/chat_members?chat_id=eq.${chat.id}&select=id`, { headers, method: 'HEAD' });
        // Use a GET with count
        const countRes2 = await fetch(`${SB}/chat_members?chat_id=eq.${chat.id}&select=id`, { headers: { ...headers, 'Prefer': 'count=exact' } });
        const countHeader = countRes2.headers.get('content-range');
        const memberCount = countHeader ? parseInt(countHeader.split('/')[1]) || 0 : (await countRes2.json()).length || 0;

        // Last message
        const msgRes = await fetch(`${SB}/chat_messages?chat_id=eq.${chat.id}&is_system=eq.false&order=created_at.desc&limit=1&select=content,user_id,created_at`, { headers });
        const msgs = await msgRes.json();
        let lastMessage = '', lastMessageBy = '', lastMessageTime = '';
        if (Array.isArray(msgs) && msgs.length > 0) {
          const msg = msgs[0];
          lastMessage = msg.content;
          lastMessageTime = msg.created_at;
          // Get sender name
          if (msg.user_id === userId) {
            lastMessageBy = 'Tú';
          } else {
            const profRes = await fetch(`${SB}/profiles?id=eq.${msg.user_id}&select=display_name`, { headers });
            const profs = await profRes.json();
            lastMessageBy = profs?.[0]?.display_name || 'Desconocido';
          }
        }

        return { id: chat.id, name: chat.name || 'Grupo', memberCount, lastMessage, lastMessageBy, lastMessageTime };
      }));

      // Sort by last message time (most recent first), then by creation
      groupData.sort((a, b) => {
        const ta = a.lastMessageTime || '';
        const tb = b.lastMessageTime || '';
        return tb.localeCompare(ta);
      });

      setGroups(groupData);
    } catch (e) {
      console.error('Error fetching groups:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchGroups();
  }, [fetchGroups]));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grupos</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="search" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/group/create')}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Group list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No tienes grupos aún</Text>
          <TouchableOpacity onPress={() => router.push('/group/create')}>
            <Text style={styles.createLink}>Crear grupo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <GroupItem group={item} onPress={() => router.push(`/group/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.h1, color: colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: spacing.md },
  headerBtn: { padding: spacing.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textMuted },
  createLink: { ...typography.bodyBold, color: colors.primary },
  list: { paddingBottom: spacing['3xl'] },
  groupItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  groupInfo: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupName: { ...typography.bodyBold, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  time: { ...typography.caption, color: colors.textMuted },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lastMessage: { ...typography.bodySmall, color: colors.textMuted, flex: 1 },
  senderName: { color: colors.textSecondary },
  separator: { height: 0.5, backgroundColor: colors.divider, marginLeft: 76 },
});
