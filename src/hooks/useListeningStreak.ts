/**
 * WhatsSound — useListeningStreak Hook
 * Tracks consecutive days of listening for gamification
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastListenDate: string | null;
}

interface UseListeningStreakReturn {
  streak: StreakData;
  loading: boolean;
  recordListen: () => Promise<void>;
  isNewStreak: boolean;
}

export function useListeningStreak(): UseListeningStreakReturn {
  const { user } = useAuthStore();
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastListenDate: null,
  });
  const [loading, setLoading] = useState(true);
  const [isNewStreak, setIsNewStreak] = useState(false);

  // Load current streak on mount
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from('ws_listening_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setStreak({
          currentStreak: data.current_streak || 0,
          longestStreak: data.longest_streak || 0,
          lastListenDate: data.last_listen_date,
        });
      }
      setLoading(false);
    })();
  }, [user?.id]);

  // Record a listening session
  const recordListen = useCallback(async () => {
    if (!user?.id) return;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // If already listened today, do nothing
    if (streak.lastListenDate === today) {
      return;
    }

    let newStreak = 1;
    let isConsecutive = false;

    // Check if it's a consecutive day
    if (streak.lastListenDate === yesterday) {
      newStreak = streak.currentStreak + 1;
      isConsecutive = true;
    }

    const newLongest = Math.max(newStreak, streak.longestStreak);

    // Upsert streak data
    const { error } = await supabase
      .from('ws_listening_streaks')
      .upsert({
        user_id: user.id,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_listen_date: today,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (!error) {
      setStreak({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastListenDate: today,
      });

      // Flag if this is a milestone
      if (newStreak > streak.currentStreak && [7, 30, 100].includes(newStreak)) {
        setIsNewStreak(true);
        setTimeout(() => setIsNewStreak(false), 5000);
      }

      console.log(`[Streak] ${isConsecutive ? 'Extended' : 'Started'} streak: ${newStreak} days`);
    }
  }, [user?.id, streak]);

  return { streak, loading, recordListen, isNewStreak };
}

/**
 * Get streak emoji based on days
 */
export function getStreakEmoji(days: number): string {
  if (days >= 100) return '💎';
  if (days >= 30) return '🔥';
  if (days >= 7) return '⚡';
  if (days >= 1) return '✨';
  return '🎵';
}

/**
 * Get streak label based on days
 */
export function getStreakLabel(days: number): string {
  if (days >= 100) return 'Leyenda';
  if (days >= 30) return 'En llamas';
  if (days >= 7) return 'En racha';
  if (days >= 1) return 'Activo';
  return 'Empieza tu racha';
}

export default useListeningStreak;
