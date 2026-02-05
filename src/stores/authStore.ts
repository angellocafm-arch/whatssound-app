/**
 * WhatsSound — Auth Store (Zustand)
 * Maneja el estado de autenticación con Supabase
 */

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { AUTH_STORAGE_KEY } from '../utils/supabase-config';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  is_dj: boolean;
  is_verified: boolean;
  dj_name: string | null;
  genres: string[];
  role: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      // First try to restore session from localStorage (no network call)
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(AUTH_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.access_token && parsed.user && parsed.expires_at > Date.now() / 1000) {
              // Restore session immediately from localStorage
              set({ user: parsed.user, session: parsed as any, initialized: true });
              // Set Supabase session in background (non-blocking, with timeout)
              const setSessionWithTimeout = Promise.race([
                supabase.auth.setSession({
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token,
                }),
                new Promise(r => setTimeout(r, 3000)),
              ]);
              setSessionWithTimeout.then((result: { data?: { session?: unknown } }) => {
                if (result?.data?.session) {
                  set({ user: result.data.session.user, session: result.data.session });
                }
              }).catch(() => {});
              get().fetchProfile().catch(() => {});
              // Listen for auth changes
              supabase.auth.onAuthStateChange(async (event, session) => {
                set({ user: session?.user ?? null, session });
                if (session?.user) await get().fetchProfile();
                else set({ profile: null });
              });
              return;
            }
          }
        } catch {}
      }

      // Fallback: standard getSession with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Auth init timeout')), 5000)
      );
      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
      if (session) {
        set({ user: session.user, session });
        await get().fetchProfile();
      }
    } catch (e) {
      console.error('Auth init error:', e);
    } finally {
      set({ initialized: true });

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        set({ user: session?.user ?? null, session });
        if (session?.user) {
          await get().fetchProfile();
        } else {
          set({ profile: null });
        }
      });
    }
  },

  signInWithEmail: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    return { error: error?.message ?? null };
  },

  signUp: async (email, password, displayName) => {
    set({ loading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    set({ loading: false });
    return { error: error?.message ?? null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null });
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      set({ profile: data as Profile });
    }
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) return { error: 'No user' };

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (!error) {
      await get().fetchProfile();
    }
    return { error: error?.message ?? null };
  },

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
}));
