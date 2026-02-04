/**
 * WhatsSound — Pantalla de Invitar Amigos
 * Sistema de referidos para crecimiento viral
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';
import { useReferrals } from '../src/hooks';

export default function InviteScreen() {
  const router = useRouter();
  const {
    myCode,
    referrals,
    completedCount,
    loading,
    getOrCreateCode,
    shareReferral,
    copyToClipboard,
    getReferralUrl,
  } = useReferrals();

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generar código si no existe
    if (!myCode && !loading) {
      getOrCreateCode();
    }
  }, [myCode, loading]);

  const handleCopy = async () => {
    await copyToClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await shareReferral();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Invitar Amigos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🎁</Text>
        <Text style={styles.heroTitle}>Comparte la música</Text>
        <Text style={styles.heroSubtitle}>
          Invita a tus amigos y disfruten juntos de las mejores sesiones en vivo
        </Text>
      </View>

      {/* Código */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Tu código personal</Text>
        <Text style={styles.code}>{myCode || '------'}</Text>
        <Text style={styles.codeUrl}>{getReferralUrl()}</Text>
      </View>

      {/* Botones */}
      <View style={styles.buttons}>
        <TouchableOpacity 
          style={[styles.btn, styles.btnPrimary]} 
          onPress={handleShare}
        >
          <Ionicons name="share-social" size={20} color="#fff" />
          <Text style={styles.btnPrimaryText}>Compartir</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, styles.btnSecondary]} 
          onPress={handleCopy}
        >
          <Ionicons 
            name={copied ? "checkmark" : "copy-outline"} 
            size={20} 
            color={colors.primary} 
          />
          <Text style={styles.btnSecondaryText}>
            {copied ? '¡Copiado!' : 'Copiar enlace'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{completedCount}</Text>
          <Text style={styles.statLabel}>Amigos invitados</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{referrals.length}</Text>
          <Text style={styles.statLabel}>Invitaciones enviadas</Text>
        </View>
      </View>

      {/* Lista de referidos */}
      {referrals.length > 0 && (
        <View style={styles.referralsList}>
          <Text style={styles.listTitle}>Tus invitaciones</Text>
          {referrals.map((ref) => (
            <View key={ref.id} style={styles.referralItem}>
              <View style={styles.referralIcon}>
                <Ionicons 
                  name={ref.status === 'completed' ? 'checkmark-circle' : 'time-outline'} 
                  size={20} 
                  color={ref.status === 'completed' ? '#22c55e' : colors.textMuted} 
                />
              </View>
              <View style={styles.referralInfo}>
                <Text style={styles.referralStatus}>
                  {ref.status === 'completed' ? 'Completado' : 'Pendiente'}
                </Text>
                <Text style={styles.referralDate}>
                  {new Date(ref.createdAt).toLocaleDateString('es-ES')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Cómo funciona */}
      <View style={styles.howItWorks}>
        <Text style={styles.howTitle}>¿Cómo funciona?</Text>
        <View style={styles.howStep}>
          <Text style={styles.howNumber}>1</Text>
          <Text style={styles.howText}>Comparte tu código con amigos</Text>
        </View>
        <View style={styles.howStep}>
          <Text style={styles.howNumber}>2</Text>
          <Text style={styles.howText}>Ellos se registran con tu código</Text>
        </View>
        <View style={styles.howStep}>
          <Text style={styles.howNumber}>3</Text>
          <Text style={styles.howText}>¡Disfruten juntos de la música!</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 18,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  codeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  codeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  code: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 36,
    letterSpacing: 8,
    marginBottom: spacing.sm,
  },
  codeUrl: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    ...typography.buttonText,
    color: '#fff',
  },
  btnSecondary: {
    backgroundColor: colors.primary + '20',
  },
  btnSecondaryText: {
    ...typography.buttonText,
    color: colors.primary,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 32,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  referralsList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  listTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  referralIcon: {
    marginRight: spacing.sm,
  },
  referralInfo: {
    flex: 1,
  },
  referralStatus: {
    ...typography.body,
    color: colors.textPrimary,
  },
  referralDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  howItWorks: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  howTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  howStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  howNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: spacing.sm,
    fontSize: 12,
    fontWeight: '600',
  },
  howText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
});
