import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const isWide = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth > 768 : true) : Dimensions.get('window').width > 768;

const TIPS_BY_DJ = [
  { dj: 'Luna DJ', total: '€567', sessions: 78, avg: '€7.27' },
  { dj: 'Sarah B', total: '€389', sessions: 56, avg: '€6.95' },
  { dj: 'DJ Carlos Madrid', total: '€234', sessions: 45, avg: '€5.20' },
  { dj: 'Paco Techno', total: '€123', sessions: 32, avg: '€3.84' },
  { dj: 'DJ Alex', total: '€89', sessions: 24, avg: '€3.71' },
];

const TOP_TIPPERS = [
  { name: 'Ana López ⭐', total: '€45.00', tips: 12, avgTip: '€3.75' },
  { name: 'Carlos Martín', total: '€28.50', tips: 8, avgTip: '€3.56' },
  { name: 'María García', total: '€22.00', tips: 15, avgTip: '€1.47' },
  { name: 'Pablo Rodríguez', total: '€18.00', tips: 6, avgTip: '€3.00' },
  { name: 'Diego Fernández', total: '€12.50', tips: 4, avgTip: '€3.13' },
];

const MONTHLY = [
  { month: 'Oct 2025', revenue: '€0', users: 0 },
  { month: 'Nov 2025', revenue: '€45', users: 23 },
  { month: 'Dec 2025', revenue: '€189', users: 87 },
  { month: 'Ene 2026', revenue: '€567', users: 342 },
  { month: 'Feb 2026*', revenue: '€1,234', users: 1247 },
];

export default function RevenuePage() {
  return (
    <ScrollView style={s.main} contentContainerStyle={s.content}>
      <Text style={s.title}>💰 Revenue</Text>

      <View style={s.statsGrid}>
        <View style={s.stat}>
          <View style={[s.statIcon, {backgroundColor: colors.warning+'18'}]}><Ionicons name="cash" size={20} color={colors.warning}/></View>
          <Text style={s.statVal}>€1,234</Text>
          <Text style={s.statLabel}>Revenue total</Text>
          <Text style={[s.statTrend, {color: colors.primary}]}>+118% vs mes anterior</Text>
        </View>
        <View style={s.stat}>
          <View style={[s.statIcon, {backgroundColor: colors.primary+'18'}]}><Ionicons name="trending-up" size={20} color={colors.primary}/></View>
          <Text style={s.statVal}>€2,400</Text>
          <Text style={s.statLabel}>MRR proyectado</Text>
          <Text style={[s.statTrend, {color: colors.primary}]}>Estimación feb</Text>
        </View>
        <View style={s.stat}>
          <View style={[s.statIcon, {backgroundColor: '#FB923C18'}]}><Ionicons name="gift" size={20} color="#FB923C"/></View>
          <Text style={s.statVal}>€15.80</Text>
          <Text style={s.statLabel}>Propina media/sesión</Text>
          <Text style={[s.statTrend, {color: colors.primary}]}>+67%</Text>
        </View>
        <View style={s.stat}>
          <View style={[s.statIcon, {backgroundColor: '#A78BFA18'}]}><Ionicons name="people" size={20} color="#A78BFA"/></View>
          <Text style={s.statVal}>8.2%</Text>
          <Text style={s.statLabel}>Tasa de conversión</Text>
          <Text style={s.statLabel}>(envían propina)</Text>
        </View>
      </View>

      <View style={isWide ? s.twoCol : undefined}>
        {/* Tips by DJ */}
        <View style={[s.tableCard, isWide ? {flex:1, marginRight: spacing.md} : {marginBottom: spacing.md}]}>
          <Text style={s.tableTitle}>🎧 Revenue por DJ</Text>
          <View style={s.tableHead}>
            {['DJ','Total','Sesiones','Media'].map(h => <Text key={h} style={[s.th, h==='DJ'?{flex:2}:{}]}>{h}</Text>)}
          </View>
          {TIPS_BY_DJ.map((d,i) => (
            <View key={i} style={[s.tr, i%2===0 && s.trAlt]}>
              <Text style={[s.td, {flex:2, fontWeight:'600'}]}>{d.dj}</Text>
              <Text style={[s.td, {color: colors.warning, fontWeight:'700'}]}>{d.total}</Text>
              <Text style={s.td}>{d.sessions}</Text>
              <Text style={s.td}>{d.avg}</Text>
            </View>
          ))}
        </View>

        {/* Top Tippers */}
        <View style={[s.tableCard, isWide ? {flex:1} : {marginBottom: spacing.md}]}>
          <Text style={s.tableTitle}>⭐ Top Tippers</Text>
          <View style={s.tableHead}>
            {['Usuario','Total','Propinas','Media'].map(h => <Text key={h} style={[s.th, h==='Usuario'?{flex:2}:{}]}>{h}</Text>)}
          </View>
          {TOP_TIPPERS.map((t,i) => (
            <View key={i} style={[s.tr, i%2===0 && s.trAlt]}>
              <Text style={[s.td, {flex:2, fontWeight:'600'}]}>{t.name}</Text>
              <Text style={[s.td, {color: colors.warning, fontWeight:'700'}]}>{t.total}</Text>
              <Text style={s.td}>{t.tips}</Text>
              <Text style={s.td}>{t.avgTip}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Monthly Growth */}
      <View style={s.tableCard}>
        <Text style={s.tableTitle}>📅 Crecimiento mensual</Text>
        <View style={s.tableHead}>
          {['Mes','Revenue','Usuarios','Crecimiento'].map(h => <Text key={h} style={[s.th, {flex:1}]}>{h}</Text>)}
        </View>
        {MONTHLY.map((m,i) => (
          <View key={i} style={[s.tr, i%2===0 && s.trAlt]}>
            <Text style={[s.td, {flex:1, fontWeight:'600'}]}>{m.month}</Text>
            <Text style={[s.td, {flex:1, color: colors.warning, fontWeight:'700'}]}>{m.revenue}</Text>
            <Text style={[s.td, {flex:1}]}>{m.users.toLocaleString()}</Text>
            <Text style={[s.td, {flex:1, color: colors.primary}]}>{i > 0 ? '📈' : '—'}</Text>
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
  twoCol: { flexDirection: 'row' },
  tableCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth:1, borderColor: colors.border, marginBottom: spacing.md },
  tableTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 15, marginBottom: spacing.sm },
  tableHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  th: { ...typography.captionBold, color: colors.textMuted, fontSize: 11, width: 80 },
  tr: { flexDirection: 'row', paddingVertical: spacing.sm, alignItems: 'center' },
  trAlt: { backgroundColor: '#0d132180' },
  td: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 13, width: 80 },
});
