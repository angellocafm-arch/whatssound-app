/**
 * WhatsSound — Búsqueda Global
 * Search profiles and sessions from Supabase
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';
import { Avatar } from '../src/components/ui/Avatar';

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
  return { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token || ANON_KEY}`, 'Content-Type': 'application/json' };
}

interface ProfileResult { id: string; username: string; display_name: string; avatar_url?: string; }
interface SessionResult { id: string; name: string; dj_name?: string; status?: string; }

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const debounceRef = React.useRef<any>(null);

  const doSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setProfiles([]);
      setSessions([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    const h = getHeaders();
    const encoded = encodeURIComponent(`%${q}%`);

    Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/profiles?or=(username.ilike.${encoded},display_name.ilike.${encoded})&select=id,username,display_name,avatar_url&limit=10`, { headers: h }).then(r => r.json()).catch(() => []),
      fetch(`${SUPABASE_URL}/rest/v1/sessions?name=ilike.${encoded}&select=id,name,dj_name,status&limit=10`, { headers: h }).then(r => r.json()).catch(() => []),
    ])
      .then(([p, s]) => {
        setProfiles(Array.isArray(p) ? p : []);
        setSessions(Array.isArray(s) ? s : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 400);
  };

  const hasQuery = query.trim().length > 0;
  const noResults = searched && !loading && profiles.length === 0 && sessions.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar personas, sesiones..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={handleChange}
            autoFocus
          />
          {hasQuery && (
            <TouchableOpacity onPress={() => { setQuery(''); setProfiles([]); setSessions([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!hasQuery && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Busca personas o sesiones</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {noResults && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Sin resultados para "{query}"</Text>
          </View>
        )}

        {profiles.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>PERSONAS</Text>
            {profiles.map(p => (
              <TouchableOpacity key={p.id} style={styles.resultItem} onPress={() => router.push(`/profile/${p.id}`)}>
                <Avatar name={p.display_name || p.username} size="md" />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{p.display_name || p.username}</Text>
                  <Text style={styles.resultSub}>@{p.username}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {sessions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>SESIONES</Text>
            {sessions.map(s => (
              <TouchableOpacity key={s.id} style={styles.resultItem} onPress={() => router.push(`/session/${s.id}`)}>
                <View style={styles.sessionIcon}>
                  <Ionicons name="headset" size={20} color={s.status === 'active' ? colors.primary : colors.textMuted} />
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{s.name}</Text>
                  <Text style={styles.resultSub}>{s.dj_name || 'DJ'}{s.status === 'active' ? ' · En vivo' : ''}</Text>
                </View>
                {s.status === 'active' && <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE</Text></View>}
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, height: 40,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary },
  content: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
  sectionTitle: { ...typography.captionBold, color: colors.textMuted, letterSpacing: 0.5, marginTop: spacing.lg, marginBottom: spacing.sm },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.divider,
  },
  resultInfo: { flex: 1, gap: 2 },
  resultName: { ...typography.bodyBold, color: colors.textPrimary },
  resultSub: { ...typography.caption, color: colors.textMuted },
  sessionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  liveBadge: { backgroundColor: colors.error, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  liveText: { ...typography.captionBold, color: '#fff', fontSize: 10 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textMuted },
  loadingWrap: { paddingTop: spacing.xl, alignItems: 'center' },
});
