/**
 * WhatsSound — DJRanking
 * Top DJs de la semana por propinas y oyentes
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { supabase } from '../../lib/supabase';
import { isDemoMode } from '../../lib/demo';

interface RankedDJ {
  id: string;
  display_name: string;
  avatar_url: string | null;
  dj_verified: boolean;
  total_listeners: number;
  total_tips: number;
  sessions_count: number;
  score: number;
}

// Demo data
const DEMO_DJS: RankedDJ[] = [
  { id: '1', display_name: 'DJ Carlos Madrid', avatar_url: '🎧', dj_verified: true, total_listeners: 847, total_tips: 234, sessions_count: 12, score: 1500 },
  { id: '2', display_name: 'DJ María Luna', avatar_url: '🌙', dj_verified: true, total_listeners: 623, total_tips: 189, sessions_count: 9, score: 1200 },
  { id: '3', display_name: 'DJ Pablo Beats', avatar_url: '🔥', dj_verified: false, total_listeners: 512, total_tips: 156, sessions_count: 8, score: 1000 },
  { id: '4', display_name: 'DJ Ana Ritmo', avatar_url: '💃', dj_verified: true, total_listeners: 401, total_tips: 98, sessions_count: 6, score: 750 },
  { id: '5', display_name: 'DJ Luis Flow', avatar_url: '🎵', dj_verified: false, total_listeners: 356, total_tips: 87, sessions_count: 5, score: 600 },
];

interface Props {
  limit?: number;
  showTitle?: boolean;
}

export function DJRanking({ limit = 5, showTitle = true }: Props) {
  const router = useRouter();
  const [djs, setDJs] = useState<RankedDJ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    if (isDemoMode()) {
      setDJs(DEMO_DJS.slice(0, limit));
      setLoading(false);
      return;
    }

    try {
      // Query para obtener top DJs de la última semana
      const { data, error } = await supabase.rpc('get_top_djs_weekly', { limit_count: limit });
      
      if (error) {
        console.error('[DJRanking] Error:', error);
        // Fallback a demo
        setDJs(DEMO_DJS.slice(0, limit));
      } else if (data && data.length > 0) {
        setDJs(data);
      } else {
        // Sin datos, mostrar demo
        setDJs(DEMO_DJS.slice(0, limit));
      }
    } catch (error) {
      console.error('[DJRanking] Error:', error);
      setDJs(DEMO_DJS.slice(0, limit));
    } finally {
      setLoading(false);
    }
  };

  const getMedal = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}.`;
    }
  };

  const formatNumber = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.header}>
          <Text style={styles.title}>🏆 DJs del Momento</Text>
          <TouchableOpacity onPress={() => router.push('/discover')}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.list}>
        {djs.map((dj, index) => (
          <TouchableOpacity 
            key={dj.id}
            style={styles.djRow}
            onPress={() => router.push(`/profile/dj-public?id=${dj.id}`)}
            activeOpacity={0.7}
          >
            {/* Posición */}
            <Text style={styles.position}>{getMedal(index)}</Text>
            
            {/* Avatar */}
            <View style={styles.avatar}>
              {dj.avatar_url ? (
                <Text style={styles.avatarEmoji}>{dj.avatar_url}</Text>
              ) : (
                <Ionicons name="headset" size={20} color={colors.primary} />
              )}
            </View>
            
            {/* Info */}
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{dj.display_name}</Text>
                {dj.dj_verified && (
                  <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                )}
              </View>
              <Text style={styles.stats}>
                {dj.sessions_count} sesiones esta semana
              </Text>
            </View>
            
            {/* Métricas */}
            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Ionicons name="people" size={12} color={colors.textMuted} />
                <Text style={styles.metricValue}>{formatNumber(dj.total_listeners)}</Text>
              </View>
              <View style={styles.metric}>
                <Ionicons name="cash" size={12} color={colors.warning} />
                <Text style={[styles.metricValue, { color: colors.warning }]}>
                  €{formatNumber(dj.total_tips)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 16,
  },
  seeAll: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 13,
  },
  list: {
    gap: spacing.sm,
  },
  djRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  position: {
    width: 28,
    fontSize: 16,
    textAlign: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  stats: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  metrics: {
    alignItems: 'flex-end',
    gap: 2,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    ...typography.captionBold,
    color: colors.textMuted,
    fontSize: 12,
  },
});

export default DJRanking;
