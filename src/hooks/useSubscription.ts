/**
 * WhatsSound — useSubscription Hook
 * Gestión de tiers de suscripción para DJs
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export type SubscriptionTier = 'free' | 'creator' | 'pro' | 'business' | 'enterprise';

export interface TierFeatures {
  maxListeners: number;
  historyDays: number;
  canSchedule: boolean;
  canExport: boolean;
  hasAnalytics: boolean;
  hasAdvancedAnalytics: boolean;
  hasAIAssistant: boolean;
  canMultiSession: boolean;
  canCustomBranding: boolean;
  priorityDiscover: number;
  canInviteCoHost: boolean;
  hasAPIAccess: boolean;
}

// Configuración de features por tier
const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  free: {
    maxListeners: 20,
    historyDays: 7,
    canSchedule: false,
    canExport: false,
    hasAnalytics: true, // Básico
    hasAdvancedAnalytics: false,
    hasAIAssistant: false,
    canMultiSession: false,
    canCustomBranding: false,
    priorityDiscover: 0,
    canInviteCoHost: false,
    hasAPIAccess: false,
  },
  creator: {
    maxListeners: 100,
    historyDays: 30,
    canSchedule: true,
    canExport: false,
    hasAnalytics: true,
    hasAdvancedAnalytics: false,
    hasAIAssistant: false,
    canMultiSession: false,
    canCustomBranding: false,
    priorityDiscover: 1,
    canInviteCoHost: false,
    hasAPIAccess: false,
  },
  pro: {
    maxListeners: 9999, // "Ilimitado"
    historyDays: 365,
    canSchedule: true,
    canExport: true,
    hasAnalytics: true,
    hasAdvancedAnalytics: true,
    hasAIAssistant: false,
    canMultiSession: false,
    canCustomBranding: false,
    priorityDiscover: 2,
    canInviteCoHost: true,
    hasAPIAccess: false,
  },
  business: {
    maxListeners: 9999,
    historyDays: 730, // 2 años
    canSchedule: true,
    canExport: true,
    hasAnalytics: true,
    hasAdvancedAnalytics: true,
    hasAIAssistant: true,
    canMultiSession: true,
    canCustomBranding: true,
    priorityDiscover: 3,
    canInviteCoHost: true,
    hasAPIAccess: true,
  },
  enterprise: {
    maxListeners: 99999,
    historyDays: 9999,
    canSchedule: true,
    canExport: true,
    hasAnalytics: true,
    hasAdvancedAnalytics: true,
    hasAIAssistant: true,
    canMultiSession: true,
    canCustomBranding: true,
    priorityDiscover: 5,
    canInviteCoHost: true,
    hasAPIAccess: true,
  },
};

export const TIER_PRICES: Record<SubscriptionTier, number> = {
  free: 0,
  creator: 1.99,
  pro: 7.99,
  business: 29.99,
  enterprise: 0, // Custom
};

export const TIER_NAMES: Record<SubscriptionTier, string> = {
  free: 'DJ Social',
  creator: 'Creator',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise',
};

export const TIER_ICONS: Record<SubscriptionTier, string> = {
  free: '🎵',
  creator: '⭐',
  pro: '🎧',
  business: '🏢',
  enterprise: '🏆',
};

interface UseSubscriptionReturn {
  tier: SubscriptionTier;
  features: TierFeatures;
  loading: boolean;
  canAccess: (feature: keyof TierFeatures) => boolean;
  isWithinLimit: (current: number) => boolean;
  getUpgradeOffer: () => { nextTier: SubscriptionTier; price: number } | null;
  refresh: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuthStore();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);

  const loadSubscription = useCallback(async () => {
    if (!user?.id) {
      setTier('free');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('ws_subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .single();

    if (data && data.status === 'active') {
      setTier(data.tier as SubscriptionTier);
    } else {
      setTier('free');
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const features = TIER_FEATURES[tier];

  const canAccess = useCallback((feature: keyof TierFeatures): boolean => {
    const value = features[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    return false;
  }, [features]);

  const isWithinLimit = useCallback((current: number): boolean => {
    return current < features.maxListeners;
  }, [features.maxListeners]);

  const getUpgradeOffer = useCallback((): { nextTier: SubscriptionTier; price: number } | null => {
    const tiers: SubscriptionTier[] = ['free', 'creator', 'pro', 'business'];
    const currentIndex = tiers.indexOf(tier);
    if (currentIndex < tiers.length - 1) {
      const nextTier = tiers[currentIndex + 1];
      return { nextTier, price: TIER_PRICES[nextTier] };
    }
    return null;
  }, [tier]);

  return {
    tier,
    features,
    loading,
    canAccess,
    isWithinLimit,
    getUpgradeOffer,
    refresh: loadSubscription,
  };
}

export default useSubscription;
