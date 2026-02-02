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

const { width: SW } = Dimensions.get('window');
const isWide = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth > 768 : true) : SW > 768;

// ─── Mock Metrics (will connect to Supabase) ─────────────
const METRICS = {
  totalUsers: 1247,
  activeNow: 45,
  sessionsToday: 12,
  sessionsTotal: 387,
  songsPlayed: 2841,
  songsQueued: 156,
  chatMessages: 8432,
  reactions: 12567,
  tipsTotal: '€1,234',
  tipsToday: '€23.50',
  avgSessionDuration: '47m',
  peakListeners: 128,
  topGenre: 'Reggaetón',
  newUsersToday: 18,
  newUsersWeek: 87,
  retentionD7: '68%',
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

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  return (
    <View style={s.root}>
      {/* Sidebar */}
      {isWide && (
        <View style={s.sidebar}>
          <View style={s.sidebarLogo}>
            <Ionicons name="headset" size={28} color={colors.primary} />
            <Text style={s.sidebarTitle}>WhatsSound</Text>
          </View>
          <Text style={s.sidebarSubtitle}>Admin Dashboard</Text>

          {[
            { icon: 'grid' as const, label: 'Overview', active: true },
            { icon: 'people' as const, label: 'Usuarios', active: false },
            { icon: 'radio' as const, label: 'Sesiones', active: false },
            { icon: 'chatbubbles' as const, label: 'Chat IA', active: false },
            { icon: 'bar-chart' as const, label: 'Engagement', active: false },
            { icon: 'cash' as const, label: 'Revenue', active: false },
            { icon: 'warning' as const, label: 'Alertas', active: false },
            { icon: 'settings' as const, label: 'Config', active: false },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[s.sidebarItem, item.active && s.sidebarItemActive]}>
              <Ionicons name={item.icon} size={18} color={item.active ? colors.primary : colors.textMuted} />
              <Text style={[s.sidebarItemText, item.active && { color: colors.primary }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <View style={s.sidebarFooter}>
            <View style={s.sidebarAdmin}>
              <View style={s.adminAvatar}><Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>KA</Text></View>
              <View>
                <Text style={s.adminName}>Kike & Ángel</Text>
                <Text style={s.adminRole}>Super Admin</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Main Content */}
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
          {RECENT_SESSIONS.map((ses, i) => (
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
              {RECENT_USERS.map((u, i) => (
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
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#0a0f1a', ...(Platform.OS === 'web' ? { position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 } : {}) },

  // Sidebar
  sidebar: { width: 240, backgroundColor: '#0d1321', borderRightWidth: 1, borderRightColor: colors.border, paddingTop: spacing.xl, paddingHorizontal: spacing.md },
  sidebarLogo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  sidebarTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  sidebarSubtitle: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginBottom: spacing.xl },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: borderRadius.md, marginBottom: 2 },
  sidebarItemActive: { backgroundColor: colors.primary + '15' },
  sidebarItemText: { ...typography.bodySmall, color: colors.textMuted, fontSize: 13 },
  sidebarFooter: { position: 'absolute', bottom: spacing.xl, left: spacing.md, right: spacing.md },
  sidebarAdmin: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  adminAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  adminName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 13 },
  adminRole: { ...typography.caption, color: colors.textMuted, fontSize: 11 },

  // Main
  main: { flex: 1 },
  mainContent: { padding: isWide ? spacing.xl : spacing.md, paddingBottom: spacing['4xl'] },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  headerTitle: { ...typography.h1, color: colors.textPrimary, fontSize: 28 },
  headerSub: { ...typography.caption, color: colors.textMuted, fontSize: 13, marginTop: 2 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  headerLive: { ...typography.captionBold, color: colors.primary, fontSize: 13 },

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
