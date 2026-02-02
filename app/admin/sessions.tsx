import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const isWide = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth > 768 : true) : Dimensions.get('window').width > 768;

const SESSIONS = [
  { id:'s1', name:'Viernes Latino 🔥', dj:'DJ Carlos Madrid', genre:'Reggaetón', listeners:45, peak:67, songs:12, messages:89, reactions:234, tips:'€23.50', duration:'1h 23m', status:'live', created:'2026-02-02 22:00' },
  { id:'s2', name:'Chill & Study Beats', dj:'Luna DJ', genre:'Lo-fi', listeners:203, peak:245, songs:34, messages:156, reactions:567, tips:'€45.00', duration:'3h 12m', status:'live', created:'2026-02-02 20:00' },
  { id:'s3', name:'Deep House Sunset', dj:'Sarah B', genre:'Deep House', listeners:128, peak:189, songs:28, messages:112, reactions:445, tips:'€67.00', duration:'2h 45m', status:'live', created:'2026-02-02 21:00' },
  { id:'s4', name:'Warehouse Session', dj:'Paco Techno', genre:'Techno', listeners:89, peak:112, songs:22, messages:67, reactions:198, tips:'€12.00', duration:'1h 55m', status:'live', created:'2026-02-02 22:30' },
  { id:'s5', name:'Old School Hip Hop', dj:'MC Raúl', genre:'Hip Hop', listeners:67, peak:78, songs:18, messages:45, reactions:123, tips:'€8.50', duration:'1h 10m', status:'live', created:'2026-02-02 23:00' },
  { id:'s6', name:'Friday Night Mix', dj:'DJ Alex', genre:'Pop/Dance', listeners:0, peak:156, songs:45, messages:234, reactions:678, tips:'€89.00', duration:'4h 10m', status:'ended', created:'2026-02-01 22:00' },
  { id:'s7', name:'Salsa Night', dj:'DJ Rosa', genre:'Salsa', listeners:0, peak:98, songs:32, messages:145, reactions:345, tips:'€34.00', duration:'3h 00m', status:'ended', created:'2026-02-01 21:00' },
  { id:'s8', name:'Indie Vibes', dj:'Marta Indie', genre:'Indie', listeners:0, peak:45, songs:22, messages:56, reactions:89, tips:'€5.00', duration:'2h 15m', status:'ended', created:'2026-01-31 20:00' },
];

const StatBox = ({v,l,c}:{v:string|number,l:string,c:string}) => (
  <View style={s.stat}>
    <View style={[s.statDot, {backgroundColor:c}]}/>
    <Text style={s.statVal}>{v}</Text>
    <Text style={s.statLabel}>{l}</Text>
  </View>
);

export default function SessionsPage() {
  const [filter, setFilter] = useState<'all'|'live'|'ended'>('all');
  const filtered = SESSIONS.filter(se => filter === 'all' || se.status === filter);
  const liveCount = SESSIONS.filter(s => s.status === 'live').length;
  const totalListeners = SESSIONS.filter(s => s.status === 'live').reduce((a,s) => a+s.listeners, 0);

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
        <StatBox v={SESSIONS.length} l="Total sesiones" c={colors.primary}/>
        <StatBox v={liveCount} l="En vivo" c="#22D3EE"/>
        <StatBox v={totalListeners} l="Listeners ahora" c="#FB923C"/>
        <StatBox v="€284.00" l="Tips total" c={colors.warning}/>
      </View>

      <View style={s.filters}>
        {(['all','live','ended'] as const).map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter===f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter===f && {color:colors.primary}]}>{f==='all'?'Todas':f==='live'?'🔴 Live':'Finalizadas'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.table}>
        <View style={s.tableHead}>
          {['Sesión','DJ','Género','Listeners','Canciones','Msgs','Tips','Duración','Estado'].map(h => (
            <Text key={h} style={[s.th, (h==='Sesión'||h==='DJ')?{flex:2}:{}]}>{h}</Text>
          ))}
        </View>
        {filtered.map((se, i) => (
          <View key={se.id} style={[s.tr, i%2===0 && s.trAlt]}>
            <Text style={[s.td, {flex:2, fontWeight:'600'}]}>{se.name}</Text>
            <Text style={[s.td, {flex:2}]}>{se.dj}</Text>
            <Text style={s.td}>{se.genre}</Text>
            <Text style={[s.td, {fontWeight:'700'}]}>{se.listeners}</Text>
            <Text style={s.td}>{se.songs}</Text>
            <Text style={s.td}>{se.messages}</Text>
            <Text style={s.td}>{se.tips}</Text>
            <Text style={s.td}>{se.duration}</Text>
            <View style={{width:80}}>
              <View style={[s.statusBadge, se.status==='live' ? s.statusLive : s.statusEnded]}>
                <Text style={{color: se.status==='live' ? colors.primary : colors.textMuted, fontSize:11, fontWeight:'700'}}>{se.status==='live'?'● LIVE':'Ended'}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  main: { flex: 1 },
  content: { padding: isWide ? spacing.xl : spacing.md, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.textPrimary, fontSize: 24 },
  liveBadge: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:colors.primary+'15', paddingHorizontal:12, paddingVertical:6, borderRadius:20 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, ...(Platform.OS === 'web' ? { display: 'grid' as any, gridTemplateColumns: 'repeat(4, 1fr)' } : {}) },
  stat: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth:1, borderColor:colors.border, gap:4 },
  statDot: { width:8, height:8, borderRadius:4 },
  statVal: { ...typography.h3, color: colors.textPrimary, fontSize: 20 },
  statLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth:1, borderColor: colors.border },
  filterActive: { borderColor: colors.primary, backgroundColor: colors.primary+'15' },
  filterText: { ...typography.captionBold, color: colors.textMuted, fontSize: 12 },
  table: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  tableHead: { flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: '#0d1321', borderBottomWidth: 1, borderBottomColor: colors.border },
  th: { ...typography.captionBold, color: colors.textMuted, fontSize: 11, width: 80 },
  tr: { flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center' },
  trAlt: { backgroundColor: '#0d132180' },
  td: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 13, width: 80 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusLive: { backgroundColor: colors.primary+'18' },
  statusEnded: { backgroundColor: colors.textMuted+'18' },
});
