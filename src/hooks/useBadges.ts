/**
 * WhatsSound — useBadges Hook
 * Manages user badges and achievements
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: string;
    count?: number;
    days?: number;
    active?: boolean;
  };
}

export interface UserBadge extends Badge {
  earnedAt: string;
}

interface UseBadgesReturn {
  allBadges: Badge[];
  earnedBadges: UserBadge[];
  loading: boolean;
  checkAndAward: (type: string, value: number) => Promise<Badge | null>;
  hasBadge: (badgeName: string) => boolean;
}

export function useBadges(): UseBadgesReturn {
  const { user } = useAuthStore();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all badges and user's earned badges
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    (async () => {
      // Get all badges
      const { data: badges } = await supabase
        .from('ws_badges')
        .select('*')
        .order('name');

      if (badges) {
        setAllBadges(badges.map(b => ({
          id: b.id,
          name: b.name,
          description: b.description,
          icon: b.icon,
          requirement: b.requirement,
        })));
      }

      // Get user's earned badges
      const { data: userBadges } = await supabase
        .from('ws_user_badges')
        .select('*, badge:ws_badges(*)')
        .eq('user_id', user.id);

      if (userBadges) {
        setEarnedBadges(userBadges.map(ub => ({
          id: ub.badge.id,
          name: ub.badge.name,
          description: ub.badge.description,
          icon: ub.badge.icon,
          requirement: ub.badge.requirement,
          earnedAt: ub.earned_at,
        })));
      }

      setLoading(false);
    })();
  }, [user?.id]);

  // Check if user qualifies for a badge and award it
  const checkAndAward = useCallback(async (type: string, value: number): Promise<Badge | null> => {
    if (!user?.id) return null;

    // Find badges that match this type
    const matchingBadges = allBadges.filter(b => b.requirement.type === type);
    
    for (const badge of matchingBadges) {
      // Check if already earned
      if (earnedBadges.some(eb => eb.id === badge.id)) continue;

      // Check requirement
      const requiredValue = badge.requirement.count || badge.requirement.days || (badge.requirement.active ? 1 : 0);
      if (value >= requiredValue) {
        // Award badge
        const { error } = await supabase
          .from('ws_user_badges')
          .insert({
            user_id: user.id,
            badge_id: badge.id,
          });

        if (!error) {
          const newBadge: UserBadge = {
            ...badge,
            earnedAt: new Date().toISOString(),
          };
          setEarnedBadges(prev => [...prev, newBadge]);
          console.log(`[Badges] Awarded: ${badge.name} ${badge.icon}`);
          return badge;
        }
      }
    }
    
    return null;
  }, [user?.id, allBadges, earnedBadges]);

  // Check if user has a specific badge
  const hasBadge = useCallback((badgeName: string): boolean => {
    return earnedBadges.some(b => b.name === badgeName);
  }, [earnedBadges]);

  return { allBadges, earnedBadges, loading, checkAndAward, hasBadge };
}

export default useBadges;
