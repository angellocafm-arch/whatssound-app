/**
 * WhatsSound — Historial de Sesiones
 * Referencia: 31-historial-sesiones.png
 * Filtros: Todas, Como DJ, Como Oyente + cards sesión
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';

const MOCK_SESSIONS = [
  { name: 'Viernes Latino 🔥', genre: 'Reggaeton · Latin', role: 'DJ', date: 'Hoy, 02:30', duration: '2h 15m', peak: 47, songs: 34 },
  { name: 'Techno Nights 🌙', genre: 'Techno · Electronic', role: 'Oyente', date: 'Ayer, 23:00', duration: '1h 45m', peak: 82, songs: 28 },
  { name: 'Chill Sunday 🌤️', genre: 'Lo-fi · Chill', role: 'DJ', date: 'Dom, 11:00', duration: '3h 20m', peak: 23, songs: 45 },
  { name: 'Reggaeton Mix 🎉', genre: 'Reggaeton', role: 'DJ', date: 'Sáb, 22:00', duration: '4h 00m', peak: 96, songs: 58 },
  { name: 'Indie Acústico 🎸', genre: 'Indie · Acústico', role: 'Oyente', date: 'Vie, 19:00', duration: '1h 30m', peak: 15, songs: 18 },
];

const FILTERS = ['Todas', 'Como DJ', 'Como Oyente'] as const;

function fmtDuration(start: string, end: string | null) {
  if (!end) return 'En curso';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('Todas');
  const [dbSessions, setDbSessions] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('ws_sessions')
          .select('id, name, genres, started_at, ended_at, is_active, dj_id, members:ws_session_members(id), songs:ws_songs(id)')
          .order('started_at', { ascending: false });
        if (data && data.length > 0) {
          setDbSessions(data.map((s: { id: string; name: string; dj?: { dj_name?: string }; songs?: { status: string }[] }) => ({
            name: s.name,
            genre: s.genres?.join(' · ') || 'Mix',
            role: 'DJ', // demo: all shown as DJ
            date: new Date(s.started_at).toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
            duration: s.is_active ? 'En curso' : fmtDuration(s.started_at, s.ended_at),
            peak: s.members?.length || 0,
            songs: s.songs?.length || 0,
          })));
        }
      } catch (e) { /* fallback */ }
    })();
  }, []);

  const SESSIONS = dbSessions.length > 0 ? dbSessions : MOCK_SESSIONS;

  const filtered = filter === 'Todas' ? SESSIONS :
    filter === 'Como DJ' ? SESSIONS.filter(s => s.role === 'DJ') :
    SESSIONS.filter(s => s.role === 'Oyente');

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Historial</Text>
      </View>

      {/* Filters */}
      <View style={s.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[s.filterPill, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.list}>
        {filtered.map((session, i) => (
          <TouchableOpacity key={i} style={s.card}>
            <View style={s.cardHeader}>
              <View>
                <Text style={s.sessionName}>{session.name}</Text>
                <Text style={s.sessionGenre}>{session.genre}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={[s.roleBadge, session.role === 'DJ' ? s.roleDJ : s.roleOyente]}>
                  <Text style={[s.roleText, session.role === 'DJ' ? s.roleDJText : s.roleOyenteText]}>{session.role}</Text>
                </View>
                <Text style={s.sessionDate}>{session.date}</Text>
              </View>
            </View>
            <View style={s.cardStats}>
              <Text style={s.statItem}>⏱ {session.duration}</Text>
              <Text style={s.statItem}>👥 {session.peak} pico</Text>
              <Text style={s.statItem}>🎵 {session.songs} canciones</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary, fontSize: 22 },
  filters: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: colors.surface },
  filterActive: { backgroundColor: colors.primary + '20' },
  filterText: { ...typography.captionBold, color: colors.textMuted, fontSize: 13 },
  filterTextActive: { color: colors.primary },
  list: { padding: spacing.base, gap: spacing.md, paddingBottom: 100 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  sessionName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 16 },
  sessionGenre: { ...typography.caption, color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: borderRadius.full },
  roleDJ: { backgroundColor: colors.primary },
  roleOyente: { backgroundColor: colors.surfaceLight },
  roleText: { ...typography.captionBold, fontSize: 11 },
  roleDJText: { color: '#fff' },
  roleOyenteText: { color: colors.textSecondary },
  sessionDate: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginTop: 4 },
  cardStats: { flexDirection: 'row', gap: spacing.lg },
  statItem: { ...typography.captionBold, color: colors.textPrimary, fontSize: 12 },
});
