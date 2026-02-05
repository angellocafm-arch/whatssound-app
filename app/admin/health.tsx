/**
 * WhatsSound — Admin Health Check Panel
 * Runs diagnostic checks on all integrations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';

type CheckStatus = 'pending' | 'running' | 'ok' | 'error';
interface Check {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: CheckStatus;
  detail: string;
  ms?: number;
}

const TABLES = ['ws_profiles', 'ws_sessions', 'ws_songs', 'ws_messages', 'ws_votes', 'ws_tips', 'ws_session_members', 'ws_conversations', 'ws_private_messages', 'ws_contacts', 'ws_invites', 'ws_admin_settings'];

export default function HealthScreen() {
  const [checks, setChecks] = useState<Check[]>([
    { name: 'Conexión Supabase', icon: 'server', status: 'pending', detail: '' },
    { name: 'Integridad de tablas', icon: 'grid', status: 'pending', detail: '' },
    { name: 'Datos semilla', icon: 'leaf', status: 'pending', detail: '' },
    { name: 'API Deezer', icon: 'musical-notes', status: 'pending', detail: '' },
    { name: 'Supabase Realtime', icon: 'flash', status: 'pending', detail: '' },
    { name: 'Audio Preview', icon: 'volume-high', status: 'pending', detail: '' },
  ]);
  const [running, setRunning] = useState(false);

  const updateCheck = useCallback((idx: number, update: Partial<Check>) => {
    setChecks(prev => prev.map((c, i) => i === idx ? { ...c, ...update } : c));
  }, []);

  const runAllChecks = useCallback(async () => {
    setRunning(true);
    setChecks(prev => prev.map(c => ({ ...c, status: 'running' as const, detail: '', ms: undefined })));

    // 1. Supabase connection
    let t = Date.now();
    try {
      const { data, error } = await supabase.from('ws_profiles').select('id').limit(1);
      if (error) throw error;
      updateCheck(0, { status: 'ok', detail: `Conectado (${Date.now() - t}ms)`, ms: Date.now() - t });
    } catch (e: unknown) {
      updateCheck(0, { status: 'error', detail: e.message || 'Sin conexión', ms: Date.now() - t });
    }

    // 2. Table integrity
    t = Date.now();
    try {
      const results: string[] = [];
      let allOk = true;
      for (const table of TABLES) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) { results.push(`❌ ${table}`); allOk = false; }
        else results.push(`${table}: ${count}`);
      }
      updateCheck(1, { 
        status: allOk ? 'ok' : 'error', 
        detail: results.join(' · '),
        ms: Date.now() - t 
      });
    } catch (e: unknown) {
      updateCheck(1, { status: 'error', detail: e.message, ms: Date.now() - t });
    }

    // 3. Seed data
    t = Date.now();
    try {
      const { count } = await supabase.from('ws_profiles').select('*', { count: 'exact', head: true }).eq('is_seed', true);
      const ok = (count || 0) >= 10;
      updateCheck(2, { 
        status: ok ? 'ok' : 'error', 
        detail: `${count || 0} perfiles semilla${ok ? '' : ' (esperados ≥10)'}`,
        ms: Date.now() - t 
      });
    } catch (e: unknown) {
      updateCheck(2, { status: 'error', detail: e.message, ms: Date.now() - t });
    }

    // 4. Deezer API
    t = Date.now();
    try {
      const res = await fetch('/api/deezer?q=bad+bunny&type=track');
      const data = await res.json();
      if (data?.data?.length > 0) {
        updateCheck(3, { status: 'ok', detail: `${data.data.length} resultados, preview: ${data.data[0].preview ? '✅' : '❌'}`, ms: Date.now() - t });
      } else {
        updateCheck(3, { status: 'error', detail: 'Sin resultados', ms: Date.now() - t });
      }
    } catch (e: unknown) {
      updateCheck(3, { status: 'error', detail: e.message, ms: Date.now() - t });
    }

    // 5. Realtime
    t = Date.now();
    try {
      const channel = supabase.channel('health-check');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => { channel.unsubscribe(); reject(new Error('Timeout 5s')); }, 5000);
        channel.on('system', { event: '*' } as any, () => {}).subscribe((status: string) => {
          clearTimeout(timeout);
          channel.unsubscribe();
          if (status === 'SUBSCRIBED') resolve();
          else reject(new Error(`Status: ${status}`));
        });
      });
      updateCheck(4, { status: 'ok', detail: `Realtime conectado (${Date.now() - t}ms)`, ms: Date.now() - t });
    } catch (e: unknown) {
      updateCheck(4, { status: 'error', detail: e.message, ms: Date.now() - t });
    }

    // 6. Audio preview
    t = Date.now();
    try {
      const res = await fetch('/api/deezer?q=pepas+farruko&type=track');
      const data = await res.json();
      const previewUrl = data?.data?.[0]?.preview;
      if (previewUrl) {
        const audioRes = await fetch(previewUrl, { method: 'HEAD' });
        updateCheck(5, { 
          status: audioRes.ok ? 'ok' : 'error', 
          detail: audioRes.ok ? `Preview accesible (${audioRes.headers.get('content-type')})` : `HTTP ${audioRes.status}`,
          ms: Date.now() - t 
        });
      } else {
        updateCheck(5, { status: 'error', detail: 'No se encontró preview URL', ms: Date.now() - t });
      }
    } catch (e: unknown) {
      updateCheck(5, { status: 'error', detail: e.message, ms: Date.now() - t });
    }

    setRunning(false);
  }, [updateCheck]);

  useEffect(() => { runAllChecks(); }, []);

  const copyReport = () => {
    const report = checks.map(c => `${c.status === 'ok' ? '✅' : '❌'} ${c.name}: ${c.detail}`).join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`WhatsSound Health Report\n${new Date().toLocaleString('es-ES')}\n\n${report}`);
    }
  };

  const okCount = checks.filter(c => c.status === 'ok').length;
  const errorCount = checks.filter(c => c.status === 'error').length;

  return (
    <ScrollView style={st.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={st.title}>🏥 Estado del Sistema</Text>
      <Text style={st.subtitle}>
        {running ? 'Verificando...' : `${okCount}/${checks.length} OK${errorCount > 0 ? ` · ${errorCount} errores` : ''}`}
      </Text>

      {checks.map((check, i) => (
        <View key={i} style={[st.card, check.status === 'error' && { borderColor: colors.error + '60' }]}>
          <View style={st.cardHeader}>
            <Ionicons name={check.icon} size={20} color={
              check.status === 'ok' ? colors.primary : 
              check.status === 'error' ? colors.error : 
              colors.textMuted
            } />
            <Text style={st.cardTitle}>{check.name}</Text>
            {check.status === 'running' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : check.status === 'ok' ? (
              <Text style={{ color: colors.primary, fontWeight: '700' }}>🟢 OK</Text>
            ) : check.status === 'error' ? (
              <Text style={{ color: colors.error, fontWeight: '700' }}>🔴 Error</Text>
            ) : (
              <Text style={{ color: colors.textMuted }}>⏳</Text>
            )}
          </View>
          {check.detail ? (
            <Text style={st.cardDetail} numberOfLines={3}>{check.detail}</Text>
          ) : null}
          {check.ms !== undefined && (
            <Text style={st.cardMs}>{check.ms}ms</Text>
          )}
        </View>
      ))}

      <View style={st.btnRow}>
        <TouchableOpacity style={st.btn} onPress={runAllChecks} disabled={running}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={st.btnText}>Re-verificar todo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.btn, { backgroundColor: colors.surfaceLight }]} onPress={copyReport}>
          <Ionicons name="clipboard" size={18} color={colors.textPrimary} />
          <Text style={st.btnText}>Copiar reporte</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { flex: 1, color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
  cardDetail: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs, lineHeight: 18 },
  cardMs: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.primary, padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
