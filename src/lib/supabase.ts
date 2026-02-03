/**
 * WhatsSound — Supabase Client
 */

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// Use localStorage on web, AsyncStorage on native
const storage = Platform.OS === 'web'
  ? {
      getItem: (key: string) => {
        try { return Promise.resolve(localStorage.getItem(key)); }
        catch { return Promise.resolve(null); }
      },
      setItem: (key: string, value: string) => {
        try { localStorage.setItem(key, value); return Promise.resolve(); }
        catch { return Promise.resolve(); }
      },
      removeItem: (key: string) => {
        try { localStorage.removeItem(key); return Promise.resolve(); }
        catch { return Promise.resolve(); }
      },
    }
  : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: false,  // Disabled — causes hangs on slow networks (China)
    persistSession: true,
    detectSessionInUrl: false,
  },
});
