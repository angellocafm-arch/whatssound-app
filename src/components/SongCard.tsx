/**
 * SongCard — Song card displayed in chat with album art, voting, and requester info
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

const SUPABASE_API_URL = 'https://xyehncvvvprrqwnsefcr.supabase.co/rest/v1/';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTA4OTgsImV4cCI6MjA4NTIyNjg5OH0.VEaTmqpMA7XdUa-tZ7mXib1ciweD7y5UU4dFGZq3EtQ';

function getSupabaseHeaders(): Record<string, string> {
  let token = '';
  try { token = JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').access_token || ''; } catch {}
  return {
    'apikey': SUPABASE_API_KEY,
    'Authorization': `Bearer ${token || SUPABASE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function getCurrentUserId(): string {
  try { return JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').user?.id || ''; } catch { return ''; }
}

export interface SongData {
  type: string;
  title: string;
  artist: string;
  album: string;
  albumArt?: string;
  duration?: string;
  deezerId?: string;
  queueId?: string;
}

export interface SongCardMessage {
  id: string;
  user: string;
  isMine: boolean;
  time: string;
}

interface SongCardProps {
  song: SongData;
  message: SongCardMessage;
  onVote: (id: string, vote: 'up' | 'down') => void;
}

export function parseSongCard(text: string): SongData | null {
  try {
    const data = JSON.parse(text);
    if (data?.type === 'song') return data;
  } catch {}
  return null;
}

export const SongCard: React.FC<SongCardProps> = ({ song, message, onVote }) => {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const [voteCount, setVoteCount] = useState<number>(0);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (!song.queueId) return;
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_API_URL}queue?id=eq.${song.queueId}&select=votes`,
          { headers: getSupabaseHeaders() }
        );
        const data = await res.json();
        if (Array.isArray(data) && data[0]) setVoteCount(data[0].votes || 0);
      } catch {}
    })();

    const userId = getCurrentUserId();
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_API_URL}votes?queue_id=eq.${song.queueId}&user_id=eq.${userId}&select=id&limit=1`,
          { headers: getSupabaseHeaders() }
        );
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setVoted('up');
      } catch {}
    })();
  }, [song.queueId]);

  const handleVote = async (type: 'up' | 'down') => {
    if (voted || voting) return;
    setVoting(true);

    if (type === 'up' && song.queueId) {
      const userId = getCurrentUserId();
      try {
        const voteRes = await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, queue_id: song.queueId }),
        });
        const result = await voteRes.json();
        if (result.ok) {
          setVoteCount(result.votes);
        }
      } catch (e) {
        console.error('Vote error:', e);
      }
    }

    setVoted(type);
    setVoting(false);
    onVote(message.id, type);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.artWrap}>
            {song.albumArt ? (
              <Image source={{ uri: song.albumArt }} style={styles.art} />
            ) : (
              <View style={styles.artPlaceholder}>
                <Ionicons name="musical-note" size={24} color={colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
            <Text style={styles.album} numberOfLines={1}>{song.album} · {song.duration || ''}</Text>
          </View>
        </View>

        <View style={styles.voteRow}>
          <TouchableOpacity
            style={[styles.voteBtn, styles.voteFire, voted === 'up' && styles.voteActive]}
            onPress={() => handleVote('up')}
            disabled={voted !== null || voting}
          >
            <Text style={styles.voteEmoji}>🔥</Text>
            <Text style={[styles.voteLabel, voted === 'up' && styles.voteLabelActive]}>
              {voteCount > 0 ? `${voteCount} ` : ''}¡La quiero!
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.voteBtn, styles.voteSkip, voted === 'down' && styles.voteActiveSkip]}
            onPress={() => handleVote('down')}
            disabled={voted !== null || voting}
          >
            <Text style={styles.voteEmoji}>⏭️</Text>
            <Text style={[styles.voteLabel, voted === 'down' && styles.voteLabelActive]}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.requester}>
            {message.isMine ? 'Tú' : message.user} añadió esta canción
          </Text>
          <Text style={styles.time}>{message.time}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#1a2632',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.3)',
    overflow: 'hidden',
    width: '92%',
    maxWidth: 360,
  },
  header: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  artWrap: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  art: { width: 60, height: 60 },
  artPlaceholder: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  info: { flex: 1, gap: 2 },
  title: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 16 },
  artist: { ...typography.body, color: colors.primary, fontSize: 14 },
  album: { ...typography.caption, color: colors.textMuted, fontSize: 12 },
  voteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  voteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  voteFire: { backgroundColor: 'rgba(255, 107, 0, 0.1)', borderColor: 'rgba(255, 107, 0, 0.3)' },
  voteSkip: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' },
  voteActive: { backgroundColor: 'rgba(255, 107, 0, 0.3)', borderColor: '#ff6b00' },
  voteActiveSkip: { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.4)' },
  voteEmoji: { fontSize: 18 },
  voteLabel: { ...typography.captionBold, color: colors.textSecondary, fontSize: 13 },
  voteLabelActive: { color: colors.textPrimary },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  requester: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  time: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
});
