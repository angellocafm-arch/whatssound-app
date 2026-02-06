/**
 * WhatsSound — Centro de Notificaciones / Actividad
 * Conectado a Supabase - deriva notificaciones de eventos
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';
import { supabase } from '../src/lib/supabase';
import { isTestMode, getOrCreateTestUser } from '../src/lib/demo';

type NotifType = 'session' | 'song' | 'tip' | 'mention' | 'join' | 'rating';

interface Notif {
  id: string;
  type: NotifType;
  text: string;
  time: string;
  unread: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  sessionId?: string;
}

const TABS = [
  { key: 'all', label: 'Todo' },
  { key: 'session', label: 'Sesiones' },
  { key: 'tip', label: 'Volumen' },
  { key: 'song', label: 'Canciones' },
] as const;

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [userId, setUserId] = useState<string>('');

  // Cargar notificaciones derivadas de eventos
  useEffect(() => {
    (async () => {
      let uid = '';
      if (isTestMode()) {
        const testProfile = await getOrCreateTestUser();
        if (testProfile) uid = testProfile.id;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) uid = user.id;
      }

      if (!uid) {
        setLoading(false);
        return;
      }

      setUserId(uid);
      const notifs: Notif[] = [];

      // 1. Volumen recibido (si soy DJ)
      const { data: tips } = await supabase
        .from('ws_tips')
        .select(`
          id, amount, created_at,
          from_user:ws_profiles!from_user_id(display_name),
          session:ws_sessions(name)
        `)
        .eq('to_user_id', uid)
        .order('created_at', { ascending: false })
        .limit(10);

      if (tips) {
        for (const tip of tips) {
          notifs.push({
            id: `tip-${tip.id}`,
            type: 'tip',
            text: `${(tip.from_user as any)?.display_name || 'Alguien'} te dio ${tip.amount} dB`,
            time: timeAgo(new Date(tip.created_at)),
            unread: false,
            icon: 'cash',
            iconColor: colors.warning,
            iconBg: colors.warning + '18',
            sessionId: (tip.session as any)?.id,
          });
        }
      }

      // 2. Sesiones donde DJ inició (si sigo al DJ)
      const { data: recentSessions } = await supabase
        .from('ws_sessions')
        .select(`
          id, name, created_at,
          dj:ws_profiles!dj_id(display_name, dj_name)
        `)
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentSessions) {
        for (const session of recentSessions) {
          const djName = (session.dj as any)?.dj_name || (session.dj as any)?.display_name || 'Un DJ';
          notifs.push({
            id: `session-${session.id}`,
            type: 'session',
            text: `${djName} inició sesión ${session.name}`,
            time: timeAgo(new Date(session.created_at)),
            unread: false,
            icon: 'headset',
            iconColor: '#A78BFA',
            iconBg: '#A78BFA18',
            sessionId: session.id,
          });
        }
      }

      // 3. Mis canciones que sonaron
      const { data: playedSongs } = await supabase
        .from('ws_songs')
        .select(`
          id, title, created_at, status,
          session:ws_sessions(name)
        `)
        .eq('user_id', uid)
        .eq('status', 'played')
        .order('created_at', { ascending: false })
        .limit(5);

      if (playedSongs) {
        for (const song of playedSongs) {
          notifs.push({
            id: `song-${song.id}`,
            type: 'song',
            text: `Tu canción ${song.title} sonó en ${(song.session as any)?.name || 'una sesión'}`,
            time: timeAgo(new Date(song.created_at)),
            unread: false,
            icon: 'musical-notes',
            iconColor: colors.primary,
            iconBg: colors.primary + '18',
          });
        }
      }

      // 4. Valoraciones recibidas (si soy DJ)
      const { data: ratings } = await supabase
        .from('ws_session_ratings')
        .select(`
          id, rating, created_at,
          user:ws_profiles!user_id(display_name),
          session:ws_sessions(name)
        `)
        .eq('dj_id', uid)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ratings) {
        for (const r of ratings) {
          notifs.push({
            id: `rating-${r.id}`,
            type: 'rating' as NotifType,
            text: `${(r.user as any)?.display_name || 'Alguien'} te valoró con ${r.rating}★ en ${(r.session as any)?.name || 'una sesión'}`,
            time: timeAgo(new Date(r.created_at)),
            unread: false,
            icon: 'star',
            iconColor: colors.warning,
            iconBg: colors.warning + '18',
          });
        }
      }

      // Ordenar por fecha más reciente (parsear time)
      notifs.sort((a, b) => {
        // Simple sort - más reciente primero
        if (a.time === 'Ahora') return -1;
        if (b.time === 'Ahora') return 1;
        return 0;
      });

      setNotifications(notifs);
      setLoading(false);
    })();
  }, []);

  const filtered = tab === 'all' ? notifications : notifications.filter(n => n.type === tab);

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Actividad</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}>
            <Text style={[s.tabText, tab === t.key && s.tabActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={s.list}>
        {filtered.length > 0 ? (
          filtered.map(notif => (
            <TouchableOpacity 
              key={notif.id} 
              style={s.notifRow} 
              activeOpacity={0.7}
              onPress={() => {
                if (notif.sessionId) {
                  router.push({ pathname: '/session/queue', params: { sessionId: notif.sessionId } } as any);
                }
              }}
            >
              <View style={[s.notifIcon, { backgroundColor: notif.iconBg }]}>
                <Ionicons name={notif.icon} size={20} color={notif.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.notifText}>{notif.text}</Text>
                <Text style={s.notifTime}>{notif.time}</Text>
              </View>
              {notif.unread && <View style={s.unreadDot} />}
            </TouchableOpacity>
          ))
        ) : (
          <View style={s.empty}>
            <Ionicons name="notifications-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>Sin actividad</Text>
            <Text style={s.emptySubtitle}>Tus notificaciones aparecerán aquí</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary, fontSize: 22 },
  tabs: { flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.base, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabText: { ...typography.bodySmall, color: colors.textMuted, fontSize: 14 },
  tabActive: { color: colors.primary, fontWeight: '600' },
  list: { paddingBottom: 40 },
  notifRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border + '40',
  },
  notifIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  notifText: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  notifTime: { ...typography.caption, color: colors.textMuted, fontSize: 12, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  empty: { alignItems: 'center', paddingVertical: spacing['4xl'], gap: spacing.sm },
  emptyTitle: { ...typography.h3, color: colors.textSecondary },
  emptySubtitle: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center' },
});
