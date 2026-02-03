/**
 * WhatsSound — Seed Data Filter
 * Checks ws_admin_settings to determine if seed data should be shown.
 * Used by all screens that query Supabase.
 */

import { supabase } from './supabase';

let _seedVisible: boolean | null = null;
let _lastCheck = 0;
const CACHE_MS = 30000; // Check every 30s

export async function shouldShowSeed(): Promise<boolean> {
  const now = Date.now();
  if (_seedVisible !== null && now - _lastCheck < CACHE_MS) return _seedVisible;
  
  try {
    const { data } = await supabase
      .from('ws_admin_settings')
      .select('value')
      .eq('key', 'seed_visible')
      .single();
    _seedVisible = data?.value !== 'false';
  } catch {
    _seedVisible = true; // Default: show seed
  }
  _lastCheck = now;
  return _seedVisible;
}

/**
 * Invalidate the cache (call after toggling visibility)
 */
export function invalidateSeedCache() {
  _seedVisible = null;
  _lastCheck = 0;
}
