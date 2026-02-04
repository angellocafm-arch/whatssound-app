/**
 * WhatsSound — DJ Dashboard Pro
 * Analytics completo para tier Pro (€7,99/mes)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useSubscription } from '../../src/hooks';

const { width } = Dimensions.get('window');

// Mock data avanzado
const MONTHLY_DATA = [
  { week: 'Sem 1', listeners: 245, sessions: 3, decibels: 420 },
  { week: 'Sem 2', listeners: 312, sessions: 4, decibels: 580 },
  { week: 'Sem 3', listeners: 428, sessions: 5, decibels: 720 },
  { week: 'Sem 4', listeners: 567, sessions: 6, decibels: 890 },
];

const AUDIENCE_INSIGHTS = [
  { metric: 'Hora pico', value: '22:00 - 00:00', icon: 'time' },
  { metric: 'Día más activo', value: 'Sábado', icon: 'calendar' },
  { metric: 'Sesión promedio', value: '1h 45m', icon: 'timer' },
  { metric: 'Retención', value: '78%', icon: 'trending-up' },
];

const RETENTION_DATA = [
  { minute: '0', percent: 100 },
  { minute: '15', percent: 92 },
  { minute: '30', percent: 85 },
  { minute: '45', percent: 78 },
  { minute: '60', percent: 72 },
  { minute: '75', percent: 65 },
  { minute: '90', percent: 58 },
];

const TOP_SUPPORTERS = [
  { name: 'María G.', decibels: 340, sessions: 12 },
  { name: 'Pablo R.', decibels: 280, sessions: 10 },
  { name: 'Ana L.', decibels: 220, sessions: 8 },
  { name: 'Carlos M.', decibels: 180, sessions: 15 },
  { name: 'Lucía F.', decibels: 150, sessions: 7 },
];

export default function DJDashboardPro() {
  const router = useRouter();
  const { tier, features } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'audience' | 'content'>('overview');

  // Verificar acceso
  const hasAccess = ['pro', 'business', 'enterprise'].includes(tier);

  if (!hasAccess) {
    return (
      <View style={styles.container}>
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedEmoji}>🔒</Text>
          <Text style={styles.lockedTitle}>Dashboard Pro</Text>
          <Text style={styles.lockedDesc}>
            Oyentes ilimitados, analytics completo, exportar datos y perfil profesional
          </Text>
          <TouchableOpacity
            style={styles.unlockBtn}
            onPress={() => router.push('/subscription')}
          >
            <Text style={styles.unlockBtnText}>Desbloquear por €7,99/mes</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const TabButton = ({ tab, label }: { tab: typeof activeTab; label: string }) => (
    <TouchableOpacity
      style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Dashboard Pro</Text>
          <View style={[styles.tierBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.tierText, { color: colors.primary }]}>🎧 Pro</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.exportBtn}>
          <Ionicons name="download-outline" size={20} color={colors.primary} />
          <Text style={styles.exportBtnText}>Exportar</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TabButton tab="overview" label="General" />
        <TabButton tab="audience" label="Audiencia" />
        <TabButton tab="content" label="Contenido" />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {activeTab === 'overview' && (
          <>
            {/* KPIs principales */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>1,552</Text>
                <Text style={styles.kpiLabel}>Oyentes (mes)</Text>
                <Text style={styles.kpiTrend}>+34% vs mes anterior</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>18</Text>
                <Text style={styles.kpiLabel}>Sesiones</Text>
                <Text style={styles.kpiTrend}>+6 vs mes anterior</Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>2.6K</Text>
                <Text style={styles.kpiLabel}>dB recibidos</Text>
                <Text style={styles.kpiTrend}>+890 esta semana</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>4.9</Text>
                <Text style={styles.kpiLabel}>Rating ⭐</Text>
                <Text style={styles.kpiTrend}>Top 5% DJs</Text>
              </View>
            </View>

            {/* Gráfico mensual */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📈 Tendencia mensual</Text>
              <View style={styles.chartCard}>
                <View style={styles.lineChart}>
                  {MONTHLY_DATA.map((d, i) => (
                    <View key={i} style={styles.linePoint}>
                      <View
                        style={[
                          styles.pointDot,
                          { bottom: `${(d.listeners / 600) * 80}%` },
                        ]}
                      />
                      <Text style={styles.lineLabel}>{d.week}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                    <Text style={styles.legendText}>Oyentes</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Top supporters */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>❤️ Top supporters</Text>
              <View style={styles.supportersCard}>
                {TOP_SUPPORTERS.map((s, idx) => (
                  <View key={idx} style={styles.supporterRow}>
                    <Text style={styles.supporterRank}>#{idx + 1}</Text>
                    <Text style={styles.supporterName}>{s.name}</Text>
                    <View style={styles.supporterStats}>
                      <Text style={styles.supporterDB}>{s.decibels} dB</Text>
                      <Text style={styles.supporterSessions}>{s.sessions} sesiones</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {activeTab === 'audience' && (
          <>
            {/* Insights de audiencia */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎯 Insights de audiencia</Text>
              <View style={styles.insightsGrid}>
                {AUDIENCE_INSIGHTS.map((insight, idx) => (
                  <View key={idx} style={styles.insightCard}>
                    <Ionicons name={insight.icon as any} size={24} color={colors.primary} />
                    <Text style={styles.insightValue}>{insight.value}</Text>
                    <Text style={styles.insightLabel}>{insight.metric}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Retención */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Retención por minuto</Text>
              <View style={styles.chartCard}>
                <View style={styles.retentionChart}>
                  {RETENTION_DATA.map((d, i) => (
                    <View key={i} style={styles.retentionBar}>
                      <View style={styles.retentionBarWrapper}>
                        <View
                          style={[
                            styles.retentionFill,
                            { height: `${d.percent}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.retentionLabel}>{d.minute}m</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.chartNote}>
                  💡 El 72% de tu audiencia se queda más de 1 hora
                </Text>
              </View>
            </View>

            {/* Perfil profesional */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 Perfil profesional</Text>
              <TouchableOpacity style={styles.profileCard}>
                <View style={styles.profilePreview}>
                  <Text style={styles.profileEmoji}>🎧</Text>
                  <View>
                    <Text style={styles.profileName}>Tu perfil Pro</Text>
                    <Text style={styles.profileDesc}>Visible en Descubrir con prioridad</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.editProfileBtn}>
                  <Text style={styles.editProfileText}>Editar</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === 'content' && (
          <>
            {/* Performance de canciones */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎵 Performance de canciones</Text>
              <View style={styles.contentCard}>
                <View style={styles.contentRow}>
                  <Text style={styles.contentLabel}>Canciones reproducidas</Text>
                  <Text style={styles.contentValue}>847</Text>
                </View>
                <View style={styles.contentRow}>
                  <Text style={styles.contentLabel}>Canciones pedidas</Text>
                  <Text style={styles.contentValue}>234</Text>
                </View>
                <View style={styles.contentRow}>
                  <Text style={styles.contentLabel}>% peticiones aceptadas</Text>
                  <Text style={styles.contentValue}>78%</Text>
                </View>
                <View style={styles.contentRow}>
                  <Text style={styles.contentLabel}>Género más popular</Text>
                  <Text style={styles.contentValue}>Reggaetón</Text>
                </View>
              </View>
            </View>

            {/* Co-DJs (feature Pro) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👥 Co-DJs</Text>
              <TouchableOpacity style={styles.coDJCard}>
                <Ionicons name="people" size={32} color={colors.primary} />
                <View style={styles.coDJContent}>
                  <Text style={styles.coDJTitle}>Invitar Co-DJ</Text>
                  <Text style={styles.coDJDesc}>
                    Comparte el control de la sesión con otro DJ
                  </Text>
                </View>
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Upgrade a Business */}
        {tier === 'pro' && (
          <TouchableOpacity
            style={styles.ctaCard}
            onPress={() => router.push('/subscription')}
          >
            <Text style={styles.ctaEmoji}>🏢</Text>
            <View style={styles.ctaContent}>
              <Text style={styles.ctaTitle}>Pasa a Business</Text>
              <Text style={styles.ctaDesc}>
                Multi-sesión, IA asistente, branding personalizado
              </Text>
            </View>
            <Text style={styles.ctaPrice}>€29,99/mes</Text>
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
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: 2,
  },
  tierText: {
    ...typography.caption,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  exportBtnText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabBtnActive: {
    backgroundColor: colors.primary + '20',
  },
  tabBtnText: {
    ...typography.body,
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  kpiValue: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 28,
  },
  kpiLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  kpiTrend: {
    ...typography.captionBold,
    color: '#10B981',
    marginTop: 4,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  lineChart: {
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  linePoint: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    position: 'relative',
  },
  pointDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  lineLabel: {
    ...typography.caption,
    color: colors.textMuted,
    position: 'absolute',
    bottom: -20,
    fontSize: 10,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  supportersCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  supporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  supporterRank: {
    ...typography.bodyBold,
    color: colors.primary,
    width: 30,
  },
  supporterName: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  supporterStats: {
    alignItems: 'flex-end',
  },
  supporterDB: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  supporterSessions: {
    ...typography.caption,
    color: colors.textMuted,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  insightCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  insightValue: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  insightLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  retentionChart: {
    height: 120,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  retentionBar: {
    flex: 1,
    alignItems: 'center',
  },
  retentionBarWrapper: {
    flex: 1,
    width: 16,
    backgroundColor: colors.border,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  retentionFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  retentionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 10,
  },
  chartNote: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    backgroundColor: colors.primary + '10',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  profilePreview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileEmoji: {
    fontSize: 40,
  },
  profileName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  profileDesc: {
    ...typography.caption,
    color: colors.textMuted,
  },
  editProfileBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  editProfileText: {
    ...typography.buttonText,
    color: '#fff',
  },
  contentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contentLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  contentValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  coDJCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  coDJContent: {
    flex: 1,
  },
  coDJTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  coDJDesc: {
    ...typography.caption,
    color: colors.textMuted,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF620',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#8B5CF640',
    marginTop: spacing.lg,
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
    color: '#8B5CF6',
  },
  ctaDesc: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ctaPrice: {
    ...typography.h3,
    color: '#8B5CF6',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  lockedEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  lockedTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  lockedDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  unlockBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  unlockBtnText: {
    ...typography.buttonText,
    color: '#fff',
  },
  backLink: {
    ...typography.body,
    color: colors.textMuted,
  },
});
