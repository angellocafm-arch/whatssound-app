/**
 * WhatsSound — Demo Mode Manager
 * 
 * ?demo=true → bypass auth, mock data, no account needed
 * Without param → real auth, real Supabase data
 * 
 * For investor demos: just share URL with ?demo=true
 * For testing: use real auth flow
 */

import { Platform } from 'react-native';

let _isDemoMode: boolean | null = null;

/**
 * Check if app is running in demo mode.
 * On web: checks URL param ?demo=true or localStorage fallback
 * On native: checks env var or defaults to true for now
 */
export function isDemoMode(): boolean {
  if (_isDemoMode !== null) return _isDemoMode;

  if (Platform.OS === 'web') {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('demo')) {
        _isDemoMode = params.get('demo') !== 'false';
        localStorage.setItem('ws_demo_mode', _isDemoMode ? 'true' : 'false');
        return _isDemoMode;
      }
      // Check localStorage (sticky after first visit with ?demo=true)
      const stored = localStorage.getItem('ws_demo_mode');
      if (stored !== null) {
        _isDemoMode = stored === 'true';
        return _isDemoMode;
      }
    } catch {}
  }

  // Default: demo mode ON (for investor demos)
  _isDemoMode = true;
  return _isDemoMode;
}

/**
 * Force set demo mode (useful for settings toggle)
 */
export function setDemoMode(enabled: boolean) {
  _isDemoMode = enabled;
  if (Platform.OS === 'web') {
    try { localStorage.setItem('ws_demo_mode', enabled ? 'true' : 'false'); } catch {}
  }
}

/**
 * Demo user profile (bypasses auth)
 */
export const DEMO_USER = {
  id: 'a0000001-0000-0000-0000-000000000001', // María García
  display_name: 'María García',
  username: 'mariagarcia',
  avatar_url: null,
  is_dj: false,
};

/**
 * Demo DJ profile
 */
export const DEMO_DJ = {
  id: 'd0000001-0000-0000-0000-000000000001', // DJ Carlos Madrid
  display_name: 'DJ Carlos Madrid',
  username: 'carlosmadrid',
  dj_name: 'DJ Carlos Madrid',
  is_dj: true,
};
