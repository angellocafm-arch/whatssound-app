/**
 * WhatsSound — Panel DJ
 * Dashboard del DJ con ranking de votos reales
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Ensure Ionicons font is loaded on web
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `@font-face { font-family: "Ionicons"; src: url("/Ionicons.ttf") format("truetype"); }`;
  if (!document.querySelector('style[data-ionicons-dj]')) {
    style.setAttribute('data-ionicons-dj', '1');
    document.head.appendChild(style);
  }
}
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const SUPABASE_URL = 'https://xyehncvvvprrqwnsefcr.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTA4OTgsImV4cCI6MjA4NTIyNjg5OH0.VEaTmqpMA7XdUa-tZ7mXib1ciweD7y5UU4dFGZq3EtQ';

function getHeaders() {
  let token = '';
  try { token = JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').access_token || ''; } catch {}
  return {
    'apikey': API_KEY,
    'Authorization': `Bearer ${token || API_KEY}`,
    'Content-Type': 'application/json',
  };
}

interface QueueItem {
  id: string;
  song_name: string;
  artist: string;
  votes: number;
  status: string;
  created_at: string;
}

interface SongMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface ParsedSong {
  title: string;
  artist: string;
  album: string;
  albumArt?: string;
  duration?: string;
  votes: number;
  queueId?: string;
  messageId: string;
}

export default function DJPanelScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [songs, setSongs] = useState<ParsedSong[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState({ listeners: 0, totalVotes: 0, duration: '' });

  // Get session ID from URL params
  const getSessionId = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('id') || params.get('sid') || '';
    } catch {}
    return '';
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const h = getHeaders();
    let userId = '';
    try { userId = JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').user?.id || ''; } catch {}

    // Get session ID from URL params first, then fallback to DJ's active session
    let sid = getSessionId();
    if (sid) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${sid}&limit=1`, { headers: h });
        const sessions = await r.json();
        if (sessions.length > 0) setSession(sessions[0]);
      } catch {}
    } else {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/sessions?dj_id=eq.${userId}&status=eq.live&order=started_at.desc&limit=1`, { headers: h });
        const sessions = await r.json();
        if (sessions.length > 0) { sid = sessions[0].id; setSession(sessions[0]); }
      } catch {}
    }

    if (!sid) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/sessions?status=eq.live&order=started_at.desc&limit=1`, { headers: h });
        const sessions = await r.json();
        if (sessions.length > 0) { sid = sessions[0].id; setSession(sessions[0]); }
      } catch {}
    }

    if (!sid) { setLoading(false); return; }

    // Fetch queue items (ranked by votes)
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/queue?session_id=eq.${sid}&order=votes.desc`, { headers: h });
      const items = await r.json();
      if (Array.isArray(items)) setQueueItems(items);
    } catch {}

    // Fetch song messages for album art info
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/messages?session_id=eq.${sid}&is_system=eq.true&order=created_at.asc`, { headers: h });
      const msgs = await r.json();
      if (Array.isArray(msgs)) {
        const parsed: ParsedSong[] = [];
        for (const msg of msgs) {
          try {
            const data = JSON.parse(msg.content);
            if (data.type === 'song') {
              // Match with queue item
              const qi = queueItems.find(q => q.song_name === data.title && q.artist === data.artist);
              parsed.push({
                title: data.title,
                artist: data.artist,
                album: data.album,
                albumArt: data.albumArt,
                duration: data.duration,
                votes: qi?.votes || 0,
                queueId: data.queueId || qi?.id,
                messageId: msg.id,
              });
            }
          } catch {}
        }
        // Update votes from queue
        for (const s of parsed) {
          const qi = queueItems.find(q => q.id === s.queueId || (q.song_name === s.title && q.artist === s.artist));
          if (qi) s.votes = qi.votes;
        }
        // Sort by votes (highest first)
        parsed.sort((a, b) => b.votes - a.votes);
        setSongs(parsed);
      }
    } catch {}

    // Stats
    const totalVotes = queueItems.reduce((sum, q) => sum + (q.votes || 0), 0);
    const startTime = session?.started_at ? new Date(session.started_at).getTime() : Date.now();
    const mins = Math.round((Date.now() - startTime) / 60000);
    setStats({
      listeners: session?.listener_count || 0,
      totalVotes,
      duration: mins > 0 ? `${mins}m` : '<1m',
    });

    setLoading(false);
  };

  // Re-fetch with queue loaded
  useEffect(() => {
    if (queueItems.length > 0 && songs.length === 0) {
      loadDashboard();
    }
  }, [queueItems]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Cargando panel DJ...</Text>
        </View>
      </View>
    );
  }

  const totalVotes = songs.reduce((sum, s) => sum + s.votes, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel DJ</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>EN VIVO</Text>
        </View>
      </View>

      {/* Session info */}
      {session && (
        <Text style={styles.sessionName}>{session.name} · {session.genre}</Text>
      )}

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={18} color={colors.primary} />
          <Text style={styles.statValue}>{stats.listeners}</Text>
          <Text style={styles.statLabel}>oyentes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="flame" size={18} color="#ff6b00" />
          <Text style={styles.statValue}>{totalVotes}</Text>
          <Text style={styles.statLabel}>votos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="musical-notes" size={18} color={colors.accent} />
          <Text style={styles.statValue}>{songs.length}</Text>
          <Text style={styles.statLabel}>canciones</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="time" size={18} color={colors.warning} />
          <Text style={styles.statValue}>{stats.duration}</Text>
          <Text style={styles.statLabel}>activo</Text>
        </View>
      </View>

      {/* Ranking header */}
      <View style={styles.rankingHeader}>
        <Text style={styles.sectionTitle}>🏆 RANKING DE CANCIONES</Text>
        <TouchableOpacity onPress={loadDashboard}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Song ranking */}
      {songs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Sin canciones aún</Text>
          <Text style={styles.emptySubtitle}>Las canciones que añadas aparecerán aquí con sus votos</Text>
        </View>
      ) : (
        songs.map((song, i) => (
          <View key={song.messageId} style={[styles.rankCard, i === 0 && styles.rankCardFirst]}>
            {/* Rank number */}
            <View style={[styles.rankBadge, i === 0 && styles.rankBadgeGold, i === 1 && styles.rankBadgeSilver, i === 2 && styles.rankBadgeBronze]}>
              <Text style={[styles.rankNumber, i < 3 && styles.rankNumberTop]}>{i + 1}</Text>
            </View>

            {/* Album art */}
            {song.albumArt ? (
              <Image source={{ uri: song.albumArt }} style={styles.rankArt} />
            ) : (
              <View style={styles.rankArtPlaceholder}>
                <Ionicons name="musical-note" size={18} color={colors.primary} />
              </View>
            )}

            {/* Song info */}
            <View style={styles.rankInfo}>
              <Text style={styles.rankTitle} numberOfLines={1}>{song.title}</Text>
              <Text style={styles.rankArtist} numberOfLines={1}>{song.artist} · {song.duration}</Text>
            </View>

            {/* Votes */}
            <View style={[styles.voteDisplay, song.votes > 0 && styles.voteDisplayActive]}>
              <Text style={styles.voteEmoji}>🔥</Text>
              <Text style={[styles.voteCount, song.votes > 0 && styles.voteCountActive]}>{song.votes}</Text>
            </View>
          </View>
        ))
      )}

      {/* Quick actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => session && router.push(`/session/${session.id}`)}>
          <Ionicons name="chatbubbles" size={22} color={colors.primary} />
          <Text style={styles.actionText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => session && router.push(`/session/request-song?sid=${session.id}`)}>
          <Ionicons name="add-circle" size={22} color={colors.primary} />
          <Text style={styles.actionText}>Añadir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="qr-code" size={22} color={colors.primary} />
          <Text style={styles.actionText}>QR</Text>
        </TouchableOpacity>
      </View>

      {/* End session */}
      <TouchableOpacity style={styles.endBtn}>
        <Ionicons name="stop-circle" size={20} color="#ff4444" />
        <Text style={styles.endText}>Finalizar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, marginBottom: spacing.xs,
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,59,48,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff3b30' },
  liveText: { ...typography.captionBold, color: '#ff3b30', fontSize: 11, letterSpacing: 0.5 },
  sessionName: { ...typography.body, color: colors.primary, marginBottom: spacing.md, fontSize: 15 },

  // Stats bar
  statsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#1a2632', borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 18 },
  statLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },

  // Ranking
  rankingHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  rankCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#1a2632', borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  rankCardFirst: {
    borderColor: 'rgba(255, 215, 0, 0.3)',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  rankBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  rankBadgeGold: { backgroundColor: 'rgba(255, 215, 0, 0.2)' },
  rankBadgeSilver: { backgroundColor: 'rgba(192, 192, 192, 0.2)' },
  rankBadgeBronze: { backgroundColor: 'rgba(205, 127, 50, 0.2)' },
  rankNumber: { ...typography.captionBold, color: colors.textMuted, fontSize: 13 },
  rankNumberTop: { color: colors.textPrimary },
  rankArt: { width: 44, height: 44, borderRadius: borderRadius.sm },
  rankArtPlaceholder: {
    width: 44, height: 44, borderRadius: borderRadius.sm, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  rankInfo: { flex: 1 },
  rankTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 14 },
  rankArtist: { ...typography.caption, color: colors.textSecondary, fontSize: 12 },
  voteDisplay: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  voteDisplayActive: { backgroundColor: 'rgba(255,107,0,0.15)' },
  voteEmoji: { fontSize: 16 },
  voteCount: { ...typography.bodyBold, color: colors.textMuted, fontSize: 16 },
  voteCountActive: { color: '#ff6b00' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md },
  actionBtn: {
    flex: 1, alignItems: 'center', gap: spacing.xs, padding: spacing.md,
    backgroundColor: '#1a2632', borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border,
  },
  actionText: { ...typography.caption, color: colors.textSecondary, fontSize: 12 },

  // End
  endBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: 'rgba(255,68,68,0.3)',
    marginTop: spacing.sm,
  },
  endText: { ...typography.bodyBold, color: '#ff4444', fontSize: 14 },

  // States
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['5xl'], gap: spacing.sm },
  stateText: { ...typography.bodySmall, color: colors.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: spacing['3xl'], gap: spacing.sm },
  emptyTitle: { ...typography.h3, color: colors.textSecondary },
  emptySubtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
