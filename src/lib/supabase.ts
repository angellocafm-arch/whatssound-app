/**
 * WhatsSound — Supabase Client
 */

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hardcoded - NO usar variables de entorno, Vercel no las procesa bien con Expo
const supabaseUrl = 'https://xyehncvvvprrqwnsefcr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTA4OTgsImV4cCI6MjA4NTIyNjg5OH0.VEaTmqpMA7XdUa-tZ7mXib1ciweD7y5UU4dFGZq3EtQ';

// Log para debug
if (typeof console !== 'undefined') {
  console.log('[Supabase] URL:', supabaseUrl);
}

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
