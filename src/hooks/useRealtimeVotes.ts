/**
 * WhatsSound — Realtime Votes Hook
 * Subscribes to ws_songs vote_count changes via Supabase Realtime
 * Queue reorders in real-time as users vote
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { isDemoMode, isTestMode } from '../lib/demo';

export interface QueueSong {
  id: string;
  title: string;
  artist: string;
  vote_count: number;
  status: string;
  requester: string;
  duration_ms: number;
}

export function useRealtimeVotes(sessionId: string) {
  const [songs, setSongs] = useState<QueueSong[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial queue
  useEffect(() => {
    if (!sessionId || (isDemoMode() && !isTestMode())) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from('ws_songs')
        .select('*, requester:ws_profiles!user_id(display_name)')
        .eq('session_id', sessionId)
        .in('status', ['pending', 'queued', 'playing'])
        .order('vote_count', { ascending: false });

      if (data) {
        setSongs(data.map((s: { id: string; title: string; artist: string; votes?: number; status?: string }) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          vote_count: s.vote_count,
          status: s.status,
          requester: s.requester?.display_name || '??',
          duration_ms: s.duration_ms,
        })));
      }
      setLoading(false);
    })();
  }, [sessionId]);

  // Subscribe to realtime updates on vote_count
  useEffect(() => {
    if (!sessionId || (isDemoMode() && !isTestMode())) return;

    const channel = supabase
      .channel(`votes:${sessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ws_songs',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        const updated = payload.new as any;
        setSongs(prev => {
          const newSongs = prev.map(s =>
            s.id === updated.id
              ? { ...s, vote_count: updated.vote_count, status: updated.status }
              : s
          );
          // Re-sort by votes
          return newSongs.sort((a, b) => b.vote_count - a.vote_count);
        });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ws_songs',
        filter: `session_id=eq.${sessionId}`,
      }, async (payload) => {
        const newSong = payload.new as any;
        const { data: requester } = await supabase
          .from('ws_profiles')
          .select('display_name')
          .eq('id', newSong.user_id)
          .single();

        setSongs(prev => [...prev, {
          id: newSong.id,
          title: newSong.title,
          artist: newSong.artist,
          vote_count: newSong.vote_count,
          status: newSong.status,
          requester: requester?.display_name || '??',
          duration_ms: newSong.duration_ms,
        }].sort((a, b) => b.vote_count - a.vote_count));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { songs, loading };
}
