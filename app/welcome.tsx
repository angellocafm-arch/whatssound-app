/**
 * WhatsSound — Welcome Page
 * Carta de presentación con sistema de decibelios
 * Diseño responsive con animaciones
 */

import React, { useEffect, useState } from 'react';
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
import { DecibelCounter } from '../src/components/welcome/DecibelCounter';
import { DecibelCalculator } from '../src/components/welcome/DecibelCalculator';
import { PlanCard } from '../src/components/welcome/PlanCard';
import { LiveActivityFeed } from '../src/components/welcome/LiveActivityFeed';

const { width } = Dimensions.get('window');
const isSmall = width < 380;

// Stats simulados
const LIVE_STATS = {
  listeners: 1247,
  dbToday: 45200,
};

// Features para oyentes
const LISTENER_FEATURES = [
  { icon: 'musical-notes', title: 'Pide canciones', desc: 'Elige qué suena' },
  { icon: 'thumbs-up', title: 'Vota favoritas', desc: 'Sube las mejores' },
  { icon: 'chatbubbles', title: 'Chat en vivo', desc: 'Comenta con otros' },
  { icon: 'volume-high', title: 'Gana dB', desc: '1 dB por minuto' },
];

// Features para DJs
const DJ_FEATURES = [
  { icon: 'radio', title: 'Crea sesiones', desc: 'Tu escenario digital' },
  { icon: 'heart', title: 'Recibe dB', desc: 'Aplausos de tus fans' },
  { icon: 'trophy', title: 'Golden Boosts', desc: 'Reconocimiento especial' },
  { icon: 'star', title: 'Badges', desc: 'Sube de nivel' },
];

// Planes
const PLANS = [
  {
    name: 'DJ Social',
    icon: '🎵',
    price: 'Gratis',
    priceNote: 'Para siempre',
    description: 'Para empezar',
    color: colors.textMuted,
    features: [
      { text: 'Sesiones ilimitadas', included: true },
      { text: 'Hasta 20 oyentes', included: true },
      { text: 'Cola con votos', included: true },
      { text: 'Recibir dB', included: true },
    ],
  },
  {
    name: 'Creator',
    icon: '⭐',
    price: '500 dB',
    priceNote: '~8h escuchando/mes',
    description: 'Crece tu audiencia',
    color: '#F59E0B',
    features: [
      { text: 'Hasta 100 oyentes', included: true },
      { text: 'Notificaciones push', included: true },
      { text: 'Programar sesiones', included: true },
      { text: 'Badge verificado ⭐', included: true },
    ],
  },
  {
    name: 'Pro',
    icon: '🎧',
    price: '2,000 dB',
    priceNote: '~33h escuchando/mes',
    description: 'Para profesionales',
    color: colors.primary,
    highlighted: true,
    badge: 'POPULAR',
    features: [
      { text: 'Oyentes ilimitados', included: true },
      { text: 'Analytics completo', included: true },
      { text: 'Prioridad Descubrir', included: true },
      { text: 'Co-DJs en sesión', included: true },
    ],
  },
  {
    name: 'Business',
    icon: '🏢',
    price: '10,000 dB',
    priceNote: 'Para locales',
    description: 'Escala tu negocio',
    color: '#8B5CF6',
    features: [
      { text: 'Multi-sesión', included: true },
      { text: 'Branding propio', included: true },
      { text: 'API integración', included: true },
      { text: 'Equipo multi-admin', included: true },
    ],
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { code, from, demo } = useLocalSearchParams<{ code?: string; from?: string; demo?: string }>();
  const [stats, setStats] = useState(LIVE_STATS);

  useEffect(() => {
    if (demo !== undefined) {
      setDemoMode(demo !== 'false');
    }

    // Simulate live stats updates
    const interval = setInterval(() => {
      setStats(prev => ({
        listeners: prev.listeners + Math.floor(Math.random() * 3) - 1,
        dbToday: prev.dbToday + Math.floor(Math.random() * 10),
      }));
    }, 5000);

    return () => clearInterval(interval);
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
    <View style={s.container}>
      <ScrollView 
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View style={s.hero}>
          <View style={s.logoBubble}>
            <Ionicons name="headset" size={isSmall ? 40 : 56} color="#fff" />
          </View>
          <Text style={s.title}>
            <Text style={s.titleWhats}>Whats</Text>
            <Text style={s.titleSound}>Sound</Text>
          </Text>
          <Text style={s.tagline}>Gana escuchando. Comparte vibrando.</Text>

          {/* Live Stats */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <View style={s.statDot} />
              <Text style={s.statValue}>{stats.listeners.toLocaleString()}</Text>
              <Text style={s.statLabel}>escuchando</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Ionicons name="volume-high" size={16} color={colors.primary} />
              <Text style={s.statValue}>{(stats.dbToday / 1000).toFixed(1)}K</Text>
              <Text style={s.statLabel}>dB hoy</Text>
            </View>
          </View>
        </View>

        {/* Invitación personalizada */}
        {from && (
          <View style={s.inviteCard}>
            <Ionicons name="person-add" size={24} color={colors.primary} />
            <Text style={s.inviteText}>
              <Text style={s.inviteName}>{from}</Text> te ha invitado
            </Text>
          </View>
        )}

        {/* SISTEMA DE DECIBELIOS */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>El sonido tiene valor</Text>
          <Text style={s.sectionSubtitle}>1 minuto escuchando = 1 decibelio</Text>
          
          <DecibelCounter />

          <View style={s.decibelUses}>
            <View style={s.decibelUse}>
              <View style={[s.decibelIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="headset" size={20} color={colors.primary} />
              </View>
              <Text style={s.decibelUseText}>Escucha</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
            <View style={s.decibelUse}>
              <View style={[s.decibelIcon, { backgroundColor: colors.warning + '20' }]}>
                <Ionicons name="heart" size={20} color={colors.warning} />
              </View>
              <Text style={s.decibelUseText}>Acumula</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
            <View style={s.decibelUse}>
              <View style={[s.decibelIcon, { backgroundColor: '#FFD700' + '20' }]}>
                <Ionicons name="gift" size={20} color="#FFD700" />
              </View>
              <Text style={s.decibelUseText}>Desbloquea</Text>
            </View>
          </View>
        </View>

        {/* CALCULADORA */}
        <View style={s.section}>
          <DecibelCalculator />
        </View>

        {/* PARA OYENTES */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>🎵 Para Oyentes</Text>
          <Text style={s.sectionSubtitle}>La música que tú eliges</Text>
          
          <View style={s.featuresGrid}>
            {LISTENER_FEATURES.map((f, idx) => (
              <View key={idx} style={s.featureCard}>
                <View style={s.featureIcon}>
                  <Ionicons name={f.icon as any} size={22} color={colors.primary} />
                </View>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* PARA DJs */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>🎧 Para DJs</Text>
          <Text style={s.sectionSubtitle}>Tu escenario digital</Text>
          
          <View style={s.featuresGrid}>
            {DJ_FEATURES.map((f, idx) => (
              <View key={idx} style={s.featureCard}>
                <View style={s.featureIcon}>
                  <Ionicons name={f.icon as any} size={22} color={colors.primary} />
                </View>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* PLANES */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Un plan para cada momento</Text>
          <Text style={s.sectionSubtitle}>Todo se paga con decibelios</Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.plansScroll}
        >
          {PLANS.map((plan, idx) => (
            <PlanCard
              key={idx}
              name={plan.name}
              icon={plan.icon}
              price={plan.price}
              priceNote={plan.priceNote}
              description={plan.description}
              color={plan.color}
              features={plan.features}
              highlighted={plan.highlighted}
              badge={plan.badge}
            />
          ))}
        </ScrollView>

        <Text style={s.plansHint}>
          💡 Escucha música y desbloquea todo
        </Text>

        {/* ACTIVIDAD EN VIVO */}
        <View style={s.section}>
          <LiveActivityFeed />
        </View>

        {/* TESTIMONIAL */}
        <View style={s.section}>
          <View style={s.testimonialCard}>
            <Text style={s.testimonialQuote}>
              "Llevo 2 meses y ya tengo suficientes dB para el plan Pro. Solo escuchando música mientras trabajo."
            </Text>
            <Text style={s.testimonialAuthor}>— @maria_g ⭐</Text>
          </View>
        </View>

        {/* FOOTER MESSAGE */}
        <View style={s.section}>
          <Text style={s.footerMessage}>Todo esto es GRATIS</Text>
          <Text style={s.footerSubmessage}>
            Sin tarjeta. Sin compromisos. Solo música.
          </Text>
        </View>
      </ScrollView>

      {/* CTAs */}
      <View style={s.ctas}>
        <TouchableOpacity style={s.primaryBtn} onPress={handleStart}>
          <Text style={s.primaryBtnText}>
            {code ? 'Aceptar invitación' : 'Empieza a ganar'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={s.secondaryBtn} onPress={handleExplore}>
          <Text style={s.secondaryBtnText}>Ver sesiones en vivo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 140,
  },

  // Hero
  hero: {
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logoBubble: {
    width: isSmall ? 80 : 100,
    height: isSmall ? 80 : 100,
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
    fontSize: isSmall ? 32 : 40,
    fontWeight: '800',
  },
  titleWhats: { color: colors.textPrimary },
  titleSound: { color: colors.primary },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: isSmall ? 16 : 18,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  statValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
  },

  // Invite
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
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

  // Section
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontSize: isSmall ? 22 : 26,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Decibel uses
  decibelUses: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  decibelUse: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  decibelIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decibelUseText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },

  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  featureCard: {
    width: (width - spacing.lg * 2 - spacing.sm) / 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 2,
  },
  featureDesc: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },

  // Plans
  plansScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  plansHint: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  // Testimonial
  testimonialCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  testimonialQuote: {
    ...typography.body,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  testimonialAuthor: {
    ...typography.captionBold,
    color: colors.primary,
  },

  // Footer message
  footerMessage: {
    ...typography.h2,
    color: colors.primary,
    textAlign: 'center',
    fontSize: 28,
  },
  footerSubmessage: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // CTAs
  ctas: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    paddingVertical: spacing.xs,
  },
  secondaryBtnText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
