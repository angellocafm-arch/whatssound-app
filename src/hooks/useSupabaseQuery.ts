/**
 * WhatsSound — Shared Supabase Query Hooks
 * Reusable patterns for sessions and profiles with seed filtering
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { shouldShowSeed } from '../lib/seed-filter';

export interface SessionData {
  id: string;
  name: string;
  dj_display_name: string;
  genre: string;
  listener_count: number;
  current_song: string;
  current_artist: string;
  current_cover?: string;
  started_at?: string;
  ended_at?: string;
  is_active?: boolean;
  duration?: string;
  peak_listeners?: number;
  total_songs?: number;
}

export interface ProfileData {
  id: string;
  display_name: string;
  dj_name?: string;
  username?: string;
  genre: string;
  followers?: string;
  is_dj: boolean;
  is_live?: boolean;
  avatar_color?: string;
}

/**
 * Load sessions with optional filtering
 */
export function useSessions(filter?: { active?: boolean }) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const showSeed = await shouldShowSeed();
      
      let query = supabase
        .from('ws_sessions')
        .select(`
          id, name, genres, is_active, started_at, ended_at, is_seed,
          dj:ws_profiles!dj_id(display_name, dj_name),
          songs:ws_songs(title, artist, status, cover_url, duration_ms),
          members:ws_session_members(id)
        `);

      if (!showSeed) {
        query = query.eq('is_seed', false);
      }

      if (filter?.active !== undefined) {
        query = query.eq('is_active', filter.active);
      }

      query = query.order('started_at', { ascending: false });

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      if (data) {
        const mapped = data.map((s: { id: string; name: string; dj?: { display_name?: string; dj_name?: string }; listener_count?: number; songs?: { status: string }[] }) => {
          const currentSong = s.songs?.find((song: { status: string }) => song.status === 'playing');
          
          // Calculate duration
          let duration = '';
          if (s.started_at) {
            const endTime = s.ended_at || (s.is_active ? new Date().toISOString() : s.started_at);
            const ms = new Date(endTime).getTime() - new Date(s.started_at).getTime();
            const hours = Math.floor(ms / 3600000);
            const minutes = Math.floor((ms % 3600000) / 60000);
            duration = s.is_active ? `${hours}h ${minutes}m en curso` : `${hours}h ${minutes}m`;
          }

          return {
            id: s.id,
            name: s.name,
            dj_display_name: s.dj?.dj_name || s.dj?.display_name || 'DJ',
            genre: s.genres?.[0] || 'Mix',
            listener_count: s.members?.length || 0,
            current_song: currentSong?.title || 'En pausa',
            current_artist: currentSong?.artist || '',
            current_cover: currentSong?.cover_url || '',
            started_at: s.started_at,
            ended_at: s.ended_at,
            is_active: s.is_active,
            duration,
            peak_listeners: s.members?.length || 0, // Could be enhanced with actual peak tracking
            total_songs: s.songs?.length || 0,
          };
        });
        
        setSessions(mapped);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError(err instanceof Error ? err.message : 'Error loading sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [filter?.active]);

  return { sessions, loading, error, refetch: loadSessions };
}

/**
 * Load profiles with optional DJ filtering
 */
export function useProfiles(filter?: { isDj?: boolean }) {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const showSeed = await shouldShowSeed();
      
      let query = supabase
        .from('ws_profiles')
        .select('id, display_name, dj_name, username, genres, is_dj, is_verified, is_seed');

      if (!showSeed) {
        query = query.eq('is_seed', false);
      }

      if (filter?.isDj !== undefined) {
        query = query.eq('is_dj', filter.isDj);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      if (data) {
        const colors = ['#25D366', '#53BDEB', '#FFA726', '#EF5350', '#AB47BC', '#26C6DA', '#66BB6A'];
        
        const mapped = data.map((p: { id: string; display_name?: string; dj_name?: string; is_dj?: boolean; golden_boosts_received?: number }, index: number) => ({
          id: p.id,
          display_name: p.display_name,
          dj_name: p.dj_name,
          username: p.username,
          genre: p.genres?.[0] || 'Mix',
          followers: p.is_verified ? '2.3K' : '500+',
          is_dj: p.is_dj,
          is_live: false, // Could be enhanced with real-time status
          avatar_color: colors[index % colors.length],
        }));
        
        setProfiles(mapped);
      }
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError(err instanceof Error ? err.message : 'Error loading profiles');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [filter?.isDj]);

  return { profiles, loading, error, refetch: loadProfiles };
}

/**
 * Helper hook for combined session stats
 */
export function useSessionStats() {
  const { sessions, loading } = useSessions({ active: true });
  
  const totalSessions = sessions.length;
  const totalListeners = sessions.reduce((sum, s) => sum + s.listener_count, 0);
  
  return {
    totalSessions,
    totalListeners,
    loading,
    topSession: sessions[0] || null
  };
}