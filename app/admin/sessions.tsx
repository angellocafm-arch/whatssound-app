/**
 * WhatsSound Admin — Sessions Dashboard
 * Conectado a Supabase
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';

const isWide = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth > 768 : true) : Dimensions.get('window').width > 768;

interface SessionData {
  id: string;
  name: string;
  dj: string;
  genre: string;
  listeners: number;
  peak: number;
  songs: number;
  messages: number;
  tips: string;
  duration: string;
  status: string;
  created: string;
}

const StatBox = ({v,l,c}:{v:string|number,l:string,c:string}) => (
  <View style={s.stat}>
    <View style={[s.statDot, {backgroundColor:c}]}/>
    <Text style={s.statVal}>{v}</Text>
    <Text style={s.statLabel}>{l}</Text>
  </View>
);

export default function SessionsPage() {
  const [filter, setFilter] = useState<'all'|'live'|'ended'>('all');
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTips, setTotalTips] = useState(0);

  // Cargar sesiones desde Supabase
  useEffect(() => {
    const loadSessions = async () => {
      const { data, error } = await supabase
        .from('ws_sessions')
        .select(`
          id, name, genres, status, created_at, started_at, ended_at,
          dj:ws_profiles!dj_id(display_name, dj_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        const enriched = await Promise.all(data.map(async (session: any) => {
          // Contar miembros
          const { count: memberCount } = await supabase
            .from('ws_session_members')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .is('left_at', null);

          // Contar canciones
          const { count: songCount } = await supabase
            .from('ws_songs')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          // Sumar propinas
          const { data: tips } = await supabase
            .from('ws_tips')
            .select('amount')
            .eq('session_id', session.id);
          const tipTotal = tips?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

          // Contar mensajes
          const { count: msgCount } = await supabase
            .from('ws_session_messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          // Calcular duración
          const start = session.started_at ? new Date(session.started_at) : new Date(session.created_at);
          const end = session.ended_at ? new Date(session.ended_at) : new Date();
          const durationMin = Math.floor((end.getTime() - start.getTime()) / 60000);
          const hours = Math.floor(durationMin / 60);
          const mins = durationMin % 60;

          return {
            id: session.id,
            name: session.name,
            dj: session.dj?.dj_name || session.dj?.display_name || 'DJ',
            genre: session.genres?.[0] || 'Mix',
            listeners: memberCount || 0,
            peak: memberCount || 0,
            songs: songCount || 0,
            messages: msgCount || 0,
            tips: `€${tipTotal.toFixed(2)}`,
            duration: `${hours}h ${mins}m`,
            status: session.status || 'live',
            created: new Date(session.created_at).toLocaleString('es-ES'),
          };
        }));

        setSessions(enriched);

        // Total tips
        const { data: allTips } = await supabase.from('ws_tips').select('amount');
        setTotalTips(allTips?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0);
      }
      setLoading(false);
    };

    loadSessions();
  }, []);

  const filtered = sessions.filter(se => filter === 'all' || se.status === filter);
  const liveCount = sessions.filter(s => s.status === 'live').length;
  const totalListeners = sessions.filter(s => s.status === 'live').reduce((a,s) => a+s.listeners, 0);

  if (loading) {
    return (
      <View style={[s.main, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={s.main} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Text style={s.title}>📡 Sesiones</Text>
        <View style={s.liveBadge}>
          <View style={{width:8,height:8,borderRadius:4,backgroundColor:colors.primary}}/>
          <Text style={{color:colors.primary,fontSize:13,fontWeight:'700'}}>{liveCount} live · {totalListeners} listeners</Text>
        </View>
      </View>

      <View style={s.statsRow}>
        <StatBox v={sessions.length} l="Total sesiones" c={colors.primary}/>
        <StatBox v={liveCount} l="En vivo" c="#22D3EE"/>
        <StatBox v={totalListeners} l="Listeners ahora" c="#FB923C"/>
        <StatBox v={`€${totalTips.toFixed(2)}`} l="Tips total" c={colors.warning}/>
      </View>

      <View style={s.filters}>
        {(['all','live','ended'] as const).map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter===f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter===f && {color:colors.primary}]}>{f==='all'?'Todas':f==='live'?'🔴 Live':'Finalizadas'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.table}>
        {/* Header */}
        <View style={[s.row, s.rowHeader]}>
          <Text style={[s.cell, s.cellName, s.headerText]}>Sesión</Text>
          <Text style={[s.cell, s.cellSmall, s.headerText]}>DJ</Text>
          <Text style={[s.cell, s.cellSmall, s.headerText]}>Género</Text>
          <Text style={[s.cell, s.cellNum, s.headerText]}>👥</Text>
          <Text style={[s.cell, s.cellNum, s.headerText]}>🎵</Text>
          <Text style={[s.cell, s.cellNum, s.headerText]}>💬</Text>
          <Text style={[s.cell, s.cellNum, s.headerText]}>💰</Text>
          <Text style={[s.cell, s.cellSmall, s.headerText]}>Duración</Text>
          <Text style={[s.cell, s.cellSmall, s.headerText]}>Estado</Text>
        </View>

        {/* Data rows */}
        {filtered.map((se, i) => (
          <View key={se.id} style={[s.row, i % 2 === 1 && s.rowAlt]}>
            <Text style={[s.cell, s.cellName]} numberOfLines={1}>{se.name}</Text>
            <Text style={[s.cell, s.cellSmall]} numberOfLines={1}>{se.dj}</Text>
            <Text style={[s.cell, s.cellSmall]}>{se.genre}</Text>
            <Text style={[s.cell, s.cellNum]}>{se.listeners}</Text>
            <Text style={[s.cell, s.cellNum]}>{se.songs}</Text>
            <Text style={[s.cell, s.cellNum]}>{se.messages}</Text>
            <Text style={[s.cell, s.cellNum, {color: colors.warning}]}>{se.tips}</Text>
            <Text style={[s.cell, s.cellSmall]}>{se.duration}</Text>
            <View style={s.cell}>
              <View style={[s.statusBadge, se.status === 'live' ? s.statusLive : s.statusEnded]}>
                <Text style={s.statusText}>{se.status === 'live' ? '🔴 Live' : 'Ended'}</Text>
              </View>
            </View>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyText}>No hay sesiones con este filtro</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  main: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.textPrimary, fontSize: 24 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, flexWrap: 'wrap' },
  stat: { flex: 1, minWidth: 140, backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statVal: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  statLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: colors.surface },
  filterActive: { backgroundColor: colors.primary + '20' },
  filterText: { ...typography.bodySmall, color: colors.textSecondary },
  table: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowHeader: { backgroundColor: colors.surfaceDark },
  rowAlt: { backgroundColor: colors.surfaceLight + '30' },
  cell: { fontSize: 13, color: colors.textSecondary },
  cellName: { flex: 2, minWidth: 120 },
  cellSmall: { flex: 1, minWidth: 80 },
  cellNum: { width: 50, textAlign: 'center' },
  headerText: { ...typography.captionBold, color: colors.textMuted, fontSize: 11, textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  statusLive: { backgroundColor: colors.primary + '20' },
  statusEnded: { backgroundColor: colors.textMuted + '20' },
  statusText: { fontSize: 11, fontWeight: '600' },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textMuted },
});
