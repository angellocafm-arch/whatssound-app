import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const isWide = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth > 768 : true) : Dimensions.get('window').width > 768;

const Toggle = ({label, desc, value, onChange}: {label:string, desc:string, value:boolean, onChange:(v:boolean)=>void}) => (
  <View style={s.toggleRow}>
    <View style={{flex:1}}>
      <Text style={s.toggleLabel}>{label}</Text>
      <Text style={s.toggleDesc}>{desc}</Text>
    </View>
    <Switch value={value} onValueChange={onChange} trackColor={{false: colors.border, true: colors.primary+'60'}} thumbColor={value ? colors.primary : colors.textMuted} />
  </View>
);

export default function ConfigPage() {
  const [autoMod, setAutoMod] = useState(true);
  const [aiChat, setAiChat] = useState(true);
  const [tips, setTips] = useState(true);
  const [publicSessions, setPublicSessions] = useState(true);
  const [maxListeners, setMaxListeners] = useState('500');
  const [maxQueue, setMaxQueue] = useState('50');

  return (
    <ScrollView style={s.main} contentContainerStyle={s.content}>
      <Text style={s.title}>⚙️ Configuración</Text>

      {/* General */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>General</Text>
        <Toggle label="Auto-moderación" desc="Detectar y filtrar spam/contenido inapropiado automáticamente" value={autoMod} onChange={setAutoMod} />
        <Toggle label="Chat IA activo" desc="Asistente IA disponible en el dashboard" value={aiChat} onChange={setAiChat} />
        <Toggle label="Propinas habilitadas" desc="Permitir envío de propinas a DJs" value={tips} onChange={setTips} />
        <Toggle label="Sesiones públicas" desc="Permitir sesiones visibles para todos los usuarios" value={publicSessions} onChange={setPublicSessions} />
      </View>

      {/* Limits */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Límites</Text>
        <View style={s.inputRow}>
          <Text style={s.inputLabel}>Máx. listeners por sesión</Text>
          <TextInput style={s.input} value={maxListeners} onChangeText={setMaxListeners} keyboardType="numeric" />
        </View>
        <View style={s.inputRow}>
          <Text style={s.inputLabel}>Máx. canciones en cola</Text>
          <TextInput style={s.input} value={maxQueue} onChangeText={setMaxQueue} keyboardType="numeric" />
        </View>
      </View>

      {/* API & Integrations */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Integraciones</Text>
        {[
          { name: 'Supabase', status: 'Conectado', icon: 'server' as const, color: colors.primary },
          { name: 'Deezer API', status: 'Conectado', icon: 'musical-notes' as const, color: colors.primary },
          { name: 'Anthropic (Claude)', status: 'Conectado', icon: 'sparkles' as const, color: colors.primary },
          { name: 'Stripe', status: 'Pendiente', icon: 'card' as const, color: colors.warning },
          { name: 'Spotify API', status: 'Pendiente', icon: 'disc' as const, color: colors.warning },
          { name: 'Firebase (Push)', status: 'Pendiente', icon: 'notifications' as const, color: colors.warning },
        ].map((int, i) => (
          <View key={i} style={s.intRow}>
            <View style={[s.intIcon, {backgroundColor: int.color+'18'}]}>
              <Ionicons name={int.icon} size={18} color={int.color}/>
            </View>
            <View style={{flex:1}}>
              <Text style={s.intName}>{int.name}</Text>
              <Text style={[s.intStatus, {color: int.color}]}>{int.status}</Text>
            </View>
            <TouchableOpacity style={s.intBtn}>
              <Text style={s.intBtnText}>Configurar</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Admin Users */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Administradores</Text>
        {[
          { name: 'Enrique Alonso (Kike)', email: 'kike@vertex.es', role: 'Super Admin' },
          { name: 'Ángel Fernández', email: 'angel@vertex.es', role: 'Super Admin' },
          { name: 'Leo (IA)', email: 'leo@whatssound.app', role: 'Analista IA (Read-only)' },
        ].map((admin, i) => (
          <View key={i} style={s.adminRow}>
            <View style={s.adminAvatar}>
              <Text style={{color: colors.primary, fontWeight:'700', fontSize:12}}>{admin.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</Text>
            </View>
            <View style={{flex:1}}>
              <Text style={s.adminName}>{admin.name}</Text>
              <Text style={s.adminEmail}>{admin.email}</Text>
            </View>
            <View style={s.roleBadge}>
              <Text style={s.roleText}>{admin.role}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Danger Zone */}
      <View style={[s.section, {borderColor: colors.error+'30'}]}>
        <Text style={[s.sectionTitle, {color: colors.error}]}>⚠️ Zona de peligro</Text>
        <TouchableOpacity style={s.dangerBtn}>
          <Ionicons name="trash" size={16} color={colors.error}/>
          <Text style={s.dangerText}>Limpiar cache</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.dangerBtn}>
          <Ionicons name="refresh" size={16} color={colors.error}/>
          <Text style={s.dangerText}>Reset métricas demo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  main: { flex: 1 },
  content: { padding: isWide ? spacing.xl : spacing.md, paddingBottom: 100 },
  title: { ...typography.h2, color: colors.textPrimary, fontSize: 24, marginBottom: spacing.md },
  section: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth:1, borderColor: colors.border, marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 15, marginBottom: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border+'50' },
  toggleLabel: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 14 },
  toggleDesc: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border+'50' },
  inputLabel: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 14 },
  input: { backgroundColor: '#0a0f1a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, color: colors.textPrimary, fontSize: 14, width: 80, textAlign: 'center', borderWidth: 1, borderColor: colors.border },
  intRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border+'50' },
  intIcon: { width: 36, height: 36, borderRadius: 18, alignItems:'center', justifyContent:'center' },
  intName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 14 },
  intStatus: { ...typography.caption, fontSize: 11 },
  intBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#0a0f1a', borderWidth:1, borderColor: colors.border },
  intBtnText: { ...typography.captionBold, color: colors.textMuted, fontSize: 11 },
  adminRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border+'50' },
  adminAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary+'20', alignItems:'center', justifyContent:'center' },
  adminName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 14 },
  adminEmail: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  roleBadge: { backgroundColor: colors.primary+'15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  roleText: { ...typography.captionBold, color: colors.primary, fontSize: 11 },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.error+'20' },
  dangerText: { ...typography.bodySmall, color: colors.error, fontSize: 14 },
});
