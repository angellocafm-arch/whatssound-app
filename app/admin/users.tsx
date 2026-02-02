import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const isWide = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth > 768 : true) : Dimensions.get('window').width > 768;

const USERS = [
  { id:'u1', name:'María García', email:'maria@gmail.com', joined:'2026-01-15', sessions:12, songs:34, tips:'€8.50', status:'active', role:'user' },
  { id:'u2', name:'Pablo Rodríguez', email:'pablo@gmail.com', joined:'2026-01-18', sessions:8, songs:22, tips:'€3.00', status:'active', role:'user' },
  { id:'u3', name:'Ana López', email:'ana@gmail.com', joined:'2026-01-10', sessions:28, songs:67, tips:'€45.00', status:'active', role:'vip' },
  { id:'u4', name:'DJ Carlos Madrid', email:'carlos@djcarlos.com', joined:'2025-12-20', sessions:45, songs:890, tips:'€234.00', status:'active', role:'dj' },
  { id:'u5', name:'Sofía Torres', email:'sofia@gmail.com', joined:'2026-01-22', sessions:5, songs:12, tips:'€0', status:'active', role:'user' },
  { id:'u6', name:'Diego Fernández', email:'diego@gmail.com', joined:'2026-01-25', sessions:3, songs:8, tips:'€1.50', status:'active', role:'user' },
  { id:'u7', name:'Luna DJ', email:'luna@djluna.com', joined:'2025-11-15', sessions:78, songs:2100, tips:'€567.00', status:'active', role:'dj' },
  { id:'u8', name:'Carlos Martín', email:'carlos.m@gmail.com', joined:'2026-01-28', sessions:2, songs:5, tips:'€0', status:'active', role:'user' },
  { id:'u9', name:'Lucía Vega', email:'lucia@gmail.com', joined:'2026-01-20', sessions:6, songs:15, tips:'€2.00', status:'inactive', role:'user' },
  { id:'u10', name:'Javier Hernández', email:'javi@gmail.com', joined:'2026-01-30', sessions:1, songs:3, tips:'€0', status:'active', role:'user' },
  { id:'u11', name:'Sarah B', email:'sarah@djsarah.com', joined:'2025-12-01', sessions:56, songs:1450, tips:'€389.00', status:'active', role:'dj' },
  { id:'u12', name:'Paco Techno', email:'paco@techno.com', joined:'2026-01-05', sessions:32, songs:780, tips:'€123.00', status:'active', role:'dj' },
];

const roleBadge = (role: string) => {
  const map: Record<string, {bg:string, c:string, l:string}> = {
    dj: { bg: colors.primary+'20', c: colors.primary, l: '🎧 DJ' },
    vip: { bg: '#FFA72620', c: '#FFA726', l: '⭐ VIP' },
    user: { bg: colors.textMuted+'20', c: colors.textMuted, l: 'Usuario' },
  };
  const b = map[role] || map.user;
  return <View style={[s.badge, {backgroundColor:b.bg}]}><Text style={{color:b.c, fontSize:11, fontWeight:'700'}}>{b.l}</Text></View>;
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof USERS[0]|null>(null);
  const filtered = USERS.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  if (selected) {
    return (
      <ScrollView style={s.main} contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => setSelected(null)} style={s.back}>
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={{color: colors.primary, fontSize: 13, fontWeight: '600'}}>Volver</Text>
        </TouchableOpacity>
        <View style={s.detailCard}>
          <View style={s.detailHeader}>
            <View style={[s.detailAvatar, {backgroundColor: colors.primary+'20'}]}>
              <Text style={{color: colors.primary, fontSize: 22, fontWeight: '700'}}>{selected.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</Text>
            </View>
            <View style={{flex:1}}>
              <Text style={s.detailName}>{selected.name}</Text>
              <Text style={s.detailEmail}>{selected.email}</Text>
              <Text style={s.detailDate}>Desde {new Date(selected.joined).toLocaleDateString('es-ES')}</Text>
            </View>
            {roleBadge(selected.role)}
          </View>
          <View style={s.detailStats}>
            {[
              {v: selected.sessions, l: 'Sesiones'},
              {v: selected.songs, l: 'Canciones'},
              {v: selected.tips, l: 'Propinas'},
              {v: selected.status === 'active' ? '✅' : '⚠️', l: 'Estado'},
            ].map((st, i) => (
              <View key={i} style={s.detailStat}>
                <Text style={s.detailStatVal}>{st.v}</Text>
                <Text style={s.detailStatLabel}>{st.l}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.main} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Text style={s.title}>👤 Usuarios</Text>
        <Text style={s.count}>{filtered.length} usuarios</Text>
      </View>
      <TextInput style={s.search} placeholder="🔍 Buscar por nombre o email..." placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} />
      <View style={s.table}>
        <View style={s.tableHead}>
          {['Nombre','Email','Rol','Sesiones','Propinas','Estado','Registro'].map(h => (
            <Text key={h} style={[s.th, h==='Nombre'||h==='Email'?{flex:2}:{}]}>{h}</Text>
          ))}
        </View>
        {filtered.map((u, i) => (
          <TouchableOpacity key={u.id} style={[s.tr, i%2===0 && s.trAlt]} onPress={() => setSelected(u)}>
            <Text style={[s.td, {flex:2, fontWeight:'600'}]}>{u.name}</Text>
            <Text style={[s.td, {flex:2}]}>{u.email}</Text>
            <View style={{width:90}}>{roleBadge(u.role)}</View>
            <Text style={s.td}>{u.sessions}</Text>
            <Text style={s.td}>{u.tips}</Text>
            <Text style={[s.td, {color: u.status==='active' ? colors.primary : colors.warning}]}>{u.status==='active'?'● Online':'○ Offline'}</Text>
            <Text style={[s.td, {color: colors.textMuted, fontSize: 11}]}>{new Date(u.joined).toLocaleDateString('es-ES')}</Text>
          </TouchableOpacity>
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
  count: { ...typography.caption, color: colors.textMuted },
  search: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.textPrimary, fontSize: 13, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  table: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  tableHead: { flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: '#0d1321', borderBottomWidth: 1, borderBottomColor: colors.border },
  th: { ...typography.captionBold, color: colors.textMuted, fontSize: 11, width: 90 },
  tr: { flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center' },
  trAlt: { backgroundColor: '#0d132180' },
  td: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 13, width: 90 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignSelf: 'flex-start' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  detailCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  detailAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  detailName: { ...typography.h3, color: colors.textPrimary, fontSize: 20 },
  detailEmail: { ...typography.bodySmall, color: colors.textMuted, fontSize: 13 },
  detailDate: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  detailStats: { flexDirection: 'row', gap: spacing.md },
  detailStat: { flex: 1, alignItems: 'center', backgroundColor: '#0a0f1a', borderRadius: borderRadius.md, padding: spacing.md },
  detailStatVal: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  detailStatLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
});
