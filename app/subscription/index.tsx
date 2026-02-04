/**
 * WhatsSound — Pantalla de Planes de Suscripción
 * Comparativa visual de tiers para DJs
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import {
  useSubscription,
  TIER_PRICES,
  TIER_NAMES,
  TIER_ICONS,
  SubscriptionTier,
} from '../../src/hooks';

const { width } = Dimensions.get('window');

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PlanData {
  tier: SubscriptionTier;
  name: string;
  icon: string;
  price: number;
  description: string;
  features: PlanFeature[];
  highlighted?: boolean;
  color: string;
}

const PLANS: PlanData[] = [
  {
    tier: 'free',
    name: 'DJ Social',
    icon: '🎵',
    price: 0,
    description: 'Para poner música con amigos',
    color: colors.textMuted,
    features: [
      { text: 'Sesiones ilimitadas', included: true },
      { text: 'Hasta 20 oyentes', included: true },
      { text: 'Cola con votos', included: true },
      { text: 'Chat en tiempo real', included: true },
      { text: 'Recibir decibelios', included: true },
      { text: 'Historial 7 días', included: true },
      { text: 'Notificaciones a seguidores', included: false },
      { text: 'Programar sesiones', included: false },
    ],
  },
  {
    tier: 'creator',
    name: 'Creator',
    icon: '⭐',
    price: 1.99,
    description: 'Para creadores en crecimiento',
    color: '#F59E0B',
    features: [
      { text: 'Todo lo de DJ Social', included: true },
      { text: 'Hasta 100 oyentes', included: true },
      { text: 'Notificaciones push', included: true },
      { text: 'Historial 30 días', included: true },
      { text: 'Programar sesiones', included: true },
      { text: 'Badge verificado ⭐', included: true },
      { text: 'Estadísticas avanzadas', included: false },
      { text: 'Exportar datos', included: false },
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    icon: '🎧',
    price: 7.99,
    description: 'Para DJs semi-profesionales',
    color: colors.primary,
    highlighted: true,
    features: [
      { text: 'Todo lo de Creator', included: true },
      { text: 'Oyentes ilimitados', included: true },
      { text: 'Analytics completo', included: true },
      { text: 'Exportar CSV/PDF', included: true },
      { text: 'Perfil profesional', included: true },
      { text: 'Prioridad en Descubrir', included: true },
      { text: 'Co-DJs en sesión', included: true },
      { text: 'Asistente IA', included: false },
    ],
  },
  {
    tier: 'business',
    name: 'Business',
    icon: '🏢',
    price: 29.99,
    description: 'Para locales y profesionales',
    color: '#8B5CF6',
    features: [
      { text: 'Todo lo de Pro', included: true },
      { text: 'Multi-sesión (varias salas)', included: true },
      { text: 'Branding personalizado', included: true },
      { text: 'Asistente IA completo', included: true },
      { text: 'API de integración', included: true },
      { text: 'Equipo multi-admin', included: true },
      { text: 'Reportes fiscales', included: true },
      { text: 'Soporte prioritario', included: true },
    ],
  },
];

const PlanCard = ({ 
  plan, 
  isCurrentPlan, 
  onSelect 
}: { 
  plan: PlanData; 
  isCurrentPlan: boolean;
  onSelect: () => void;
}) => (
  <View style={[
    styles.planCard,
    plan.highlighted && styles.planCardHighlighted,
    isCurrentPlan && styles.planCardCurrent,
  ]}>
    {plan.highlighted && (
      <View style={styles.popularBadge}>
        <Text style={styles.popularText}>MÁS POPULAR</Text>
      </View>
    )}
    
    <Text style={styles.planIcon}>{plan.icon}</Text>
    <Text style={styles.planName}>{plan.name}</Text>
    <Text style={styles.planDesc}>{plan.description}</Text>
    
    <View style={styles.priceRow}>
      {plan.price === 0 ? (
        <Text style={styles.priceFree}>Gratis</Text>
      ) : (
        <>
          <Text style={styles.priceAmount}>€{plan.price.toFixed(2)}</Text>
          <Text style={styles.pricePeriod}>/mes</Text>
        </>
      )}
    </View>

    <View style={styles.featuresContainer}>
      {plan.features.map((feature, idx) => (
        <View key={idx} style={styles.featureRow}>
          <Ionicons
            name={feature.included ? 'checkmark-circle' : 'close-circle'}
            size={18}
            color={feature.included ? colors.primary : colors.textMuted}
          />
          <Text style={[
            styles.featureText,
            !feature.included && styles.featureTextDisabled,
          ]}>
            {feature.text}
          </Text>
        </View>
      ))}
    </View>

    <TouchableOpacity
      style={[
        styles.selectBtn,
        { backgroundColor: plan.color },
        isCurrentPlan && styles.selectBtnCurrent,
      ]}
      onPress={onSelect}
      disabled={isCurrentPlan}
    >
      <Text style={styles.selectBtnText}>
        {isCurrentPlan ? 'Plan actual' : plan.price === 0 ? 'Empezar gratis' : 'Elegir plan'}
      </Text>
    </TouchableOpacity>
  </View>
);

export default function SubscriptionPage() {
  const router = useRouter();
  const { tier: currentTier, loading } = useSubscription();

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (tier === 'free') return;
    // TODO: Integrar Stripe checkout
    console.log('Seleccionado:', tier);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Elige tu plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>
        Desbloquea más oyentes y herramientas profesionales
      </Text>

      {/* Plans */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.plansContainer}
        snapToInterval={width * 0.8 + spacing.md}
        decelerationRate="fast"
      >
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.tier}
            plan={plan}
            isCurrentPlan={currentTier === plan.tier}
            onSelect={() => handleSelectPlan(plan.tier)}
          />
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Cancela cuando quieras · Sin compromisos
        </Text>
        <TouchableOpacity onPress={() => router.push('/subscription/enterprise')}>
          <Text style={styles.enterpriseLink}>
            ¿Organizas grandes eventos? Contacta para Enterprise →
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 24,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  plansContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  planCard: {
    width: width * 0.8,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardHighlighted: {
    borderColor: colors.primary,
  },
  planCardCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  popularText: {
    ...typography.captionBold,
    color: '#fff',
    fontSize: 10,
  },
  planIcon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  planName: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  planDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  priceFree: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 32,
  },
  priceAmount: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 32,
  },
  pricePeriod: {
    ...typography.body,
    color: colors.textSecondary,
  },
  featuresContainer: {
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  featureTextDisabled: {
    color: colors.textMuted,
  },
  selectBtn: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  selectBtnCurrent: {
    backgroundColor: colors.textMuted,
  },
  selectBtnText: {
    ...typography.buttonText,
    color: '#fff',
  },
  footer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  enterpriseLink: {
    ...typography.body,
    color: colors.primary,
  },
});
