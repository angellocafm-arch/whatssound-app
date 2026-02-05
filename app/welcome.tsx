/**
 * WhatsSound — Landing Page de Bienvenida
 * Presentación de la app para nuevos usuarios
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';
import { setDemoMode } from '../src/lib/demo';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'radio',
    title: 'Sesiones en vivo',
    desc: 'Escucha música en tiempo real con tus amigos',
  },
  {
    icon: 'musical-notes',
    title: 'Pide canciones',
    desc: 'Vota las canciones que quieres escuchar',
  },
  {
    icon: 'chatbubbles',
    title: 'Chat en directo',
    desc: 'Comenta y reacciona con otros oyentes',
  },
  {
    icon: 'volume-high',
    title: 'Da volumen',
    desc: 'Reconoce a tus DJs favoritos con decibelios',
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { code, from, demo } = useLocalSearchParams<{ code?: string; from?: string; demo?: string }>();

  // Guardar el modo demo si viene en la URL
  useEffect(() => {
    if (demo !== undefined) {
      setDemoMode(demo !== 'false');
    }
  }, [demo]);

  const handleStart = () => {
    if (code) {
      router.push(`/join/${code}`);
    } else {
      router.push('/(auth)/login');
    }
  };

  const handleExplore = () => {
    router.push('/(tabs)/live');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoBubble}>
            <Ionicons name="headset" size={56} color="#fff" />
          </View>
          <Text style={styles.title}>
            <Text style={styles.titleWhats}>Whats</Text>
            <Text style={styles.titleSound}>Sound</Text>
          </Text>
          <Text style={styles.tagline}>Tu música, tu sesión</Text>
        </View>

        {/* Invitación personalizada */}
        {from && (
          <View style={styles.inviteCard}>
            <Ionicons name="person-add" size={24} color={colors.primary} />
            <Text style={styles.inviteText}>
              <Text style={styles.inviteName}>{from}</Text> te ha invitado a WhatsSound
            </Text>
          </View>
        )}

        {/* Features */}
        <View style={styles.featuresGrid}>
          {FEATURES.map((f, idx) => (
            <View key={idx} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon as any} size={24} color={colors.primary} />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>1K+</Text>
            <Text style={styles.statLabel}>Oyentes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>50+</Text>
            <Text style={styles.statLabel}>DJs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>24/7</Text>
            <Text style={styles.statLabel}>Música</Text>
          </View>
        </View>
      </ScrollView>

      {/* CTAs */}
      <View style={styles.ctas}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleStart}>
          <Text style={styles.primaryBtnText}>
            {code ? 'Aceptar invitación' : 'Comenzar'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleExplore}>
          <Text style={styles.secondaryBtnText}>Explorar sin cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoBubble: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  titleWhats: {
    color: colors.textPrimary,
  },
  titleSound: {
    color: colors.primary,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 18,
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  inviteText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  inviteName: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  featureDesc: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 28,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  ctas: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    ...typography.button,
    color: '#fff',
    fontSize: 16,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryBtnText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
