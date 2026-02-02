import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const isWide = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth > 768 : true) : Dimensions.get('window').width > 768;

const ALERTS = [
  { id:'a1', type:'report', severity:'medium', title:'Mensaje inapropiado reportado', desc:'Usuario "Javi R." envió contenido ofensivo en "Viernes Latino"', session:'Viernes Latino', reporter:'ModLaura', time:'hace 2h', status:'reviewing' },
  { id:'a2', type:'system', severity:'low', title:'Latencia WebSocket elevada', desc:'EU-West superó 500ms de latencia durante 3 minutos', session:'Global', reporter:'Sistema', time:'hace 1h', status:'resolved' },
  { id:'a3', type:'report', severity:'high', title:'Spam masivo en chat', desc:'Bot detectado enviando 50+ mensajes en 2 minutos', session:'Deep House Sunset', reporter:'Auto-mod', time:'hace 3h', status:'resolved' },
  { id:'a4', type:'report', severity:'medium', title:'Contenido con copyright', desc:'Canción no licenciada detectada en cola', session:'Techno Underground', reporter:'Sistema', time:'hace 4h', status:'pending' },
  { id:'a5', type:'system', severity:'low', title:'Pico de memoria servidor', desc:'80% uso RAM durante 5 minutos — auto-escalado activado', session:'Global', reporter:'Sistema', time:'hace 6h', status:'resolved' },
  { id:'a6', type:'report', severity:'low', title:'Usuario bloqueado por comunidad', desc:'3+ reportes de diferentes usuarios contra "TrollMaster99"', session:'Chill & Study Beats', reporter:'Comunidad', time:'hace 8h', status:'resolved' },
  { id:'a7', type:'system', severity:'low', title:'Deploy completado', desc:'Versión 2.1.4 desplegada correctamente', session:'Global', reporter:'CI/CD', time:'hace 12h', status:'resolved' },
];

const sevColor = (s: string) => s === 'high' ? colors.error : s === 'medium' ? colors.warning : colors.textMuted;
const statusColor = (s: string) => s === 'resolved' ? colors.primary : s === 'reviewing' ? '#A78BFA' : colors.warning;

export default function AlertsPage() {
  const [filter, setFilter] = useState<'all'|'pending'|'reviewing'|'resolved'>('all');
  const filtered = ALERTS.filter(a => filter === 'all' || a.status === filter);

  return (
    <ScrollView style={s.main} contentContainerStyle={s.content}>
      <Text style={s.title}>🚨 Alertas</Text>

      <View style={s.statsGrid}>
        <View style={s.stat}>
          <Text style={[s.statVal, {color: colors.warning}]}>2</Text>
          <Text style={s.statLabel}>Pendientes</Text>
        </View>
        <View style={s.stat}>
          <Text style={[s.statVal, {color: '#A78BFA'}]}>1</Text>
          <Text style={s.statLabel}>En revisión</Text>
        </View>
        <View style={s.stat}>
          <Text style={[s.statVal, {color: colors.primary}]}>4</Text>
          <Text style={s.statLabel}>Resueltas hoy</Text>
        </View>
        <View style={s.stat}>
          <Text style={[s.statVal, {color: colors.textPrimary}]}>99.97%</Text>
          <Text style={s.statLabel}>Uptime</Text>
        </View>
      </View>

      <View style={s.filters}>
        {(['all','pending','reviewing','resolved'] as const).map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter===f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter===f && {color:colors.primary}]}>
              {f==='all'?'Todas':f==='pending'?'⏳ Pendientes':f==='reviewing'?'🔍 Revisando':'✅ Resueltas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.map(a => (
        <View key={a.id} style={s.alertCard}>
          <View style={s.alertHeader}>
            <View style={[s.sevBadge, {backgroundColor: sevColor(a.severity)+'20'}]}>
              <Text style={{color: sevColor(a.severity), fontSize:11, fontWeight:'700'}}>
                {a.severity === 'high' ? '🔴 Alta' : a.severity === 'medium' ? '🟡 Media' : '🟢 Baja'}
              </Text>
            </View>
            <View style={[s.statusBadge, {backgroundColor: statusColor(a.status)+'20'}]}>
              <Text style={{color: statusColor(a.status), fontSize:11, fontWeight:'700'}}>
                {a.status === 'resolved' ? '✅ Resuelta' : a.status === 'reviewing' ? '🔍 Revisando' : '⏳ Pendiente'}
              </Text>
            </View>
            <Text style={s.alertTime}>{a.time}</Text>
          </View>
          <Text style={s.alertTitle}>{a.title}</Text>
          <Text style={s.alertDesc}>{a.desc}</Text>
          <View style={s.alertMeta}>
            <Text style={s.alertMetaText}>📡 {a.session}</Text>
            <Text style={s.alertMetaText}>👤 {a.reporter}</Text>
            <Text style={s.alertMetaText}>{a.type === 'report' ? '📋 Reporte' : '⚙️ Sistema'}</Text>
          </View>
          {a.status !== 'resolved' && (
            <View style={s.alertActions}>
              <TouchableOpacity style={s.actionBtn}><Text style={s.actionText}>Revisar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, s.actionResolve]}><Text style={[s.actionText, {color:colors.primary}]}>Resolver</Text></TouchableOpacity>
              <TouchableOpacity style={s.actionBtn}><Text style={[s.actionText, {color:colors.error}]}>Escalar</Text></TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  main: { flex: 1 },
  content: { padding: isWide ? spacing.xl : spacing.md, paddingBottom: 100 },
  title: { ...typography.h2, color: colors.textPrimary, fontSize: 24, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, alignItems:'center', borderWidth:1, borderColor: colors.border },
  statVal: { ...typography.h2, fontSize: 24 },
  statLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth:1, borderColor: colors.border },
  filterActive: { borderColor: colors.primary, backgroundColor: colors.primary+'15' },
  filterText: { ...typography.captionBold, color: colors.textMuted, fontSize: 12 },
  alertCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth:1, borderColor: colors.border, marginBottom: spacing.sm },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  alertTime: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginLeft: 'auto' },
  alertTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 14, marginBottom: 4 },
  alertDesc: { ...typography.bodySmall, color: colors.textSecondary, fontSize: 13, marginBottom: spacing.sm },
  alertMeta: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  alertMetaText: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  alertActions: { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#0a0f1a' },
  actionResolve: { backgroundColor: colors.primary+'15' },
  actionText: { ...typography.captionBold, color: colors.textMuted, fontSize: 12 },
});
