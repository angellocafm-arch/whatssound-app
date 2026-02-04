/**
 * WhatsSound — DJ Dashboard (Gratis)
 * Métricas básicas para todos los DJs
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useSubscription, TIER_NAMES, TIER_ICONS } from '../../src/hooks';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/authStore';

interface BasicStats {
  totalListeners: number;
  totalSessions: number;
  totalSongsPlayed: number;
  totalDecibelsReceived: number;
  lastSessionDate: string | null;
}

const StatCard = ({ icon, value, label, color }: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function DJDashboardFree() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { tier, features } = useSubscription();
  const [stats, setStats] = useState<BasicStats>({
    totalListeners: 0,
    totalSessions: 0,
    totalSongsPlayed: 0,
    totalDecibelsReceived: 0,
    lastSessionDate: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  const loadStats = async () => {
    if (!user?.id) return;

    try {
      // Total sessions
      const { count: sessionsCount } = await supabase
        .from('ws_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('dj_id', user.id);

      // Recent sessions (últimos 7 días para gratis)
      const historyDate = new Date();
      historyDate.setDate(historyDate.getDate() - features.historyDays);

      const { data: sessions } = await supabase
        .from('ws_sessions')
        .select('id, name, created_at, genres')
        .eq('dj_id', user.id)
        .gte('created_at', historyDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      // Decibels received
      const { data: decibels } = await supabase
        .from('ws_decibels')
        .select('amount')
        .eq('to_user_id', user.id);

      const totalDB = decibels?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

      setStats({
        totalListeners: Math.floor(Math.random() * 150) + 20, // Mock por ahora
        totalSessions: sessionsCount || 0,
        totalSongsPlayed: Math.floor(Math.random() * 200) + 50, // Mock
        totalDecibelsReceived: totalDB,
        lastSessionDate: sessions?.[0]?.created_at || null,
      });

      setRecentSessions(sessions || []);
    } catch (e) {
      console.error('Error loading DJ stats:', e);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Mi Dashboard</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{TIER_ICONS[tier]} {TIER_NAMES[tier]}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/subscription')} style={styles.upgradeBtn}>
          <Ionicons name="arrow-up-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="people"
            value={stats.totalListeners}
            label="Oyentes totales"
            color={colors.primary}
          />
          <StatCard
            icon="radio"
            value={stats.totalSessions}
            label="Sesiones"
            color="#F59E0B"
          />
          <StatCard
            icon="musical-notes"
            value={stats.totalSongsPlayed}
            label="Canciones"
            color="#8B5CF6"
          />
          <StatCard
            icon="volume-high"
            value={`${stats.totalDecibelsReceived} dB`}
            label="Recibidos"
            color="#10B981"
          />
        </View>

        {/* Límite de oyentes */}
        <View style={styles.limitCard}>
          <View style={styles.limitHeader}>
            <Text style={styles.limitTitle}>Límite de oyentes</Text>
            <Text style={styles.limitValue}>
              {features.maxListeners === 9999 ? '∞' : features.maxListeners}
            </Text>
          </View>
          <View style={styles.limitBar}>
            <View
              style={[
                styles.limitFill,
                { width: `${Math.min((stats.totalListeners / features.maxListeners) * 100, 100)}%` },
              ]}
            />
          </View>
          {tier === 'free' && (
            <TouchableOpacity
              style={styles.upgradeCard}
              onPress={() => router.push('/subscription')}
            >
              <Ionicons name="trending-up" size={20} color={colors.primary} />
              <Text style={styles.upgradeText}>
                Aumenta a 100 oyentes con Creator por solo €1,99/mes
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sesiones recientes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sesiones recientes</Text>
            <Text style={styles.sectionSubtitle}>Últimos {features.historyDays} días</Text>
          </View>

          {recentSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="radio-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aún no has creado sesiones</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => router.push('/create-session')}
              >
                <Text style={styles.createBtnText}>Crear mi primera sesión</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionRow}
                onPress={() => router.push(`/session/${session.id}`)}
              >
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{session.name}</Text>
                  <Text style={styles.sessionDate}>
                    {new Date(session.created_at).toLocaleDateString('es-ES')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Upgrade CTA para gratis */}
        {tier === 'free' && (
          <TouchableOpacity
            style={styles.ctaCard}
            onPress={() => router.push('/subscription')}
          >
            <Text style={styles.ctaEmoji}>⭐</Text>
            <View style={styles.ctaContent}>
              <Text style={styles.ctaTitle}>Pasa a Creator</Text>
              <Text style={styles.ctaDesc}>
                100 oyentes, notificaciones push, programar sesiones y más
              </Text>
            </View>
            <Text style={styles.ctaPrice}>€1,99/mes</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  tierBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: 2,
  },
  tierText: {
    ...typography.caption,
    color: colors.primary,
  },
  upgradeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 24,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  limitCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  limitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  limitTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  limitValue: {
    ...typography.h2,
    color: colors.primary,
  },
  limitBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  limitFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  upgradeText: {
    ...typography.caption,
    color: colors.primary,
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  sessionDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  createBtnText: {
    ...typography.buttonText,
    color: '#fff',
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#F59E0B40',
    marginBottom: spacing.xl,
  },
  ctaEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  ctaContent: {
    flex: 1,
  },
  ctaTitle: {
    ...typography.bodyBold,
    color: '#F59E0B',
  },
  ctaDesc: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ctaPrice: {
    ...typography.h3,
    color: '#F59E0B',
  },
});
