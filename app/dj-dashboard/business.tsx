/**
 * WhatsSound — DJ Dashboard Business
 * IA asistente + multi-admin para tier Business (€29,99/mes)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useSubscription } from '../../src/hooks';

// Mock AI responses
const AI_SUGGESTIONS = [
  {
    type: 'insight',
    icon: '💡',
    title: 'Mejor hora para tu próxima sesión',
    content: 'Según tus datos, el sábado entre 22:00-23:00 tiene un 34% más de engagement que otros horarios.',
  },
  {
    type: 'tip',
    icon: '🎯',
    title: 'Género trending',
    content: 'El reggaetón clásico está teniendo un resurgimiento esta semana. Considera incluir más tracks de 2004-2008.',
  },
  {
    type: 'alert',
    icon: '📈',
    title: 'Crecimiento detectado',
    content: 'Has ganado 45 nuevos seguidores esta semana, un 23% más que la anterior. ¡Sigue así!',
  },
];

const TEAM_MEMBERS = [
  { name: 'Carlos (tú)', role: 'Owner', avatar: '👤', status: 'online' },
  { name: 'María López', role: 'Admin', avatar: '👩', status: 'online' },
  { name: 'Pablo García', role: 'Moderador', avatar: '👨', status: 'offline' },
];

const MULTI_SESSIONS = [
  { name: 'Sala Principal', status: 'live', listeners: 145, dj: 'Carlos' },
  { name: 'Chill Zone', status: 'scheduled', listeners: 0, dj: 'María', time: '23:00' },
];

export default function DJDashboardBusiness() {
  const router = useRouter();
  const { tier } = useSubscription();
  const [aiQuery, setAiQuery] = useState('');
  const [aiChat, setAiChat] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const [activeSection, setActiveSection] = useState<'ai' | 'team' | 'sessions' | 'branding'>('ai');

  // Verificar acceso
  const hasAccess = ['business', 'enterprise'].includes(tier);

  if (!hasAccess) {
    return (
      <View style={styles.container}>
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedEmoji}>🔒</Text>
          <Text style={styles.lockedTitle}>Dashboard Business</Text>
          <Text style={styles.lockedDesc}>
            IA asistente, multi-sesión, equipo multi-admin y branding personalizado
          </Text>
          <TouchableOpacity
            style={styles.unlockBtn}
            onPress={() => router.push('/subscription')}
          >
            <Text style={styles.unlockBtnText}>Desbloquear por €29,99/mes</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleAiQuery = () => {
    if (!aiQuery.trim()) return;
    
    setAiChat(prev => [
      ...prev,
      { role: 'user', text: aiQuery },
      { role: 'ai', text: `Analizando tu pregunta sobre "${aiQuery}"... Basándome en tus datos de las últimas 4 semanas, te recomendaría enfocarte en sesiones más largas (2+ horas) ya que tu retención mejora significativamente después de la primera hora.` },
    ]);
    setAiQuery('');
  };

  const SectionButton = ({ section, icon, label }: { 
    section: typeof activeSection; 
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }) => (
    <TouchableOpacity
      style={[styles.sectionBtn, activeSection === section && styles.sectionBtnActive]}
      onPress={() => setActiveSection(section)}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeSection === section ? colors.primary : colors.textMuted} 
      />
      <Text style={[
        styles.sectionBtnText,
        activeSection === section && styles.sectionBtnTextActive,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
        <SectionButton section="ai" icon="sparkles" label="IA" />
        <SectionButton section="team" icon="people" label="Equipo" />
        <SectionButton section="sessions" icon="radio" label="Salas" />
        <SectionButton section="branding" icon="color-palette" label="Marca" />
      </View>

      <ScrollView style={styles.content}>
        {activeSection === 'ai' && (
          <>
            {/* AI Suggestions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🤖 Sugerencias de IA</Text>
              {AI_SUGGESTIONS.map((s, idx) => (
                <View key={idx} style={styles.aiCard}>
                  <Text style={styles.aiIcon}>{s.icon}</Text>
                  <View style={styles.aiContent}>
                    <Text style={styles.aiTitle}>{s.title}</Text>
                    <Text style={styles.aiText}>{s.content}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* AI Chat */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💬 Pregunta a la IA</Text>
              <View style={styles.chatContainer}>
                {aiChat.length === 0 ? (
                  <View style={styles.chatEmpty}>
                    <Text style={styles.chatEmptyText}>
                      Pregúntame sobre tus métricas, estrategias o recomendaciones
                    </Text>
                  </View>
                ) : (
                  aiChat.map((msg, idx) => (
                    <View 
                      key={idx} 
                      style={[
                        styles.chatBubble,
                        msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAI,
                      ]}
                    >
                      <Text style={[
                        styles.chatText,
                        msg.role === 'user' && styles.chatTextUser,
                      ]}>
                        {msg.text}
                      </Text>
                    </View>
                  ))
                )}
              </View>
              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="¿Cuál es mi mejor horario?"
                  placeholderTextColor={colors.textMuted}
                  value={aiQuery}
                  onChangeText={setAiQuery}
                  onSubmitEditing={handleAiQuery}
                />
                <TouchableOpacity style={styles.chatSendBtn} onPress={handleAiQuery}>
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {activeSection === 'team' && (
          <>
            {/* Team members */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>👥 Equipo</Text>
                <TouchableOpacity style={styles.addBtn}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                  <Text style={styles.addBtnText}>Invitar</Text>
                </TouchableOpacity>
              </View>
              
              {TEAM_MEMBERS.map((member, idx) => (
                <View key={idx} style={styles.memberCard}>
                  <Text style={styles.memberAvatar}>{member.avatar}</Text>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRole}>{member.role}</Text>
                  </View>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: member.status === 'online' ? '#10B981' : colors.textMuted },
                  ]} />
                </View>
              ))}
            </View>

            {/* Roles y permisos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔐 Roles disponibles</Text>
              <View style={styles.rolesCard}>
                <View style={styles.roleRow}>
                  <Text style={styles.roleName}>Owner</Text>
                  <Text style={styles.roleDesc}>Control total</Text>
                </View>
                <View style={styles.roleRow}>
                  <Text style={styles.roleName}>Admin</Text>
                  <Text style={styles.roleDesc}>Gestión de sesiones y equipo</Text>
                </View>
                <View style={styles.roleRow}>
                  <Text style={styles.roleName}>Moderador</Text>
                  <Text style={styles.roleDesc}>Moderar chat y aprobar canciones</Text>
                </View>
                <View style={styles.roleRow}>
                  <Text style={styles.roleName}>DJ</Text>
                  <Text style={styles.roleDesc}>Crear y gestionar sesiones</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeSection === 'sessions' && (
          <>
            {/* Multi-session */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📡 Salas activas</Text>
                <TouchableOpacity style={styles.addBtn}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                  <Text style={styles.addBtnText}>Nueva sala</Text>
                </TouchableOpacity>
              </View>

              {MULTI_SESSIONS.map((session, idx) => (
                <TouchableOpacity key={idx} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionName}>{session.name}</Text>
                    <View style={[
                      styles.sessionStatus,
                      { backgroundColor: session.status === 'live' ? '#10B98120' : colors.primary + '20' },
                    ]}>
                      <Text style={[
                        styles.sessionStatusText,
                        { color: session.status === 'live' ? '#10B981' : colors.primary },
                      ]}>
                        {session.status === 'live' ? '🔴 EN VIVO' : `⏰ ${session.time}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionDJ}>DJ: {session.dj}</Text>
                    {session.status === 'live' && (
                      <Text style={styles.sessionListeners}>
                        {session.listeners} oyentes
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Estadísticas multi-sala */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Estadísticas globales</Text>
              <View style={styles.globalStatsCard}>
                <View style={styles.globalStat}>
                  <Text style={styles.globalStatValue}>2</Text>
                  <Text style={styles.globalStatLabel}>Salas activas</Text>
                </View>
                <View style={styles.globalStat}>
                  <Text style={styles.globalStatValue}>145</Text>
                  <Text style={styles.globalStatLabel}>Oyentes totales</Text>
                </View>
                <View style={styles.globalStat}>
                  <Text style={styles.globalStatValue}>3</Text>
                  <Text style={styles.globalStatLabel}>DJs online</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeSection === 'branding' && (
          <>
            {/* Branding personalizado */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎨 Tu marca</Text>
              
              <View style={styles.brandCard}>
                <Text style={styles.brandLabel}>Logo</Text>
                <TouchableOpacity style={styles.uploadBox}>
                  <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                  <Text style={styles.uploadText}>Subir logo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.brandCard}>
                <Text style={styles.brandLabel}>Colores</Text>
                <View style={styles.colorsRow}>
                  {['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'].map((color, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.colorOption, { backgroundColor: color }]}
                    />
                  ))}
                  <TouchableOpacity style={styles.colorCustom}>
                    <Ionicons name="add" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.brandCard}>
                <Text style={styles.brandLabel}>Nombre del local/marca</Text>
                <TextInput
                  style={styles.brandInput}
                  placeholder="Ej: Club Ibiza Madrid"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <TouchableOpacity style={styles.previewBtn}>
                <Text style={styles.previewBtnText}>Vista previa</Text>
              </TouchableOpacity>
            </View>

            {/* API Access */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔌 API Access</Text>
              <View style={styles.apiCard}>
                <Text style={styles.apiLabel}>Tu API Key</Text>
                <View style={styles.apiKeyRow}>
                  <Text style={styles.apiKey}>ws_live_****************************</Text>
                  <TouchableOpacity>
                    <Ionicons name="copy-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.docsLink}>
                  <Text style={styles.docsLinkText}>Ver documentación API →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
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
  settingsBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  sectionsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  sectionBtnActive: {
    backgroundColor: colors.primary + '20',
  },
  sectionBtnText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sectionBtnTextActive: {
    ...typography.captionBold,
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
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
    marginBottom: spacing.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  addBtnText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  aiCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  aiIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  aiContent: {
    flex: 1,
  },
  aiTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  aiText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  chatContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 150,
    marginBottom: spacing.sm,
  },
  chatEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatEmptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  chatBubble: {
    maxWidth: '80%',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  chatBubbleUser: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  chatBubbleAI: {
    backgroundColor: colors.background,
    alignSelf: 'flex-start',
  },
  chatText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  chatTextUser: {
    color: '#fff',
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  chatSendBtn: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  memberAvatar: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  memberRole: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rolesCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  roleName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  roleDesc: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sessionName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  sessionStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  sessionStatusText: {
    ...typography.captionBold,
    fontSize: 10,
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionDJ: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sessionListeners: {
    ...typography.captionBold,
    color: colors.primary,
  },
  globalStatsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  globalStat: {
    flex: 1,
    alignItems: 'center',
  },
  globalStatValue: {
    ...typography.h2,
    color: colors.primary,
  },
  globalStatLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  brandCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  brandLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  uploadText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  colorsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorCustom: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  previewBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  previewBtnText: {
    ...typography.buttonText,
    color: '#fff',
  },
  apiCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  apiLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  apiKey: {
    ...typography.body,
    color: colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  docsLink: {
    alignItems: 'center',
  },
  docsLinkText: {
    ...typography.body,
    color: colors.primary,
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
    backgroundColor: '#8B5CF6',
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
