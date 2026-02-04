/**
 * WhatsSound — useReferrals Hook
 * Manages referral system for viral growth
 */

import { useEffect, useState, useCallback } from 'react';
import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

// Generate 6-char alphanumeric code
const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export interface Referral {
  id: string;
  referredId: string | null;
  status: 'pending' | 'completed' | 'rewarded';
  createdAt: string;
  completedAt: string | null;
}

interface UseReferralsReturn {
  /** User's unique referral code */
  myCode: string | null;
  /** List of referrals made by this user */
  referrals: Referral[];
  /** Count of completed referrals */
  completedCount: number;
  /** Is loading data? */
  loading: boolean;
  /** Generate/get user's referral code */
  getOrCreateCode: () => Promise<string>;
  /** Share referral link via native share */
  shareReferral: () => Promise<void>;
  /** Copy referral link to clipboard */
  copyToClipboard: () => Promise<void>;
  /** Validate and apply a referral code (for new users) */
  applyReferralCode: (code: string) => Promise<boolean>;
  /** Get full referral URL */
  getReferralUrl: () => string;
}

export function useReferrals(): UseReferralsReturn {
  const { user } = useAuthStore();
  const [myCode, setMyCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user's referral code and referrals
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    (async () => {
      // Get user's referral code from profile
      const { data: profile } = await supabase
        .from('ws_profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (profile?.referral_code) {
        setMyCode(profile.referral_code);
      }

      // Get referrals made by this user
      const { data: refs } = await supabase
        .from('ws_referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (refs) {
        setReferrals(refs.map(r => ({
          id: r.id,
          referredId: r.referred_id,
          status: r.status,
          createdAt: r.created_at,
          completedAt: r.completed_at,
        })));
      }

      setLoading(false);
    })();
  }, [user?.id]);

  // Get or create referral code
  const getOrCreateCode = useCallback(async (): Promise<string> => {
    if (!user?.id) throw new Error('Not authenticated');
    
    if (myCode) return myCode;

    // Generate new code
    let code = generateCode();
    let attempts = 0;
    
    // Ensure uniqueness
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('ws_profiles')
        .select('id')
        .eq('referral_code', code)
        .single();

      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    // Save to profile
    const { error } = await supabase
      .from('ws_profiles')
      .update({ referral_code: code })
      .eq('id', user.id);

    if (!error) {
      setMyCode(code);
      console.log('[Referrals] Created code:', code);
    }

    return code;
  }, [user?.id, myCode]);

  // Get referral URL
  const getReferralUrl = useCallback((): string => {
    const code = myCode || 'XXXXXX';
    // Web URL that handles deep linking
    return `https://whatssound-app.vercel.app/join?code=${code}`;
  }, [myCode]);

  // Share via native share sheet
  const shareReferral = useCallback(async () => {
    const code = await getOrCreateCode();
    const url = `https://whatssound-app.vercel.app/join?code=${code}`;
    
    try {
      await Share.share({
        message: `¡Únete a WhatsSound y escuchemos música juntos! 🎵\n\nUsa mi código: ${code}\n\n${url}`,
        url: Platform.OS === 'ios' ? url : undefined,
        title: 'Invitar a WhatsSound',
      });
    } catch (error) {
      console.error('[Referrals] Share error:', error);
    }
  }, [getOrCreateCode]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    const code = await getOrCreateCode();
    const url = `https://whatssound-app.vercel.app/join?code=${code}`;
    await Clipboard.setStringAsync(url);
    console.log('[Referrals] Copied to clipboard');
  }, [getOrCreateCode]);

  // Apply a referral code (for new users during onboarding)
  const applyReferralCode = useCallback(async (code: string): Promise<boolean> => {
    if (!user?.id) return false;

    // Find the referrer by code
    const { data: referrer } = await supabase
      .from('ws_profiles')
      .select('id')
      .eq('referral_code', code.toUpperCase())
      .single();

    if (!referrer) {
      console.log('[Referrals] Invalid code:', code);
      return false;
    }

    // Don't allow self-referral
    if (referrer.id === user.id) {
      console.log('[Referrals] Cannot self-refer');
      return false;
    }

    // Create completed referral
    const { error } = await supabase
      .from('ws_referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: user.id,
        referral_code: code.toUpperCase(),
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

    if (!error) {
      console.log('[Referrals] Applied code from:', referrer.id);
      // TODO: Award badges/rewards here
      return true;
    }

    return false;
  }, [user?.id]);

  const completedCount = referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length;

  return {
    myCode,
    referrals,
    completedCount,
    loading,
    getOrCreateCode,
    shareReferral,
    copyToClipboard,
    applyReferralCode,
    getReferralUrl,
  };
}

export default useReferrals;
