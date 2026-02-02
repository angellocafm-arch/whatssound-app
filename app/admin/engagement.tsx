import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const isWide = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth > 768 : true) : Dimensions.get('window').width > 768;

const StatCard = ({icon,iconColor,value,label,trend}:{icon:keyof typeof Ionicons.glyphMap,iconColor:string,value:string|number,label:string,trend?:string}) => (
  <View style={s.stat}>
    <View style={[s.statIcon, {backgroundColor:iconColor+'18'}]}><Ionicons name={icon} size={18} color={iconColor}/></View>
    <Text style={s.statVal}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
    {trend && <Text style={[s.statTrend, {color: trend.startsWith('+')?colors.primary:colors.error}]}>{trend}</Text>}
  </View>
);

const BarChart = ({data,label}:{data:{name:string,value:number,color:string}[],label:string}) => {
  const max = Math.max(...data.map(d=>d.value));
  return (
    <View style={s.chartCard}>
      <Text style={s.chartTitle}>{label}</Text>
      {data.map((d,i) => (
        <View key={i} style={s.barRow}>
          <Text style={s.barLabel}>{d.name}</Text>
          <View style={s.barTrack}>
            <View style={[s.barFill, {width:`${(d.value/max)*100}%`, backgroundColor: d.color}]}/>
          </View>
          <Text style={s.barValue}>{d.value}%</Text>
        </View>
      ))}
    </View>
  );
};

const DAILY = [
  { day: 'Lun', sessions: 8, users: 320, reactions: 1200 },
  { day: 'Mar', sessions: 10, users: 380, reactions: 1450 },
  { day: 'Mié', sessions: 7, users: 290, reactions: 980 },
  { day: 'Jue', sessions: 12, users: 420, reactions: 1800 },
  { day: 'Vie', sessions: 18, users: 530, reactions: 2800 },
  { day: 'Sáb', sessions: 22, users: 610, reactions: 3200 },
  { day: 'Dom', sessions: 15, users: 480, reactions: 2100 },
];

export default function EngagementPage() {
  return (
    <ScrollView style={s.main} contentContainerStyle={s.content}>
      <Text style={s.title}>📈 Engagement</Text>

      <View style={s.statsGrid}>
        <StatCard icon="flame" iconColor="#FB923C" value="47m" label="Duración media sesión" trend="+8%" />
        <StatCard icon="repeat" iconColor={colors.primary} value="3.2" label="Sesiones/usuario/semana" trend="+12%" />
        <StatCard icon="chatbubble" iconColor="#22D3EE" value="6.7" label="Msgs/usuario/sesión" trend="+5%" />
        <StatCard icon="heart" iconColor="#F472B6" value="9.4" label="Reacciones/usuario" trend="+34%" />
      </View>

      <View style={isWide ? s.twoCol : undefined}>
        <View style={isWide ? {flex:1, marginRight: spacing.md} : {marginBottom: spacing.md}}>
          <BarChart label="🎯 Retención" data={[
            { name: 'D1 (24h)', value: 82, color: colors.primary },
            { name: 'D7 (7 días)', value: 68, color: '#22D3EE' },
            { name: 'D14 (14 días)', value: 54, color: '#A78BFA' },
            { name: 'D30 (30 días)', value: 41, color: '#FB923C' },
          ]} />
        </View>
        <View style={isWide ? {flex:1} : {}}>
          <BarChart label="🎵 Acciones por tipo" data={[
            { name: 'Escuchar', value: 92, color: colors.primary },
            { name: 'Reaccionar', value: 78, color: '#FB923C' },
            { name: 'Chatear', value: 65, color: '#22D3EE' },
            { name: 'Votar canción', value: 54, color: '#A78BFA' },
            { name: 'Pedir canción', value: 38, color: '#F472B6' },
            { name: 'Enviar propina', value: 12, color: colors.warning },
          ]} />
        </View>
      </View>

      {/* Weekly Activity Table */}
      <View style={s.chartCard}>
        <Text style={s.chartTitle}>📅 Actividad semanal</Text>
        <View style={s.weekHead}>
          {['Día','Sesiones','Usuarios','Reacciones'].map(h => <Text key={h} style={s.weekTh}>{h}</Text>)}
        </View>
        {DAILY.map((d,i) => (
          <View key={i} style={[s.weekRow, i%2===0 && {backgroundColor:'#0d132180'}]}>
            <Text style={[s.weekTd, {fontWeight:'700'}]}>{d.day}</Text>
            <Text style={s.weekTd}>{d.sessions}</Text>
            <Text style={s.weekTd}>{d.users}</Text>
            <Text style={s.weekTd}>{d.reactions.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Insights */}
      <View style={s.chartCard}>
        <Text style={s.chartTitle}>💡 Insights</Text>
        {[
          '🔥 Los viernes y sábados concentran el 52% de toda la actividad.',
          '🎵 Los usuarios que piden canciones tienen 3x más retención D30.',
          '💬 El chat en sesión correlaciona con +45% duración de escucha.',
          '⭐ Los VIPs generan el 78% de las propinas.',
        ].map((insight, i) => (
          <View key={i} style={s.insightRow}>
            <Text style={s.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  main: { flex: 1 },
  content: { padding: isWide ? spacing.xl : spacing.md, paddingBottom: 100 },
  title: { ...typography.h2, color: colors.textPrimary, fontSize: 24, marginBottom: spacing.md },
  statsGrid: { gap: spacing.sm, marginBottom: spacing.lg, ...(Platform.OS === 'web' ? { display: 'grid' as any, gridTemplateColumns: isWide ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)' } : { flexDirection: 'row', flexWrap: 'wrap' }) },
  stat: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth:1, borderColor: colors.border, gap: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statVal: { ...typography.h2, color: colors.textPrimary, fontSize: 22 },
  statLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  statTrend: { ...typography.captionBold, fontSize: 11 },
  twoCol: { flexDirection: 'row', marginBottom: spacing.md },
  chartCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth:1, borderColor: colors.border, marginBottom: spacing.md },
  chartTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 15, marginBottom: spacing.md },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  barLabel: { ...typography.caption, color: colors.textMuted, fontSize: 12, width: 100 },
  barTrack: { flex: 1, height: 20, backgroundColor: '#0a0f1a', borderRadius: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 10 },
  barValue: { ...typography.captionBold, color: colors.textPrimary, fontSize: 12, width: 40, textAlign: 'right' },
  weekHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  weekTh: { ...typography.captionBold, color: colors.textMuted, fontSize: 11, flex: 1 },
  weekRow: { flexDirection: 'row', paddingVertical: spacing.sm },
  weekTd: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 13, flex: 1 },
  insightRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border + '50' },
  insightText: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 13, lineHeight: 20 },
});
