/**
 * WhatsSound — Demo Mode Manager
 * 
 * 2 modos:
 * 1. ?demo=true (default) → INVERSORES: mockups, datos bonitos, bypass auth
 * 2. ?demo=false          → PRUEBAS: tiempo real, número ficticio funciona, flujo completo
 * 
 * URLs fijas:
 * - Inversores: whatssound-app.vercel.app (default)
 * - Pruebas: whatssound-app.vercel.app?demo=false
 * - Dashboard: whatssound-app.vercel.app/admin
 */

import { Platform } from 'react-native';

let _isDemoMode: boolean | null = null;

// ─── Demo user for investor mode ─────────────────────────────

export const DEMO_USER = {
  id: 'demo-user-investor-001',
  display_name: 'Usuario Demo',
  username: 'demo_user',
  avatar_url: null,
  is_dj: false,
};

export const DEMO_DJ = {
  id: 'demo-dj-investor-001',
  display_name: 'DJ Demo',
  username: 'dj_demo',
  avatar_url: null,
  is_dj: true,
  dj_name: 'DJ Demo',
};

// ─── Mode detection ─────────────────────────────────────────

function _detectMode() {
  if (Platform.OS === 'web') {
    try {
      const params = new URLSearchParams(window.location.search);
      
      // Explicit demo parameter
      if (params.has('demo')) {
        _isDemoMode = params.get('demo') !== 'false';
        localStorage.setItem('ws_demo_mode', _isDemoMode ? 'true' : 'false');
        return;
      }
      
      // Check localStorage (sticky session)
      const storedDemo = localStorage.getItem('ws_demo_mode');
      if (storedDemo !== null) {
        _isDemoMode = storedDemo === 'true';
        return;
      }
    } catch {}
  }

  // Default: demo mode ON (para inversores)
  _isDemoMode = true;
}

export function isDemoMode(): boolean {
  if (_isDemoMode === null) _detectMode();
  return _isDemoMode!;
}

export function setDemoMode(enabled: boolean) {
  _isDemoMode = enabled;
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem('ws_demo_mode', enabled ? 'true' : 'false');
    } catch {}
  }
}

export function clearDemoMode() {
  _isDemoMode = null;
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem('ws_demo_mode');
    } catch {}
  }
}

/**
 * Check if phone number is valid for test mode
 * In test mode (demo=false), any 9+ digit number works
 */
export function isTestPhone(phone: string): boolean {
  if (isDemoMode()) return false; // En modo demo no hay login real
  const cleanPhone = phone.replace(/\s/g, '');
  return cleanPhone.length >= 9;
}

/**
 * For login flow - marks that user needs to create profile
 */
export function markNeedsProfile(phone: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem('ws_pending_phone', phone);
      localStorage.setItem('ws_needs_profile', 'true');
    } catch {}
  }
}

export function clearNeedsProfile() {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem('ws_pending_phone');
      localStorage.removeItem('ws_needs_profile');
    } catch {}
  }
}

export function getNeedsProfile(): boolean {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem('ws_needs_profile') === 'true';
    } catch {}
  }
  return false;
}

export function getPendingPhone(): string | null {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem('ws_pending_phone');
    } catch {}
  }
  return null;
}

// ─── Deprecated functions (mantener por compatibilidad) ─────

/** @deprecated Use isDemoMode() instead */
export function isTestMode(): boolean {
  return !isDemoMode();
}

/** @deprecated No longer used */
export function getTestUserName(): string | null {
  return null;
}

/** @deprecated No longer used */
export async function getOrCreateTestUser(): Promise<null> {
  return null;
}

/** @deprecated Use markNeedsProfile instead */
export function enableTestModeForPhone(phone: string) {
  markNeedsProfile(phone);
}

/** @deprecated Use clearNeedsProfile instead */
export function clearTestNeedsProfile() {
  clearNeedsProfile();
}
