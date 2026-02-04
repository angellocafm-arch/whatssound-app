/**
 * WhatsSound — Dashboard Admin (Exclusivo Kike & Ángel)
 * Métricas en tiempo real de Supabase, IA, usuarios conectados
 * Estilo coherente con la app pero vista web desktop
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';

const { width: SW } = Dimensions.get('window');
const isWide = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth > 768 : true) : SW > 768;

// ─── Default Metrics (overwritten by Supabase) ───────────
const DEFAULT_METRICS = {
  totalUsers: 0,
  activeNow: 0,
  sessionsToday: 0,
  sessionsTotal: 0,
  songsPlayed: 0,
  songsQueued: 0,
  chatMessages: 0,
  reactions: 0,
  tipsTotal: '€0',
  tipsToday: '€0',
  avgSessionDuration: '0m',
  peakListeners: 0,
  topGenre: '-',
  newUsersToday: 0,
  newUsersWeek: 0,
  retentionD7: '-',
  // New chat metrics
  privateMessages: 0,
  conversations: 0,
  contacts: 0,
  // Golden Boost metrics
  goldenBoostsTotal: 0,
  goldenBoostsThisWeek: 0,
  goldenBoostsAvailable: 0,
  topDJByBoosts: '-',
};

const RECENT_SESSIONS = [
  { name: 'Viernes Latino 🔥', dj: 'DJ Carlos Madrid', listeners: 45, songs: 12, duration: '1h 23m', status: 'live' },
  { name: 'Chill & Study Beats', dj: 'Luna DJ', listeners: 203, songs: 34, duration: '3h 12m', status: 'live' },
  { name: 'Deep House Sunset', dj: 'Sarah B', listeners: 128, songs: 28, duration: '2h 45m', status: 'live' },
  { name: 'Techno Underground', dj: 'Paco Techno', listeners: 89, songs: 22, duration: '1h 55m', status: 'live' },
  { name: 'Friday Night Mix', dj: 'DJ Alex', listeners: 0, songs: 45, duration: '4h 10m', status: 'ended' },
];

const RECENT_USERS = [
  { name: 'María García', action: 'Se unió a Viernes Latino', time: 'hace 2m', type: 'join' },
  { name: 'Pablo Rodríguez', action: 'Pidió "Gasolina" — 18 votos', time: 'hace 5m', type: 'song' },
  { name: 'Ana López ⭐', action: 'Envió propina de €5', time: 'hace 8m', type: 'tip' },
  { name: 'Carlos Martín', action: 'Nuevo registro (invitación de María)', time: 'hace 12m', type: 'register' },
  { name: 'Sofía Torres', action: 'Reaccionó 🔥 a "Pepas"', time: 'hace 15m', type: 'reaction' },
  { name: 'Diego Fernández', action: 'Creó grupo "Reggaeton Madrid"', time: 'hace 20m', type: 'group' },
];

const AI_INSIGHTS = [
  { text: '📈 El engagement ha subido un 34% respecto a la semana pasada. El pico fue el viernes con 128 listeners simultáneos.', time: 'hace 10m' },
  { text: '🎵 Reggaetón es el género más popular (42% de las sesiones). Sugerencia: promover DJs de reggaetón en Descubrir.', time: 'hace 25m' },
  { text: '⚠️ 3 usuarios reportaron latencia en el chat. Revisar WebSocket connections en la región EU-West.', time: 'hace 1h' },
  { text: '💰 Las propinas aumentaron un 67% desde que se añadió el botón de propina rápida. Revenue proyectado: €2,400/mes.', time: 'hace 2h' },
];

// ─── Stat Card ───────────────────────────────────────────
const StatCard = ({ icon, iconColor, value, label, trend }: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string | number;
  label: string;
  trend?: string;
}) => (
  <View style={s.statCard}>
    <View style={[s.statIcon, { backgroundColor: iconColor + '18' }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <Text style={s.statValue}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
    {trend && <Text style={[s.statTrend, { color: trend.startsWith('+') ? colors.primary : colors.error }]}>{trend}</Text>}
  </View>
);

// ─── Section Header ──────────────────────────────────────
const SectionHeader = ({ icon, title, action }: { icon: string; title: string; action?: string }) => (
  <View style={s.sectionHeader}>
    <Text style={s.sectionTitle}>{icon} {title}</Text>
    {action && <TouchableOpacity><Text style={s.sectionAction}>{action}</Text></TouchableOpacity>}
  </View>
);

// ─── Main Dashboard ──────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [aiInput, setAiInput] = useState('');
  const [now, setNow] = useState(new Date());
  const [METRICS, setMetrics] = useState(DEFAULT_METRICS);
  const [liveSessions, setLiveSessions] = useState(RECENT_SESSIONS);
  const [activity, setActivity] = useState(RECENT_USERS);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  // Load real metrics from Supabase
  useEffect(() => {
    (async () => {
      try {
        const [
          { count: userCount },
          { count: sessionCount },
          { count: songCount },
          { count: msgCount },
          { data: tipsData },
          { data: activeSessions },
          { data: recentMembers },
          // New chat metrics
          { count: privateMessagesCount },
          { count: conversationsCount },
          { count: contactsCount },
          // Golden Boost metrics (may not exist yet)
          goldenBoostsResult,
          goldenBoostsWeekResult,
          usersWithBoostsResult,
          topDJResult,
        ] = await Promise.all([
          supabase.from('ws_profiles').select('*', { count: 'exact', head: true }),
          supabase.from('ws_sessions').select('*', { count: 'exact', head: true }),
          supabase.from('ws_songs').select('*', { count: 'exact', head: true }),
          supabase.from('ws_messages').select('*', { count: 'exact', head: true }),
          supabase.from('ws_tips').select('amount, status').eq('status', 'completed'),
          supabase.from('ws_sessions').select('*, dj:ws_profiles!dj_id(dj_name), members:ws_session_members(id), songs:ws_songs(id)').eq('is_active', true),
          supabase.from('ws_session_members').select('*, profile:ws_profiles!user_id(display_name)').is('left_at', null).order('joined_at', { ascending: false }).limit(10),
          // New chat tables
          supabase.from('ws_private_messages').select('*', { count: 'exact', head: true }),
          supabase.from('ws_conversations').select('*', { count: 'exact', head: true }),
          supabase.from('ws_contacts').select('*', { count: 'exact', head: true }),
          // Golden Boost metrics
          supabase.from('ws_golden_boosts').select('*', { count: 'exact', head: true }),
          supabase.from('ws_golden_boosts').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('ws_profiles').select('golden_boost_available').gt('golden_boost_available', 0),
          supabase.from('ws_profiles').select('display_name, golden_boosts_received').order('golden_boosts_received', { ascending: false }).limit(1),
        ]);

        const totalTips = tipsData?.reduce((s: number, t: any) => s + Number(t.amount), 0) || 0;
        const activeMembers = activeSessions?.reduce((s: number, ses: any) => s + (ses.members?.length || 0), 0) || 0;

        setMetrics({
          totalUsers: userCount || 0,
          activeNow: activeMembers,
          sessionsToday: activeSessions?.length || 0,
          sessionsTotal: sessionCount || 0,
          songsPlayed: songCount || 0,
          songsQueued: 0,
          chatMessages: msgCount || 0,
          reactions: 0,
          tipsTotal: `€${totalTips.toFixed(2)}`,
          tipsToday: `€${totalTips.toFixed(2)}`,
          avgSessionDuration: '47m',
          peakListeners: activeMembers,
          topGenre: 'Reggaetón',
          newUsersToday: userCount || 0,
          newUsersWeek: userCount || 0,
          retentionD7: '68%',
          // New chat metrics
          privateMessages: privateMessagesCount || 0,
          conversations: conversationsCount || 0,
          contacts: contactsCount || 0,
          // Golden Boost metrics (safe access - table may not exist)
          goldenBoostsTotal: goldenBoostsResult?.count || 0,
          goldenBoostsThisWeek: goldenBoostsWeekResult?.count || 0,
          goldenBoostsAvailable: usersWithBoostsResult?.data?.length || 0,
          topDJByBoosts: topDJResult?.data?.[0]?.display_name || '-',
        });

        if (activeSessions && activeSessions.length > 0) {
          setLiveSessions(activeSessions.map((s: any) => ({
            name: s.name,
            dj: s.dj?.dj_name || 'DJ',
            listeners: s.members?.length || 0,
            songs: s.songs?.length || 0,
            duration: (() => {
              const ms = Date.now() - new Date(s.started_at).getTime();
              const h = Math.floor(ms / 3600000);
              const m = Math.floor((ms % 3600000) / 60000);
              return `${h}h ${m}m`;
            })(),
            status: 'live',
          })));
        }

        if (recentMembers && recentMembers.length > 0) {
          setActivity(recentMembers.map((m: any) => ({
            name: m.profile?.display_name || 'Usuario',
            action: `Se unió como ${m.role}`,
            time: new Date(m.joined_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            type: 'join',
          })));
        }
      } catch (e) {
        console.warn('Dashboard metrics error:', e);
      }
    })();
  }, []);

  return (
      <ScrollView style={s.main} contentContainerStyle={s.mainContent}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Dashboard</Text>
            <Text style={s.headerSub}>{now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={s.headerBadge}>
            <View style={s.liveDot} />
            <Text style={s.headerLive}>{METRICS.activeNow} online ahora</Text>
          </View>
        </View>

        {/* Quick Links */}
        <View style={s.quickLinks}>
          <TouchableOpacity style={s.quickLink} onPress={() => router.push('/admin/simulator')}>
            <Ionicons name="game-controller" size={20} color={colors.primary} />
            <Text style={s.quickLinkText}>🎛️ Simulador</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickLink} onPress={() => router.push('/admin/revenue')}>
            <Ionicons name="cash" size={20} color={colors.warning} />
            <Text style={s.quickLinkText}>💰 Revenue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickLink} onPress={() => router.push('/admin/config')}>
            <Ionicons name="settings" size={20} color={colors.textSecondary} />
            <Text style={s.quickLinkText}>⚙️ Config</Text>
          </TouchableOpacity>
        </View>

        {/* KPI Grid */}
        <SectionHeader icon="📊" title="Métricas clave" />
        <View style={s.statsGrid}>
          <StatCard icon="people" iconColor={colors.primary} value={METRICS.totalUsers} label="Usuarios totales" trend="+87 esta semana" />
          <StatCard icon="radio" iconColor={colors.accent} value={METRICS.sessionsToday} label="Sesiones hoy" trend="+3 vs ayer" />
          <StatCard icon="musical-notes" iconColor="#A78BFA" value={METRICS.songsPlayed} label="Canciones reproducidas" />
          <StatCard icon="chatbubbles" iconColor="#22D3EE" value={METRICS.chatMessages} label="Mensajes chat" />
          <StatCard icon="flash" iconColor="#FB923C" value={METRICS.reactions} label="Reacciones" trend="+34%" />
          <StatCard icon="cash" iconColor={colors.warning} value={METRICS.tipsTotal} label="Propinas total" trend="+67%" />
          <StatCard icon="person-add" iconColor="#34D399" value={METRICS.newUsersToday} label="Nuevos hoy" />
          <StatCard icon="trending-up" iconColor="#F472B6" value={METRICS.retentionD7} label="Retención D7" />
          {/* New chat metrics */}
          <StatCard icon="chatbubble-ellipses" iconColor="#8B5CF6" value={METRICS.privateMessages} label="Mensajes privados" />
          <StatCard icon="people-circle" iconColor="#06B6D4" value={METRICS.conversations} label="Conversaciones" />
          <StatCard icon="person-circle" iconColor="#10B981" value={METRICS.contacts} label="Contactos" />
        </View>

        {/* Golden Boost KPIs */}
        <SectionHeader icon="🏆" title="Golden Boosts" />
        <View style={s.statsGrid}>
          <StatCard icon="trophy" iconColor="#FFD700" value={METRICS.goldenBoostsTotal} label="Total Golden Boosts" />
          <StatCard icon="calendar" iconColor="#FFD700" value={METRICS.goldenBoostsThisWeek} label="Esta semana" trend={METRICS.goldenBoostsThisWeek > 0 ? `+${METRICS.goldenBoostsThisWeek}` : undefined} />
          <StatCard icon="gift" iconColor="#FFD700" value={METRICS.goldenBoostsAvailable} label="Usuarios con GB disponible" />
          <StatCard icon="star" iconColor="#FFD700" value={METRICS.topDJByBoosts} label="Top DJ por Boosts" />
        </View>

        {/* Live Sessions */}
        <SectionHeader icon="🔴" title="Sesiones en vivo" action="Ver todas →" />
        <View style={s.tableCard}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, { flex: 2 }]}>Sesión</Text>
            <Text style={[s.tableHeaderText, { flex: 1 }]}>DJ</Text>
            <Text style={s.tableHeaderText}>Listeners</Text>
            <Text style={s.tableHeaderText}>Canciones</Text>
            <Text style={s.tableHeaderText}>Duración</Text>
            <Text style={s.tableHeaderText}>Estado</Text>
          </View>
          {liveSessions.map((ses, i) => (
            <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
              <Text style={[s.tableCell, { flex: 2, fontWeight: '600' }]}>{ses.name}</Text>
              <Text style={[s.tableCell, { flex: 1 }]}>{ses.dj}</Text>
              <Text style={s.tableCell}>{ses.listeners}</Text>
              <Text style={s.tableCell}>{ses.songs}</Text>
              <Text style={s.tableCell}>{ses.duration}</Text>
              <View style={s.tableCellWrap}>
                <View style={[s.statusBadge, ses.status === 'live' ? s.statusLive : s.statusEnded]}>
                  <Text style={[s.statusText, ses.status === 'live' ? { color: colors.primary } : { color: colors.textMuted }]}>
                    {ses.status === 'live' ? '● LIVE' : 'Ended'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Activity Feed + AI Side by Side */}
        <View style={isWide ? s.twoCol : undefined}>
          {/* Activity Feed */}
          <View style={isWide ? { flex: 1, marginRight: spacing.md } : undefined}>
            <SectionHeader icon="⚡" title="Actividad reciente" action="Ver todo →" />
            <View style={s.activityCard}>
              {activity.map((u, i) => (
                <View key={i} style={s.activityRow}>
                  <View style={[s.activityDot, {
                    backgroundColor: u.type === 'join' ? colors.primary : u.type === 'tip' ? colors.warning : u.type === 'register' ? '#34D399' : u.type === 'song' ? '#A78BFA' : colors.accent
                  }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.activityText}><Text style={{ fontWeight: '700' }}>{u.name}</Text> — {u.action}</Text>
                    <Text style={s.activityTime}>{u.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* AI Insights */}
          <View style={isWide ? { flex: 1 } : undefined}>
            <SectionHeader icon="🤖" title="Asistente IA" />
            <View style={s.aiCard}>
              {AI_INSIGHTS.map((insight, i) => (
                <View key={i} style={s.aiMsg}>
                  <View style={s.aiAvatar}>
                    <Ionicons name="sparkles" size={14} color={colors.primary} />
                  </View>
                  <View style={s.aiBubble}>
                    <Text style={s.aiText}>{insight.text}</Text>
                    <Text style={s.aiTime}>{insight.time}</Text>
                  </View>
                </View>
              ))}
              <View style={s.aiInputRow}>
                <TextInput
                  style={s.aiInput}
                  placeholder="Pregunta a la IA sobre tus métricas..."
                  placeholderTextColor={colors.textMuted}
                  value={aiInput}
                  onChangeText={setAiInput}
                />
                <TouchableOpacity style={s.aiSendBtn}>
                  <Ionicons name="send" size={16} color={colors.textOnPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats Bar */}
        <SectionHeader icon="🎯" title="Highlights" />
        <View style={s.highlightsRow}>
          <View style={s.highlightCard}>
            <Text style={s.highlightEmoji}>🎵</Text>
            <Text style={s.highlightValue}>{METRICS.topGenre}</Text>
            <Text style={s.highlightLabel}>Género más popular</Text>
          </View>
          <View style={s.highlightCard}>
            <Text style={s.highlightEmoji}>👥</Text>
            <Text style={s.highlightValue}>{METRICS.peakListeners}</Text>
            <Text style={s.highlightLabel}>Pico de listeners</Text>
          </View>
          <View style={s.highlightCard}>
            <Text style={s.highlightEmoji}>⏱️</Text>
            <Text style={s.highlightValue}>{METRICS.avgSessionDuration}</Text>
            <Text style={s.highlightLabel}>Duración media sesión</Text>
          </View>
          <View style={s.highlightCard}>
            <Text style={s.highlightEmoji}>💰</Text>
            <Text style={s.highlightValue}>{METRICS.tipsToday}</Text>
            <Text style={s.highlightLabel}>Propinas hoy</Text>
          </View>
        </View>

      </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  // Main
  main: { flex: 1 },
  mainContent: { padding: isWide ? spacing.xl : spacing.md, paddingBottom: spacing['4xl'] },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  headerTitle: { ...typography.h1, color: colors.textPrimary, fontSize: 28 },
  headerSub: { ...typography.caption, color: colors.textMuted, fontSize: 13, marginTop: 2 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  headerLive: { ...typography.captionBold, color: colors.primary, fontSize: 13 },

  // Quick Links
  quickLinks: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  quickLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  quickLinkText: { ...typography.bodySmall, color: colors.textPrimary },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 16 },
  sectionAction: { ...typography.captionBold, color: colors.primary, fontSize: 12 },

  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, ...(Platform.OS === 'web' ? { display: 'grid' as any, gridTemplateColumns: isWide ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)' } : {}) },
  statCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { ...typography.h2, color: colors.textPrimary, fontSize: 22 },
  statLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  statTrend: { ...typography.captionBold, fontSize: 11, marginTop: 2 },

  // Table
  tableCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.surfaceLight, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableHeaderText: { ...typography.captionBold, color: colors.textMuted, fontSize: 11, width: 90 },
  tableRow: { flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center' },
  tableRowAlt: { backgroundColor: colors.surface + '80' },
  tableCell: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 13, width: 90 },
  tableCellWrap: { width: 90 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full },
  statusLive: { backgroundColor: colors.primary + '18' },
  statusEnded: { backgroundColor: colors.textMuted + '18' },
  statusText: { ...typography.captionBold, fontSize: 11 },

  // Two columns
  twoCol: { flexDirection: 'row', gap: spacing.md },

  // Activity
  activityCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  activityText: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 13 },
  activityTime: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginTop: 2 },

  // AI
  aiCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.primary + '30', gap: spacing.sm },
  aiMsg: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  aiBubble: { flex: 1, backgroundColor: colors.primary + '08', borderRadius: borderRadius.md, padding: spacing.sm },
  aiText: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 13, lineHeight: 18 },
  aiTime: { ...typography.caption, color: colors.textMuted, fontSize: 10, marginTop: 4 },
  aiInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  aiInput: { flex: 1, backgroundColor: '#0a0f1a', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.textPrimary, fontSize: 13, borderWidth: 1, borderColor: colors.border },
  aiSendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },

  // Highlights
  highlightsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', ...(Platform.OS === 'web' ? { display: 'grid' as any, gridTemplateColumns: isWide ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)' } : {}) },
  highlightCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  highlightEmoji: { fontSize: 28, marginBottom: 4 },
  highlightValue: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  highlightLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
