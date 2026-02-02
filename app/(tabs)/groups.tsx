/**
 * WhatsSound — Grupos musicales
 * Lista tipo WhatsApp con datos mock para demo + fallback Supabase
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

// ─── Types ───────────────────────────────────────────────────

interface GroupData {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  lastMessage: string;
  lastMessageBy: string;
  lastMessageTime: string;
  unreadCount: number;
  color: string;
  isPinned: boolean;
  isMuted: boolean;
}

// ─── Mock Data ───────────────────────────────────────────────

const MOCK_GROUPS: GroupData[] = [
  {
    id: 'g1', name: 'Reggaetoneros Madrid', emoji: '🔥',
    memberCount: 234, lastMessage: '¿Alguien va a la sesión de Carlos esta noche? 🎧',
    lastMessageBy: 'María', lastMessageTime: '22:15', unreadCount: 5,
    color: '#25D366', isPinned: true, isMuted: false,
  },
  {
    id: 'g2', name: 'Techno Underground BCN', emoji: '🎛️',
    memberCount: 178, lastMessage: 'Nuevo set de KRTL subido, brutal 🔊',
    lastMessageBy: 'Alex', lastMessageTime: '21:43', unreadCount: 12,
    color: '#53BDEB', isPinned: true, isMuted: false,
  },
  {
    id: 'g3', name: 'Chill Beats Club', emoji: '🌙',
    memberCount: 89, lastMessage: 'Alguien tiene el playlist de ayer? Lo-fi perfecto para estudiar',
    lastMessageBy: 'Luna', lastMessageTime: '19:30', unreadCount: 0,
    color: '#AB47BC', isPinned: false, isMuted: false,
  },
  {
    id: 'g4', name: 'DJs España 🇪🇸', emoji: '🇪🇸',
    memberCount: 512, lastMessage: '📢 Nuevo DJ verificado: @NereaBCN',
    lastMessageBy: 'Admin', lastMessageTime: '18:05', unreadCount: 3,
    color: '#FFA726', isPinned: false, isMuted: false,
  },
  {
    id: 'g5', name: 'Hip Hop Cypher Madrid', emoji: '🎤',
    memberCount: 156, lastMessage: 'Freestyle session este domingo en Malasaña 🔥',
    lastMessageBy: 'MC Flow', lastMessageTime: '16:22', unreadCount: 0,
    color: '#EF5350', isPinned: false, isMuted: false,
  },
  {
    id: 'g6', name: 'House Nation 🏠', emoji: '🏠',
    memberCount: 201, lastMessage: 'El Warehouse Festival va a estar increíble',
    lastMessageBy: 'DJ Pulse', lastMessageTime: 'Ayer', unreadCount: 0,
    color: '#26C6DA', isPinned: false, isMuted: true,
  },
  {
    id: 'g7', name: 'Latin Vibes 💃', emoji: '💃',
    memberCount: 345, lastMessage: 'Compartido: Playlist Salsa & Bachata 2025',
    lastMessageBy: 'Carlos Madrid', lastMessageTime: 'Ayer', unreadCount: 0,
    color: '#FFD54F', isPinned: false, isMuted: false,
  },
];

// ─── Components ──────────────────────────────────────────────

const GroupAvatar = ({ name, emoji, color }: { name: string; emoji: string; color: string }) => (
  <View style={[styles.avatar, { backgroundColor: color + '20' }]}>
    <Text style={styles.avatarEmoji}>{emoji}</Text>
  </View>
);

const GroupItem = ({ group, onPress }: { group: GroupData; onPress: () => void }) => (
  <TouchableOpacity style={styles.groupItem} onPress={onPress} activeOpacity={0.7}>
    <GroupAvatar name={group.name} emoji={group.emoji} color={group.color} />
    <View style={styles.groupInfo}>
      <View style={styles.topRow}>
        <View style={styles.nameRow}>
          {group.isPinned && (
            <Ionicons name="pin" size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
          )}
          <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
        </View>
        <Text style={[styles.time, group.unreadCount > 0 && styles.timeUnread]}>
          {group.lastMessageTime}
        </Text>
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.lastMessage} numberOfLines={1}>
          <Text style={styles.senderName}>{group.lastMessageBy}: </Text>
          {group.lastMessage}
        </Text>
        <View style={styles.bottomRight}>
          {group.isMuted && (
            <Ionicons name="volume-mute" size={14} color={colors.textMuted} />
          )}
          {group.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{group.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Main Screen ─────────────────────────────────────────────

export default function GroupsScreen() {
  const router = useRouter();
  const [groups] = useState(MOCK_GROUPS);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grupos</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="search" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/group/create' as any)}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Group list */}
      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <GroupItem group={item} onPress={() => router.push(`/group/${item.id}` as any)} />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.h1, color: colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: spacing.md },
  headerBtn: { padding: spacing.xs },

  list: { paddingBottom: spacing['3xl'] },

  // Group item
  groupItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 24 },
  groupInfo: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.sm },
  groupName: { ...typography.bodyBold, color: colors.textPrimary, flex: 1 },
  time: { ...typography.caption, color: colors.textMuted },
  timeUnread: { color: colors.primary },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastMessage: { ...typography.bodySmall, color: colors.textMuted, flex: 1, marginRight: spacing.sm },
  senderName: { color: colors.textSecondary },
  bottomRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { ...typography.caption, color: colors.textOnPrimary, fontWeight: '700', fontSize: 11 },
  separator: { height: 0.5, backgroundColor: colors.divider, marginLeft: 80 },
});
