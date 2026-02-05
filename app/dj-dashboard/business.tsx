/**
 * WhatsSound — DJ Dashboard Business
 * IA asistente + multi-admin para tier Business (€29,99/mes)
 * Refactored: 2026-02-05
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useSubscription } from '../../src/hooks';
import {
  AISuggestions,
  AIChat,
  TeamMembers,
  RolesInfo,
  MultiSessions,
  type AISuggestion,
  type ChatMessage,
  type TeamMember,
  type MultiSession,
} from '../../src/components/dashboard';

// Mock data
const AI_SUGGESTIONS: AISuggestion[] = [
  {
    type: 'insight',
    icon: '💡',
    title: 'Mejor hora para tu próxima sesión',
    content: 'Según tus datos, el sábado entre 22:00-23:00 tiene un 34% más de engagement.',
  },
  {
    type: 'tip',
    icon: '🎯',
    title: 'Género trending',
    content: 'El reggaetón clásico está teniendo un resurgimiento. Considera tracks de 2004-2008.',
  },
  {
    type: 'alert',
    icon: '📈',
    title: 'Crecimiento detectado',
    content: 'Has ganado 45 nuevos seguidores esta semana, un 23% más que la anterior.',
  },
];

const TEAM_MEMBERS: TeamMember[] = [
  { name: 'Carlos (tú)', role: 'Owner', avatar: '👤', status: 'online' },
  { name: 'María López', role: 'Admin', avatar: '👩', status: 'online' },
  { name: 'Pablo García', role: 'Moderador', avatar: '👨', status: 'offline' },
];

const MULTI_SESSIONS: MultiSession[] = [
  { name: 'Sala Principal', status: 'live', listeners: 145, dj: 'Carlos' },
  { name: 'Chill Zone', status: 'scheduled', listeners: 0, dj: 'María', time: '23:00' },
];

type Section = 'ai' | 'team' | 'sessions' | 'branding';

export default function DJDashboardBusiness() {
  const router = useRouter();
  const { tier } = useSubscription();
  const [aiQuery, setAiQuery] = useState('');
  const [aiChat, setAiChat] = useState<ChatMessage[]>([]);
  const [activeSection, setActiveSection] = useState<Section>('ai');

  const hasAccess = ['business', 'enterprise'].includes(tier);

  const handleAiQuery = () => {
    if (!aiQuery.trim()) return;
    setAiChat(prev => [
      ...prev,
      { role: 'user', text: aiQuery },
      { role: 'ai', text: `Analizando "${aiQuery}"... Te recomendaría sesiones más largas (2+ horas).` },
    ]);
    setAiQuery('');
  };

  if (!hasAccess) {
    return (
      <View style={styles.container}>
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedEmoji}>🔒</Text>
          <Text style={styles.lockedTitle}>Dashboard Business</Text>
          <Text style={styles.lockedDesc}>
            IA asistente, multi-sesión, equipo multi-admin y branding personalizado
          </Text>
          <TouchableOpacity style={styles.unlockBtn} onPress={() => router.push('/subscription')}>
            <Text style={styles.unlockBtnText}>Desbloquear por €29,99/mes</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Dashboard Business</Text>
          <View style={[styles.tierBadge, { backgroundColor: '#8B5CF620' }]}>
            <Text style={[styles.tierText, { color: '#8B5CF6' }]}>🏢 Business</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Section selector */}
      <View style={styles.sectionsRow}>
        {(['ai', 'team', 'sessions', 'branding'] as const).map(section => (
          <TouchableOpacity
            key={section}
            style={[styles.sectionBtn, activeSection === section && styles.sectionBtnActive]}
            onPress={() => setActiveSection(section)}
          >
            <Ionicons
              name={section === 'ai' ? 'sparkles' : section === 'team' ? 'people' : section === 'sessions' ? 'radio' : 'color-palette'}
              size={20}
              color={activeSection === section ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.sectionBtnText, activeSection === section && styles.sectionBtnTextActive]}>
              {section === 'ai' ? 'IA' : section === 'team' ? 'Equipo' : section === 'sessions' ? 'Salas' : 'Marca'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {activeSection === 'ai' && (
          <>
            <AISuggestions suggestions={AI_SUGGESTIONS} />
            <AIChat
              messages={aiChat}
              query={aiQuery}
              onQueryChange={setAiQuery}
              onSend={handleAiQuery}
            />
          </>
        )}

        {activeSection === 'team' && (
          <>
            <TeamMembers members={TEAM_MEMBERS} onInvite={() => {}} />
            <RolesInfo />
          </>
        )}

        {activeSection === 'sessions' && (
          <MultiSessions sessions={MULTI_SESSIONS} onAddSession={() => {}} />
        )}

        {activeSection === 'branding' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 Personalización de marca</Text>
            <View style={styles.brandingCard}>
              <Text style={styles.brandingText}>
                Configura colores, logo y elementos visuales de tu marca.
              </Text>
              <TouchableOpacity style={styles.brandingBtn}>
                <Text style={styles.brandingBtnText}>Configurar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backBtn: {
    padding: spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  tierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  tierText: {
    ...typography.caption,
    fontWeight: '600',
  },
  settingsBtn: {
    padding: spacing.sm,
  },
  sectionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardBg,
  },
  sectionBtnActive: {
    backgroundColor: colors.primary + '20',
  },
  sectionBtnText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sectionBtnTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
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
    ...typography.h2,
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
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  unlockBtnText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '600',
  },
  backLink: {
    ...typography.body,
    color: colors.primary,
  },
  brandingCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  brandingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  brandingBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  brandingBtnText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '600',
  },
});
