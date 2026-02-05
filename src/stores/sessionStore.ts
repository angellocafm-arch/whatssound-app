/**
 * WhatsSound — Session Store (Zustand)
 * Maneja sesiones musicales en vivo con Supabase
 */

import { create } from 'zustand';
import { 
  SUPABASE_URL, 
  SUPABASE_ANON_KEY,
  AUTH_STORAGE_KEY,
  getAuthData 
} from '../utils/supabase-config';

function getLocalUser(): { user: { id: string; email?: string }; accessToken: string } | null {
  const auth = getAuthData();
  if (auth?.user && auth?.access_token) {
    return { user: auth.user, accessToken: auth.access_token };
  }
  return null;
}

async function supabaseRestPost(table: string, body: Record<string, unknown>, accessToken: string): Promise<{ data: unknown; error: unknown }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return { data: null, error: { message: data.message || JSON.stringify(data) } };
    return { data: Array.isArray(data) ? data[0] : data, error: null };
  } catch (e: unknown) {
    return { data: null, error: { message: e.message } };
  }
}

export interface MusicSession {
  id: string;
  dj_id: string;
  name: string;
  genre: string | null;
  status: 'live' | 'ended' | 'scheduled';
  listener_count: number;
  max_listeners: number;
  current_song: string | null;
  current_artist: string | null;
  started_at: string;
  ended_at: string | null;
  // joined from profiles
  dj_name?: string;
  dj_display_name?: string;
}

export interface QueueItem {
  id: string;
  session_id: string;
  requested_by: string;
  song_name: string;
  artist: string;
  votes: number;
  status: 'pending' | 'playing' | 'played' | 'rejected';
  created_at: string;
  requester_name?: string;
}

interface SessionState {
  sessions: MusicSession[];
  currentSession: MusicSession | null;
  queue: QueueItem[];
  loading: boolean;

  fetchLiveSessions: () => Promise<void>;
  fetchSession: (id: string) => Promise<void>;
  createSession: (name: string, genre: string) => Promise<{ id: string | null; error: string | null }>;
  endSession: (id: string) => Promise<void>;
  fetchQueue: (sessionId: string) => Promise<void>;
  requestSong: (sessionId: string, songName: string, artist: string) => Promise<{ error: string | null }>;
  voteSong: (queueId: string) => Promise<{ error: string | null }>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSession: null,
  queue: [],
  loading: false,

  fetchLiveSessions: async () => {
    set({ loading: true });
    try {
      const local = getLocalUser();
      const headers: Record<string, string> = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${local?.accessToken || SUPABASE_ANON_KEY}`,
      };
      const url = `${SUPABASE_URL}/rest/v1/sessions?status=eq.live&genre=not.in.(%22Chat%22,%22Group%22)&order=started_at.desc&select=*,profiles!sessions_dj_id_fkey(display_name,username)`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const sessions = data.map((s: { id: string; name: string; is_active: boolean; dj?: { dj_name?: string }; songs?: { status: string }[] }) => ({
          ...s,
          dj_display_name: s.profiles?.display_name,
          dj_name: s.profiles?.username,
          current_song: s.current_song?.startsWith('{') ? null : s.current_song,
        }));
        set({ sessions });
      }
    } catch (e) {
      console.warn('fetchLiveSessions error:', e);
    }
    set({ loading: false });
  },

  fetchSession: async (id) => {
    try {
      const local = getLocalUser();
      const headers: Record<string, string> = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${local?.accessToken || SUPABASE_ANON_KEY}`,
      };
      const url = `${SUPABASE_URL}/rest/v1/sessions?id=eq.${id}&select=*,profiles!sessions_dj_id_fkey(display_name,username)&limit=1`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          set({
            currentSession: {
              ...data[0],
              dj_display_name: data[0].profiles?.display_name,
              dj_name: data[0].profiles?.username,
            } as MusicSession,
          });
        }
      }
    } catch (e) {
      console.warn('fetchSession error:', e);
    }
  },

  createSession: async (name, genre) => {
    const local = getLocalUser();
    if (!local) return { id: null, error: 'No autenticado' };

    const { data, error } = await supabaseRestPost('sessions', {
      dj_id: local.user.id, name, genre, status: 'live',
    }, local.accessToken);

    if (error) return { id: null, error: error.message };
    return { id: data.id, error: null };
  },

  endSession: async (id) => {
    const local = getLocalUser();
    if (!local) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${local.accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ status: 'ended', ended_at: new Date().toISOString() }),
      });
    } catch (e) {
      console.warn('endSession error:', e);
    }
    set({ currentSession: null });
    await get().fetchLiveSessions();
  },

  fetchQueue: async (sessionId) => {
    try {
      const local = getLocalUser();
      const headers: Record<string, string> = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${local?.accessToken || SUPABASE_ANON_KEY}`,
      };
      const url = `${SUPABASE_URL}/rest/v1/queue?session_id=eq.${sessionId}&order=votes.desc,created_at.asc&select=*,profiles!queue_requested_by_fkey(display_name)`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const queue = data.map((q: { id: string; title: string; artist: string; album_art?: string; votes?: number; status?: string; requested_by?: string }) => ({
          ...q,
          requester_name: q.profiles?.display_name,
        }));
        set({ queue });
      }
    } catch (e) {
      console.warn('fetchQueue error:', e);
    }
  },

  requestSong: async (sessionId, songName, artist) => {
    const local = getLocalUser();
    if (!local) return { error: 'No autenticado' };

    const { error } = await supabaseRestPost('queue', {
      session_id: sessionId, requested_by: local.user.id, song_name: songName, artist,
    }, local.accessToken);

    if (!error) await get().fetchQueue(sessionId);
    return { error: error?.message ?? null };
  },

  voteSong: async (queueId) => {
    const local = getLocalUser();
    if (!local) return { error: 'No autenticado' };

    // Insert vote
    const { error: voteError } = await supabaseRestPost('votes', {
      user_id: local.user.id, queue_id: queueId,
    }, local.accessToken);

    if (voteError) return { error: voteError.message };

    // Increment vote count via proxy API
    const item = get().queue.find(q => q.id === queueId);
    if (item) {
      try {
        await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queueId }),
        });
      } catch (e) {
        console.warn('vote update error:', e);
      }
    }

    // Refresh queue
    if (get().currentSession) {
      await get().fetchQueue(get().currentSession!.id);
    }
    return { error: null };
  },
}));
