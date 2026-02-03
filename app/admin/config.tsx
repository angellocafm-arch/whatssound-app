import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Platform, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { getAIConfig, setAIConfig, PROVIDER_MODELS, type AIConfig } from '../../src/lib/ai-provider';
import { isSeedVisible, toggleSeedVisibility, deleteTestData, deleteAllData, getDataCounts } from '../../src/lib/admin-actions';

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
  
  // AI Config
  const [aiProvider, setAiProvider] = useState<AIConfig['provider']>('mock');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiBaseUrl, setAiBaseUrl] = useState('');
  const [aiSaved, setAiSaved] = useState(false);

  useEffect(() => {
    const config = getAIConfig();
    setAiProvider(config.provider);
    setAiApiKey(config.apiKey || '');
    setAiModel(config.model || '');
    setAiBaseUrl(config.baseUrl || '');
  }, []);

  // Data management state
  const [seedVisible, setSeedVisible] = useState(true);
  const [dataCounts, setDataCounts] = useState({ seed: 0, test: 0, total: 0 });
  const [actionResult, setActionResult] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<'test' | 'all' | null>(null);

  useEffect(() => {
    isSeedVisible().then(setSeedVisible);
    getDataCounts().then(setDataCounts);
  }, []);

  const handleToggleSeed = async () => {
    const newVal = !seedVisible;
    const { ok } = await toggleSeedVisibility(newVal);
    if (ok) {
      setSeedVisible(newVal);
      setActionResult(newVal ? '✅ Datos semilla activados' : '✅ Datos semilla ocultados');
      setTimeout(() => setActionResult(''), 3000);
    }
  };

  const handleDeleteTest = async () => {
    if (confirmDelete !== 'test') { setConfirmDelete('test'); return; }
    const { ok, deleted, error } = await deleteTestData();
    setConfirmDelete(null);
    if (ok) {
      setActionResult(`✅ ${deleted} registros de prueba eliminados`);
      getDataCounts().then(setDataCounts);
    } else {
      setActionResult(`❌ Error: ${error}`);
    }
    setTimeout(() => setActionResult(''), 4000);
  };

  const handleDeleteAll = async () => {
    if (confirmDelete !== 'all') { setConfirmDelete('all'); return; }
    const { ok, deleted, error } = await deleteAllData();
    setConfirmDelete(null);
    if (ok) {
      setActionResult(`✅ ${deleted} registros eliminados — base de datos vacía`);
      getDataCounts().then(setDataCounts);
    } else {
      setActionResult(`❌ Error: ${error}`);
    }
    setTimeout(() => setActionResult(''), 4000);
  };

  const saveAIConfig = () => {
    setAIConfig({
      provider: aiProvider,
      apiKey: aiApiKey || undefined,
      model: aiModel || undefined,
      baseUrl: aiBaseUrl || undefined,
    });
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2000);
  };

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

      {/* AI Provider Config */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>🤖 Asistente IA</Text>
        <Text style={{...typography.caption, color: colors.textMuted, marginBottom: spacing.md}}>
          Configura el modelo de IA para el chat del dashboard. Cambia entre proveedores sin tocar código.
        </Text>
        
        {/* Provider selector */}
        <Text style={s.inputLabel}>Provider</Text>
        <View style={{flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap'}}>
          {Object.entries(PROVIDER_MODELS).map(([key, val]) => (
            <TouchableOpacity
              key={key}
              onPress={() => { setAiProvider(key as AIConfig['provider']); setAiModel(''); }}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                backgroundColor: aiProvider === key ? colors.primary : colors.surface,
                borderWidth: 1, borderColor: aiProvider === key ? colors.primary : colors.border,
              }}
            >
              <Text style={{color: aiProvider === key ? colors.textOnPrimary : colors.textSecondary, fontSize: 13, fontWeight: '600'}}>{val.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Model selector */}
        {aiProvider !== 'mock' && (
          <>
            <Text style={s.inputLabel}>Modelo</Text>
            <View style={{flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap'}}>
              {PROVIDER_MODELS[aiProvider]?.models.map(m => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setAiModel(m.id)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                    backgroundColor: aiModel === m.id ? colors.accent+'30' : colors.surface,
                    borderWidth: 1, borderColor: aiModel === m.id ? colors.accent : colors.border,
                  }}
                >
                  <Text style={{color: aiModel === m.id ? colors.accent : colors.textSecondary, fontSize: 12}}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.inputRow}>
              <Text style={s.inputLabel}>API Key</Text>
              <TextInput
                style={s.input}
                value={aiApiKey}
                onChangeText={setAiApiKey}
                placeholder="sk-... o clave de API"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
            </View>

            {aiProvider === 'custom' && (
              <View style={s.inputRow}>
                <Text style={s.inputLabel}>Base URL</Text>
                <TextInput
                  style={s.input}
                  value={aiBaseUrl}
                  onChangeText={setAiBaseUrl}
                  placeholder="https://api.ejemplo.com/v1"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            )}
          </>
        )}

        <TouchableOpacity onPress={saveAIConfig} style={{
          backgroundColor: aiSaved ? '#34D399' : colors.primary,
          paddingVertical: 12, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.sm,
        }}>
          <Text style={{color: colors.textOnPrimary, fontWeight: '700', fontSize: 14}}>
            {aiSaved ? '✓ Guardado' : 'Guardar configuración IA'}
          </Text>
        </TouchableOpacity>
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

      {/* Data Management — 3 Buttons */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>🗄️ Gestión de datos</Text>
        <Text style={{...typography.caption, color: colors.textMuted, marginBottom: spacing.md}}>
          Datos semilla: {dataCounts.seed} usuarios · Datos de prueba: {dataCounts.test} usuarios · Total: {dataCounts.total}
        </Text>

        {actionResult ? (
          <View style={{backgroundColor: actionResult.startsWith('✅') ? colors.primary+'20' : colors.error+'20', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md}}>
            <Text style={{color: actionResult.startsWith('✅') ? colors.primary : colors.error, fontSize: 14, fontWeight: '600'}}>{actionResult}</Text>
          </View>
        ) : null}

        {/* Button 1: Toggle seed visibility */}
        <TouchableOpacity onPress={handleToggleSeed} style={{
          flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
          backgroundColor: seedVisible ? colors.primary+'15' : colors.surface,
          padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm,
          borderWidth: 1, borderColor: seedVisible ? colors.primary+'40' : colors.border,
        }}>
          <Ionicons name={seedVisible ? 'eye' : 'eye-off'} size={20} color={seedVisible ? colors.primary : colors.textMuted}/>
          <View style={{flex: 1}}>
            <Text style={{color: colors.textPrimary, fontWeight: '700', fontSize: 14}}>
              {seedVisible ? '👁️ Datos semilla VISIBLES' : '🙈 Datos semilla OCULTOS'}
            </Text>
            <Text style={{color: colors.textMuted, fontSize: 12, marginTop: 2}}>
              {seedVisible ? 'Los 15 usuarios y sesiones de demo aparecen en la app' : 'Solo se ven usuarios reales de pruebas'}
            </Text>
          </View>
          <View style={{backgroundColor: seedVisible ? colors.primary : colors.textMuted, width: 48, height: 26, borderRadius: 13, justifyContent: 'center', padding: 2}}>
            <View style={{width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignSelf: seedVisible ? 'flex-end' : 'flex-start'}} />
          </View>
        </TouchableOpacity>

        {/* Button 2: Delete test data */}
        <TouchableOpacity onPress={handleDeleteTest} style={{
          flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
          backgroundColor: confirmDelete === 'test' ? colors.warning+'20' : colors.surface,
          padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm,
          borderWidth: 1, borderColor: confirmDelete === 'test' ? colors.warning : colors.border,
        }}>
          <Ionicons name="trash-outline" size={20} color={colors.warning}/>
          <View style={{flex: 1}}>
            <Text style={{color: colors.textPrimary, fontWeight: '700', fontSize: 14}}>
              {confirmDelete === 'test' ? '⚠️ Pulsa otra vez para confirmar' : '🧹 Borrar datos de prueba'}
            </Text>
            <Text style={{color: colors.textMuted, fontSize: 12, marginTop: 2}}>
              Elimina los {dataCounts.test} usuarios de test y sus acciones. Mantiene datos semilla.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Button 3: Delete ALL */}
        <TouchableOpacity onPress={handleDeleteAll} style={{
          flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
          backgroundColor: confirmDelete === 'all' ? colors.error+'20' : colors.surface,
          padding: spacing.md, borderRadius: borderRadius.md,
          borderWidth: 1, borderColor: confirmDelete === 'all' ? colors.error : colors.error+'30',
        }}>
          <Ionicons name="nuclear" size={20} color={colors.error}/>
          <View style={{flex: 1}}>
            <Text style={{color: colors.error, fontWeight: '700', fontSize: 14}}>
              {confirmDelete === 'all' ? '🚨 PULSA OTRA VEZ — ESTO BORRA TODO' : '💥 Borrar TODO (nuclear)'}
            </Text>
            <Text style={{color: colors.textMuted, fontSize: 12, marginTop: 2}}>
              Elimina TODOS los datos. La base de datos queda vacía. Los datos semilla se pueden restaurar.
            </Text>
          </View>
        </TouchableOpacity>

        {confirmDelete && (
          <TouchableOpacity onPress={() => setConfirmDelete(null)} style={{alignItems: 'center', marginTop: spacing.sm}}>
            <Text style={{color: colors.textMuted, fontSize: 13}}>Cancelar</Text>
          </TouchableOpacity>
        )}
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
