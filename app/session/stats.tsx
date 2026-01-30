/**
 * WhatsSound — Estadísticas Post-Sesión (DJ)
 * Fetches real aggregated data from Supabase
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';

if (Platform.OS === 'web') {
  const s = document.createElement('style');
  s.textContent = '@font-face{font-family:"Ionicons";src:url("/Ionicons.ttf") format("truetype")}';
  if (!document.querySelector('style[data-ionicons-fix]')) { s.setAttribute('data-ionicons-fix','1'); document.head.appendChild(s); }
}

const SUPABASE_URL = 'https://xyehncvvvprrqwnsefcr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTA4OTgsImV4cCI6MjA4NTIyNjg5OH0.VEaTmqpMA7XdUa-tZ7mXib1ciweD7y5UU4dFGZq3EtQ';

function getHeaders() {
  let token = '';
  try { token = JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').access_token || ''; } catch {}
  return { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token || ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'count=exact' };
}

function formatDuration(startIso: string): string {
  const ms = Date.now() - new Date(startIso).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function SessionStatsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [songsCount, setSongsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const h = getHeaders();

    Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${id}&select=id,name,dj_name,created_at`, { headers: h }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/queue?session_id=eq.${id}&select=id`, { headers: { ...h, 'Prefer': 'count=exact' } }),
      fetch(`${SUPABASE_URL}/rest/v1/messages?session_id=eq.${id}&select=id`, { headers: { ...h, 'Prefer': 'count=exact' } }),
    ])
      .then(async ([sessionData, queueRes, msgRes]) => {
        if (sessionData?.[0]) setSession(sessionData[0]);
        const queueCount = parseInt(queueRes.headers.get('content-range')?.split('/')[1] || '0', 10);
        const msgCount = parseInt(msgRes.headers.get('content-range')?.split('/')[1] || '0', 10);
        setSongsCount(queueCount);
        setMessagesCount(msgCount);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const sessionName = session?.name || 'Sesión';
  const duration = session?.created_at ? formatDuration(session.created_at) : '--';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Resumen de sesión</Text>
      <Text style={styles.subtitle}>{sessionName} · {session?.dj_name || 'DJ'}</Text>

      <View style={styles.bigStats}>
        <Card style={styles.bigStat}>
          <Ionicons name="musical-notes" size={28} color={colors.primary} />
          <Text style={styles.bigNum}>{songsCount}</Text>
          <Text style={styles.bigLabel}>Canciones</Text>
        </Card>
        <Card style={styles.bigStat}>
          <Ionicons name="time" size={28} color={colors.accent} />
          <Text style={styles.bigNum}>{duration}</Text>
          <Text style={styles.bigLabel}>Duración</Text>
        </Card>
      </View>

      <Card style={styles.detailCard}>
        <Text style={styles.sectionLabel}>ACTIVIDAD</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Canciones en cola</Text>
          <Text style={styles.detailValue}>{songsCount}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Mensajes en chat</Text>
          <Text style={styles.detailValue}>{messagesCount}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duración total</Text>
          <Text style={styles.detailValue}>{duration}</Text>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button title="Compartir resumen" onPress={() => {}} fullWidth icon={<Ionicons name="share-outline" size={20} color={colors.textOnPrimary} />} />
        <Button title="Volver al inicio" onPress={() => router.replace('/')} variant="secondary" fullWidth />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.xl },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  bigStats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  bigStat: { flex: 1, alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  bigNum: { ...typography.h1, color: colors.textPrimary, fontSize: 36 },
  bigLabel: { ...typography.caption, color: colors.textMuted },
  detailCard: { marginBottom: spacing.xl, padding: spacing.base },
  sectionLabel: { ...typography.captionBold, color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.divider },
  detailLabel: { ...typography.body, color: colors.textSecondary },
  detailValue: { ...typography.bodyBold, color: colors.textPrimary },
  actions: { gap: spacing.sm },
});
