/**
 * WhatsSound — Gestión de Gente (Vista DJ)
 * Moderación de usuarios: VIP, silenciar, expulsar
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';
import { useLocalSearchParams } from 'expo-router';

// ─── Types ──────────────────────────────────────────────────
type UserRole = 'listener' | 'vip' | 'muted' | 'dj' | 'mod';
type PeopleFilter = 'all' | 'vip' | 'muted';

interface SessionUser {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  songsRequested: number;
  tipsGiven: number;
  joinedAt: string;
  isOnline: boolean;
}

// ─── Mock Data ──────────────────────────────────────────────
const MOCK_USERS: SessionUser[] = [
  { id: '1', name: 'María García', avatar: '👩‍🦰', role: 'vip', songsRequested: 5, tipsGiven: 8.50, joinedAt: '19:45', isOnline: true },
  { id: '2', name: 'Pablo Martínez', avatar: '🧑', role: 'listener', songsRequested: 3, tipsGiven: 5.00, joinedAt: '19:50', isOnline: true },
  { id: '3', name: 'Ana López', avatar: '👩', role: 'vip', songsRequested: 4, tipsGiven: 3.00, joinedAt: '19:55', isOnline: true },
  { id: '4', name: 'Javier Rodríguez', avatar: '🧔', role: 'listener', songsRequested: 2, tipsGiven: 2.00, joinedAt: '20:00', isOnline: true },
  { id: '5', name: 'Lucía Fernández', avatar: '👱‍♀️', role: 'listener', songsRequested: 1, tipsGiven: 0, joinedAt: '20:05', isOnline: true },
  { id: '6', name: 'Carlos Ruiz', avatar: '🧑‍🦱', role: 'muted', songsRequested: 0, tipsGiven: 0, joinedAt: '20:10', isOnline: true },
  { id: '7', name: 'Marta Díaz', avatar: '👩‍🦳', role: 'listener', songsRequested: 2, tipsGiven: 1.50, joinedAt: '20:12', isOnline: true },
  { id: '8', name: 'David Sánchez', avatar: '👨', role: 'listener', songsRequested: 1, tipsGiven: 3.50, joinedAt: '20:15', isOnline: false },
  { id: '9', name: 'Elena Moreno', avatar: '👩‍🦱', role: 'listener', songsRequested: 0, tipsGiven: 0, joinedAt: '20:20', isOnline: true },
  { id: '10', name: 'Sergio Navarro', avatar: '🧑‍🦰', role: 'listener', songsRequested: 1, tipsGiven: 0, joinedAt: '20:25', isOnline: false },
];

// ─── Filter Pill ────────────────────────────────────────────
const FilterPill = ({ label, active, count, onPress }: {
  label: string; active: boolean; count: number; onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.filterPill, active && styles.filterPillActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    <View style={[styles.filterCount, active && styles.filterCountActive]}>
      <Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>{count}</Text>
    </View>
  </TouchableOpacity>
);

// ─── User Card ──────────────────────────────────────────────
const UserCard = ({ user, onToggleVIP, onToggleMute, onKick }: {
  user: SessionUser;
  onToggleVIP: () => void;
  onToggleMute: () => void;
  onKick: () => void;
}) => (
  <View style={[styles.userCard, user.role === 'muted' && styles.userCardMuted]}>
    {/* Avatar + Online */}
    <View style={styles.avatarContainer}>
      <Text style={styles.avatar}>{user.avatar}</Text>
      <View style={[styles.onlineDot, !user.isOnline && styles.offlineDot]} />
    </View>

    {/* Info */}
    <View style={styles.userInfo}>
      <View style={styles.nameRow}>
        <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
        {user.role === 'vip' && <Text style={styles.vipBadge}>⭐ VIP</Text>}
        {user.role === 'muted' && <Text style={styles.mutedBadge}>🔇</Text>}
      </View>
      <View style={styles.userStats}>
        <Text style={styles.userStat}>🎵 {user.songsRequested}</Text>
        {user.tipsGiven > 0 && <Text style={styles.userStat}>💰 €{user.tipsGiven.toFixed(2)}</Text>}
        <Text style={styles.userStat}>⏰ {user.joinedAt}</Text>
      </View>
    </View>

    {/* Actions */}
    <View style={styles.userActions}>
      <TouchableOpacity
        style={[styles.actionBtn, user.role === 'vip' && styles.actionBtnActiveVIP]}
        onPress={onToggleVIP}
      >
        <Text style={styles.actionEmoji}>⭐</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, user.role === 'muted' && styles.actionBtnActiveMute]}
        onPress={onToggleMute}
      >
        <Text style={styles.actionEmoji}>🔇</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionBtn, styles.actionBtnKick]} onPress={onKick}>
        <Text style={styles.actionEmoji}>🚫</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Main Component ─────────────────────────────────────────
export default function DJPeopleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PeopleFilter>('all');

  // Cargar usuarios desde Supabase
  React.useEffect(() => {
    if (!params.sessionId) {
      setUsers(MOCK_USERS);
      setLoading(false);
      return;
    }

    const loadUsers = async () => {
      const { data, error } = await supabase
        .from('ws_session_members')
        .select(`
          id, role, joined_at,
          user:ws_profiles!user_id(id, display_name, avatar_url)
        `)
        .eq('session_id', params.sessionId)
        .is('left_at', null);

      if (!error && data && data.length > 0) {
        setUsers(data.map((m: any, i: number) => ({
          id: m.user?.id || m.id,
          name: m.user?.display_name || 'Usuario',
          avatar: ['👩‍🦰', '🧑', '👩', '🧔', '👱‍♀️', '🧑‍🦱', '👩‍🦳', '👨'][i % 8],
          role: (m.role || 'listener') as UserRole,
          songsRequested: 0,
          tipsGiven: 0,
          joinedAt: new Date(m.joined_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          isOnline: true,
        })));
      } else {
        setUsers(MOCK_USERS);
      }
      setLoading(false);
    };

    loadUsers();

    // Suscripción realtime
    const channel = supabase
      .channel(`members:${params.sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ws_session_members', filter: `session_id=eq.${params.sessionId}` }, () => loadUsers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [params.sessionId]);

  const counts = {
    all: users.length,
    vip: users.filter(u => u.role === 'vip').length,
    muted: users.filter(u => u.role === 'muted').length,
  };

  const onlineCount = users.filter(u => u.isOnline).length;
  const totalTips = users.reduce((sum, u) => sum + u.tipsGiven, 0);

  const filtered = filter === 'all'
    ? users
    : filter === 'vip'
    ? users.filter(u => u.role === 'vip')
    : users.filter(u => u.role === 'muted');

  const toggleVIP = async (id: string) => {
    const user = users.find(u => u.id === id);
    const newRole = user?.role === 'vip' ? 'listener' : 'vip';
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole as UserRole } : u));
    if (params.sessionId) {
      await supabase.from('ws_session_members').update({ role: newRole }).eq('session_id', params.sessionId).eq('user_id', id);
    }
  };

  const toggleMute = async (id: string) => {
    const user = users.find(u => u.id === id);
    const newRole = user?.role === 'muted' ? 'listener' : 'muted';
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole as UserRole } : u));
    if (params.sessionId) {
      await supabase.from('ws_session_members').update({ role: newRole }).eq('session_id', params.sessionId).eq('user_id', id);
    }
  };

  const kickUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (params.sessionId) {
      await supabase.from('ws_session_members').update({ left_at: new Date().toISOString() }).eq('session_id', params.sessionId).eq('user_id', id);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gente</Text>
        <View style={styles.onlineIndicator}>
          <View style={styles.greenDot} />
          <Text style={styles.onlineText}>{onlineCount} online</Text>
        </View>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{users.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{counts.vip}</Text>
          <Text style={styles.summaryLabel}>VIP ⭐</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>€{totalTips.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Tips</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <FilterPill label="Todos" active={filter === 'all'} count={counts.all} onPress={() => setFilter('all')} />
        <FilterPill label="VIP ⭐" active={filter === 'vip'} count={counts.vip} onPress={() => setFilter('vip')} />
        <FilterPill label="Silenciados" active={filter === 'muted'} count={counts.muted} onPress={() => setFilter('muted')} />
      </View>

      {/* User List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filtered.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onToggleVIP={() => toggleVIP(user.id)}
            onToggleMute={() => toggleMute(user.id)}
            onKick={() => kickUser(user.id)}
          />
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Sin usuarios</Text>
            <Text style={styles.emptySubtitle}>No hay usuarios con este filtro</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  onlineText: { ...typography.caption, color: colors.primary, fontSize: 12 },

  // Summary
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { ...typography.h3, color: colors.textPrimary, fontSize: 20 },
  summaryLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  summaryDivider: { width: 1, height: 30, backgroundColor: colors.border },

  // Filters
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary + '50',
  },
  filterText: { ...typography.bodySmall, color: colors.textSecondary, fontSize: 13 },
  filterTextActive: { color: colors.primary, fontWeight: '600' },
  filterCount: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  filterCountActive: { backgroundColor: colors.primary + '25' },
  filterCountText: { ...typography.captionBold, color: colors.textMuted, fontSize: 11 },
  filterCountTextActive: { color: colors.primary },

  // List
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },

  // User card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  userCardMuted: {
    opacity: 0.6,
    borderColor: colors.error + '20',
  },

  avatarContainer: { position: 'relative' },
  avatar: { fontSize: 32 },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.online,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  offlineDot: { backgroundColor: colors.offline },

  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 14, flexShrink: 1 },
  vipBadge: {
    ...typography.captionBold,
    color: '#FFD700',
    fontSize: 10,
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  mutedBadge: { fontSize: 14 },
  userStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 3,
  },
  userStat: { ...typography.caption, color: colors.textMuted, fontSize: 11 },

  // Actions
  userActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnActiveVIP: { backgroundColor: 'rgba(255,215,0,0.2)' },
  actionBtnActiveMute: { backgroundColor: colors.error + '20' },
  actionBtnKick: {},
  actionEmoji: { fontSize: 14 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: spacing['4xl'], gap: spacing.sm },
  emptyTitle: { ...typography.h3, color: colors.textSecondary },
  emptySubtitle: { ...typography.bodySmall, color: colors.textMuted },
});
