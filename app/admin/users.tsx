/**
 * WhatsSound Admin — Users Dashboard
 * Conectado a Supabase
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';

const isWide = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth > 768 : true) : Dimensions.get('window').width > 768;

interface UserData {
  id: string;
  name: string;
  email: string;
  joined: string;
  sessions: number;
  songs: number;
  tips: string;
  status: string;
  role: string;
}

const roleBadge = (role: string) => {
  const map: Record<string, {bg:string, c:string, l:string}> = {
    dj: { bg: colors.primary+'20', c: colors.primary, l: '🎧 DJ' },
    vip: { bg: '#FFA72620', c: '#FFA726', l: '⭐ VIP' },
    user: { bg: colors.textMuted+'20', c: colors.textMuted, l: 'Usuario' },
    admin: { bg: colors.error+'20', c: colors.error, l: '👑 Admin' },
  };
  const b = map[role] || map.user;
  return <View style={[s.badge, {backgroundColor:b.bg}]}><Text style={{color:b.c, fontSize:11, fontWeight:'700'}}>{b.l}</Text></View>;
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserData|null>(null);

  // Cargar usuarios desde Supabase
  useEffect(() => {
    const loadUsers = async () => {
      const { data, error } = await supabase
        .from('ws_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        const enriched = await Promise.all(data.map(async (user: any) => {
          // Contar sesiones donde participó
          const { count: sessionCount } = await supabase
            .from('ws_session_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          // Contar canciones pedidas
          const { count: songCount } = await supabase
            .from('ws_songs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          // Sumar propinas dadas
          const { data: tips } = await supabase
            .from('ws_tips')
            .select('amount')
            .eq('from_user_id', user.id);
          const tipTotal = tips?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

          // Determinar rol
          let role = 'user';
          if (user.is_admin) role = 'admin';
          else if (user.is_dj) role = 'dj';

          return {
            id: user.id,
            name: user.display_name || user.username || 'Usuario',
            email: user.phone || 'N/A',
            joined: new Date(user.created_at).toLocaleDateString('es-ES'),
            sessions: sessionCount || 0,
            songs: songCount || 0,
            tips: `€${tipTotal.toFixed(2)}`,
            status: 'active',
            role,
          };
        }));

        setUsers(enriched);
      }
      setLoading(false);
    };

    loadUsers();
  }, []);

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const djCount = users.filter(u => u.role === 'dj').length;
  const activeCount = users.filter(u => u.status === 'active').length;

  if (loading) {
    return (
      <View style={[s.main, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
            </View>
            {roleBadge(selected.role)}
          </View>
          <View style={s.detailStats}>
            <View style={s.detailStat}><Text style={s.detailStatVal}>{selected.sessions}</Text><Text style={s.detailStatLabel}>Sesiones</Text></View>
            <View style={s.detailStat}><Text style={s.detailStatVal}>{selected.songs}</Text><Text style={s.detailStatLabel}>Canciones</Text></View>
            <View style={s.detailStat}><Text style={s.detailStatVal}>{selected.tips}</Text><Text style={s.detailStatLabel}>Tips</Text></View>
            <View style={s.detailStat}><Text style={s.detailStatVal}>{selected.joined}</Text><Text style={s.detailStatLabel}>Registro</Text></View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.main} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Text style={s.title}>👥 Usuarios</Text>
        <Text style={s.subtitle}>{users.length} registrados · {djCount} DJs · {activeCount} activos</Text>
      </View>

      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar por nombre o email..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={s.table}>
        {/* Header */}
        <View style={[s.row, s.rowHeader]}>
          <Text style={[s.cell, s.cellName, s.headerText]}>Usuario</Text>
          <Text style={[s.cell, s.cellSmall, s.headerText]}>Email/Teléfono</Text>
          <Text style={[s.cell, s.cellSmall, s.headerText]}>Registro</Text>
          <Text style={[s.cell, s.cellNum, s.headerText]}>📡</Text>
          <Text style={[s.cell, s.cellNum, s.headerText]}>🎵</Text>
          <Text style={[s.cell, s.cellNum, s.headerText]}>💰</Text>
          <Text style={[s.cell, s.cellSmall, s.headerText]}>Rol</Text>
        </View>

        {/* Data rows */}
        {filtered.map((u, i) => (
          <TouchableOpacity key={u.id} style={[s.row, i % 2 === 1 && s.rowAlt]} onPress={() => setSelected(u)}>
            <Text style={[s.cell, s.cellName]} numberOfLines={1}>{u.name}</Text>
            <Text style={[s.cell, s.cellSmall]} numberOfLines={1}>{u.email}</Text>
            <Text style={[s.cell, s.cellSmall]}>{u.joined}</Text>
            <Text style={[s.cell, s.cellNum]}>{u.sessions}</Text>
            <Text style={[s.cell, s.cellNum]}>{u.songs}</Text>
            <Text style={[s.cell, s.cellNum, {color: colors.warning}]}>{u.tips}</Text>
            <View style={s.cell}>{roleBadge(u.role)}</View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyText}>No se encontraron usuarios</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  main: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  header: { marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.textPrimary, fontSize: 24 },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  searchRow: { marginBottom: spacing.md },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary },
  table: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowHeader: { backgroundColor: colors.surfaceDark },
  rowAlt: { backgroundColor: colors.surfaceLight + '30' },
  cell: { fontSize: 13, color: colors.textSecondary },
  cellName: { flex: 2, minWidth: 120 },
  cellSmall: { flex: 1, minWidth: 80 },
  cellNum: { width: 50, textAlign: 'center' },
  headerText: { ...typography.captionBold, color: colors.textMuted, fontSize: 11, textTransform: 'uppercase' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.lg },
  detailCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  detailAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  detailName: { ...typography.h3, color: colors.textPrimary },
  detailEmail: { ...typography.bodySmall, color: colors.textSecondary },
  detailStats: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  detailStat: { flex: 1, minWidth: 80, alignItems: 'center', backgroundColor: colors.surfaceLight, padding: spacing.md, borderRadius: borderRadius.md },
  detailStatVal: { ...typography.h3, color: colors.textPrimary },
  detailStatLabel: { ...typography.caption, color: colors.textMuted },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textMuted },
});
