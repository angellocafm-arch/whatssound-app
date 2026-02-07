/**
 * WhatsSound — Welcome Page
 * Carta de presentación con diseño responsive
 * Desktop: layout multi-columna
 * Mobile: scroll vertical
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
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';
import { setDemoMode, isDemoMode, DEMO_USER } from '../src/lib/demo';
import { useAuthStore } from '../src/stores/authStore';
import { NeonCard } from '../src/components/welcome/NeonCard';

// Demo user
const DEMO_AUTH_USER = {
  id: DEMO_USER.id,
  email: 'demo@whatssound.app',
  app_metadata: {},
  user_metadata: { display_name: DEMO_USER.display_name },
  aud: 'authenticated',
  created_at: '2024-01-15T10:00:00Z',
} as any;

const DEMO_SESSION = {
  access_token: 'demo-token',
  refresh_token: 'demo-refresh',
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  user: DEMO_AUTH_USER,
} as any;

const DEMO_PROFILE = {
  id: DEMO_USER.id,
  username: DEMO_USER.username,
  display_name: DEMO_USER.display_name,
  bio: 'Aquí por la música 💃',
  avatar_url: null,
  is_dj: false,
  is_verified: false,
  dj_name: null,
  genres: ['Reggaetón', 'Pop'],
  role: 'user',
};

// Features
const FEATURES = [
  { icon: 'headset', title: 'Sesiones en vivo', desc: 'Escucha música en tiempo real' },
  { icon: 'musical-notes', title: 'Pide canciones', desc: 'Elige qué suena' },
  { icon: 'chatbubbles', title: 'Chat en directo', desc: 'Comenta con otros' },
  { icon: 'volume-high', title: 'Gana decibelios', desc: '1 dB por minuto' },
  { icon: 'trophy', title: 'Golden Boosts', desc: 'Reconoce a tus DJs' },
  { icon: 'star', title: 'Sube de nivel', desc: 'Desbloquea badges' },
];

// Plans
const PLANS = [
  {
    name: 'Gratis',
    icon: '🎵',
    price: '0 dB',
    color: colors.textMuted,
    features: ['Sesiones ilimitadas', '20 oyentes', 'Chat en vivo', 'Recibir dB'],
  },
  {
    name: 'Creator',
    icon: '⭐',
    price: '500 dB/mes',
    color: '#F59E0B',
    features: ['100 oyentes', 'Push notifications', 'Programar sesiones', 'Badge ⭐'],
  },
  {
    name: 'Pro',
    icon: '🎧',
    price: '2,000 dB/mes',
    color: colors.primary,
    popular: true,
    features: ['∞ oyentes', 'Analytics completo', 'Prioridad Descubrir', 'Co-DJs'],
  },
  {
    name: 'Business',
    icon: '🏢',
    price: '10,000 dB/mes',
    color: '#8B5CF6',
    features: ['Multi-sesión', 'Branding propio', 'API integración', 'Multi-admin'],
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { code, from, demo } = useLocalSearchParams<{ code?: string; from?: string; demo?: string }>();
  const { width } = useWindowDimensions();
  
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  
  const [dbCount, setDbCount] = useState(247);
  const [listeners, setListeners] = useState(1247);

  useEffect(() => {
    if (demo !== undefined) setDemoMode(demo !== 'false');
    
    // Animate counters
    const interval = setInterval(() => {
      setDbCount(v => v + 1);
      setListeners(v => v + Math.floor(Math.random() * 3) - 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [demo]);

  const handleStart = () => {
    if (code) {
      router.push(`/join/${code}`);
    } else if (isDemoMode()) {
      useAuthStore.setState({
        user: DEMO_AUTH_USER,
        session: DEMO_SESSION,
        profile: DEMO_PROFILE,
        initialized: true,
        loading: false,
      });
      router.replace('/(tabs)');
    } else {
      router.push('/(auth)/login');
    }
  };

  const handleExplore = () => {
    if (isDemoMode()) {
      useAuthStore.setState({
        user: DEMO_AUTH_USER,
        session: DEMO_SESSION,
        profile: DEMO_PROFILE,
        initialized: true,
        loading: false,
      });
    }
    router.push('/(tabs)/live');
  };

  return (
    <View style={s.container}>
      <ScrollView 
        contentContainerStyle={[
          s.scrollContent,
          isDesktop && s.scrollContentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════════════
            HERO SECTION
            ══════════════════════════════════════════════════════════ */}
        <View style={[s.hero, isDesktop && s.heroDesktop]}>
          <View style={s.heroContent}>
            <View style={s.logoBubble}>
              <Ionicons name="headset" size={isDesktop ? 72 : 56} color="#fff" />
            </View>
            <Text style={[s.title, isDesktop && s.titleDesktop]}>
              <Text style={s.titleWhats}>Whats</Text>
              <Text style={s.titleSound}>Sound</Text>
            </Text>
            <Text style={[s.tagline, isDesktop && s.taglineDesktop]}>
              Gana escuchando. Comparte vibrando.
            </Text>
            
            {/* Live stats */}
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <View style={s.liveDot} />
                <Text style={s.statValue}>{listeners.toLocaleString()}</Text>
                <Text style={s.statLabel}>escuchando</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Ionicons name="volume-high" size={16} color={colors.primary} />
                <Text style={s.statValue}>45K</Text>
                <Text style={s.statLabel}>dB hoy</Text>
              </View>
            </View>

            {/* CTA on hero for desktop */}
            {isDesktop && (
              <View style={s.heroCtas}>
                <TouchableOpacity style={s.primaryBtn} onPress={handleStart}>
                  <Text style={s.primaryBtnText}>Empieza a ganar</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={s.secondaryBtn} onPress={handleExplore}>
                  <Text style={s.secondaryBtnText}>Ver sesiones en vivo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════
            DECIBEL SYSTEM
            ══════════════════════════════════════════════════════════ */}
        <View style={[s.section, isDesktop && s.sectionDesktop]}>
          <Text style={[s.sectionTitle, isDesktop && s.sectionTitleDesktop]}>
            El sonido tiene valor
          </Text>
          <Text style={s.sectionSubtitle}>
            1 minuto escuchando = 1 decibelio
          </Text>

          <View style={[s.decibelRow, isDesktop && s.decibelRowDesktop]}>
            {/* Counter */}
            <NeonCard style={s.decibelCard} glowColor={colors.primary} intensity="high">
              <View style={s.decibelCardInner}>
                <Ionicons name="volume-high" size={32} color={colors.primary} />
                <Text style={s.decibelValue}>{dbCount}</Text>
                <Text style={s.decibelUnit}>dB</Text>
                <Text style={s.decibelHint}>+1 cada minuto</Text>
              </View>
            </NeonCard>

            {/* How it works */}
            <View style={[s.decibelSteps, isDesktop && s.decibelStepsDesktop]}>
              <NeonCard style={s.stepCard} glowColor={colors.primary}>
                <View style={s.stepInner}>
                  <View style={[s.stepIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="headset" size={24} color={colors.primary} />
                  </View>
                  <Text style={s.stepTitle}>Escucha</Text>
                  <Text style={s.stepDesc}>Música en vivo</Text>
                </View>
              </NeonCard>
              <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
              <NeonCard style={s.stepCard} glowColor="#F59E0B">
                <View style={s.stepInner}>
                  <View style={[s.stepIcon, { backgroundColor: '#F59E0B20' }]}>
                    <Ionicons name="trending-up" size={24} color="#F59E0B" />
                  </View>
                  <Text style={s.stepTitle}>Acumula</Text>
                  <Text style={s.stepDesc}>Decibelios</Text>
                </View>
              </NeonCard>
              <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
              <NeonCard style={s.stepCard} glowColor="#FFD700">
                <View style={s.stepInner}>
                  <View style={[s.stepIcon, { backgroundColor: '#FFD70020' }]}>
                    <Ionicons name="gift" size={24} color="#FFD700" />
                  </View>
                  <Text style={s.stepTitle}>Desbloquea</Text>
                  <Text style={s.stepDesc}>Todo gratis</Text>
                </View>
              </NeonCard>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════
            FEATURES GRID
            ══════════════════════════════════════════════════════════ */}
        <View style={[s.section, isDesktop && s.sectionDesktop]}>
          <Text style={[s.sectionTitle, isDesktop && s.sectionTitleDesktop]}>
            Todo lo que puedes hacer
          </Text>
          
          <View style={[s.featuresGrid, isDesktop && s.featuresGridDesktop]}>
            {FEATURES.map((f, i) => (
              <NeonCard 
                key={i} 
                style={[s.featureCard, isDesktop && s.featureCardDesktop]}
                glowColor={colors.primary}
              >
                <View style={s.featureInner}>
                  <View style={s.featureIcon}>
                    <Ionicons name={f.icon as any} size={24} color={colors.primary} />
                  </View>
                  <Text style={s.featureTitle}>{f.title}</Text>
                  <Text style={s.featureDesc}>{f.desc}</Text>
                </View>
              </NeonCard>
            ))}
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════
            PLANS
            ══════════════════════════════════════════════════════════ */}
        <View style={[s.section, isDesktop && s.sectionDesktop]}>
          <Text style={[s.sectionTitle, isDesktop && s.sectionTitleDesktop]}>
            Un plan para cada momento
          </Text>
          <Text style={s.sectionSubtitle}>
            Todo se paga con decibelios que ganas escuchando
          </Text>

          <View style={[s.plansGrid, isDesktop && s.plansGridDesktop]}>
            {PLANS.map((plan, i) => (
              <NeonCard 
                key={i} 
                style={[s.planCard, plan.popular && s.planCardPopular]}
                glowColor={plan.color}
                intensity={plan.popular ? 'high' : 'medium'}
              >
                <View style={s.planInner}>
                  {plan.popular && (
                    <View style={[s.planBadge, { backgroundColor: plan.color }]}>
                      <Text style={s.planBadgeText}>POPULAR</Text>
                    </View>
                  )}
                  <Text style={s.planIcon}>{plan.icon}</Text>
                  <Text style={s.planName}>{plan.name}</Text>
                  <Text style={[s.planPrice, { color: plan.color }]}>{plan.price}</Text>
                  <View style={s.planFeatures}>
                    {plan.features.map((f, j) => (
                      <View key={j} style={s.planFeatureRow}>
                        <Ionicons name="checkmark" size={16} color={plan.color} />
                        <Text style={s.planFeatureText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </NeonCard>
            ))}
          </View>

          <Text style={s.plansHint}>
            💡 Escucha música y desbloquea todo sin pagar
          </Text>
        </View>

        {/* ══════════════════════════════════════════════════════════
            TESTIMONIAL
            ══════════════════════════════════════════════════════════ */}
        <View style={[s.section, isDesktop && s.sectionDesktop]}>
          <NeonCard style={s.testimonialCard} glowColor={colors.primary}>
            <View style={s.testimonialInner}>
              <Text style={s.testimonialQuote}>
                "Llevo 2 meses y ya tengo suficientes dB para el plan Pro. 
                Solo escuchando música mientras trabajo."
              </Text>
              <Text style={s.testimonialAuthor}>— @maria_g ⭐</Text>
            </View>
          </NeonCard>
        </View>

        {/* ══════════════════════════════════════════════════════════
            FINAL CTA
            ══════════════════════════════════════════════════════════ */}
        <View style={[s.section, s.finalSection]}>
          <Text style={s.finalTitle}>Todo esto es GRATIS</Text>
          <Text style={s.finalSubtitle}>Sin tarjeta. Sin compromisos. Solo música.</Text>
        </View>
      </ScrollView>

      {/* Fixed CTAs (mobile only) */}
      {!isDesktop && (
        <View style={s.fixedCtas}>
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
      )}
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
  scrollContentDesktop: {
    paddingBottom: 60,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },

  // Hero
  hero: {
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  heroDesktop: {
    paddingTop: 80,
    paddingBottom: 40,
  },
  heroContent: {
    alignItems: 'center',
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
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
  },
  titleDesktop: {
    fontSize: 56,
  },
  titleWhats: { color: colors.textPrimary },
  titleSound: { color: colors.primary },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 18,
    marginTop: spacing.xs,
  },
  taglineDesktop: {
    fontSize: 22,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  liveDot: {
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
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
  },
  heroCtas: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },

  // Section
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
  },
  sectionDesktop: {
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontSize: 26,
  },
  sectionTitleDesktop: {
    fontSize: 36,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Decibel
  decibelRow: {
    gap: spacing.lg,
  },
  decibelRowDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decibelCard: {
    alignSelf: 'center',
    minWidth: 200,
  },
  decibelCardInner: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  decibelValue: {
    ...typography.h1,
    fontSize: 64,
    color: colors.primary,
    fontWeight: '800',
  },
  decibelUnit: {
    ...typography.h2,
    color: colors.primary,
    opacity: 0.8,
  },
  decibelHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  decibelSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
  },
  decibelStepsDesktop: {
    marginTop: 0,
    marginLeft: spacing.xl,
  },
  stepCard: {
    width: 100,
  },
  stepInner: {
    alignItems: 'center',
    padding: spacing.md,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  stepTitle: {
    ...typography.captionBold,
    color: colors.textPrimary,
    fontSize: 12,
  },
  stepDesc: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },

  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  featuresGridDesktop: {
    gap: spacing.lg,
  },
  featureCard: {
    width: '45%',
    maxWidth: 180,
  },
  featureCardDesktop: {
    width: 180,
    maxWidth: 200,
  },
  featureInner: {
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
    fontSize: 14,
  },
  featureDesc: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },

  // Plans
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  plansGridDesktop: {
    gap: spacing.lg,
    flexWrap: 'nowrap',
  },
  planCard: {
    width: '45%',
    maxWidth: 200,
    minWidth: 150,
  },
  planCardPopular: {
    transform: [{ scale: 1.02 }],
  },
  planInner: {
    padding: spacing.md,
    alignItems: 'center',
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeText: {
    ...typography.captionBold,
    color: '#fff',
    fontSize: 9,
  },
  planIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  planName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 16,
  },
  planPrice: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '800',
    marginVertical: spacing.xs,
  },
  planFeatures: {
    width: '100%',
    gap: 4,
    marginTop: spacing.sm,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planFeatureText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  plansHint: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },

  // Testimonial
  testimonialCard: {
    maxWidth: 500,
    alignSelf: 'center',
  },
  testimonialInner: {
    padding: spacing.xl,
  },
  testimonialQuote: {
    ...typography.body,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 26,
    textAlign: 'center',
  },
  testimonialAuthor: {
    ...typography.captionBold,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.md,
  },

  // Final
  finalSection: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  finalTitle: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 32,
    textAlign: 'center',
  },
  finalSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // CTAs
  fixedCtas: {
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
    paddingHorizontal: spacing.xl,
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
