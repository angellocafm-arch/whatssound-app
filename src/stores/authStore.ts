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
  is_admin?: boolean;
  phone?: string;
  dj_bio?: string;
  dj_avatar_url?: string | null;
  music_service?: string;
  music_service_id?: string;
  /** @deprecated Derived from is_dj/is_admin — old 'profiles' table compat */
  role?: string;
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
  signInWithOtp: (phone: string) => Promise<{ error: string | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: string | null; isNewUser?: boolean }>;
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

  signInWithOtp: async (phone: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      set({ loading: false });
      return { error: error?.message ?? null };
    } catch (e: unknown) {
      set({ loading: false });
      return { error: 'Error al enviar el código SMS. Inténtalo de nuevo.' };
    }
  },

  verifyOtp: async (phone: string, token: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) {
        set({ loading: false });
        return { error: error.message };
      }

      if (data.user) {
        set({ user: data.user, session: data.session });

        // Check if user has an existing profile
        const { data: profile, error: profileError } = await supabase
          .from('ws_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile && !profileError) {
          const typedProfile = profile as Profile;
          if (!typedProfile.role) {
            typedProfile.role = typedProfile.is_admin ? 'admin' : typedProfile.is_dj ? 'dj' : 'user';
          }
          set({ profile: typedProfile, loading: false });
          return { error: null, isNewUser: false };
        }

        set({ loading: false });
        return { error: null, isNewUser: true };
      }

      set({ loading: false });
      return { error: 'No se pudo verificar el código.' };
    } catch (e: unknown) {
      set({ loading: false });
      return { error: 'Error de verificación. Inténtalo de nuevo.' };
    }
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
      .from('ws_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      // Derive legacy 'role' field from ws_profiles booleans
      const profile = data as Profile;
      if (!profile.role) {
        profile.role = profile.is_admin ? 'admin' : profile.is_dj ? 'dj' : 'user';
      }
      set({ profile });
    }
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) return { error: 'No user' };

    const { error } = await supabase
      .from('ws_profiles')
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
