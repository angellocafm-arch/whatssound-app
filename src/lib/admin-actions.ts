/**
 * WhatsSound — Admin Actions
 * 3 buttons for data management:
 * 1. Show/Hide seed data
 * 2. Delete ALL data (nuclear reset)
 * 3. Delete test data only (keep seed)
 */

import { supabase } from './supabase';

// ─── 1. Toggle Seed Data Visibility ─────────────────────

export async function isSeedVisible(): Promise<boolean> {
  const { data } = await supabase
    .from('ws_admin_settings')
    .select('value')
    .eq('key', 'seed_visible')
    .single();
  return data?.value !== 'false';
}

export async function toggleSeedVisibility(visible: boolean): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('ws_admin_settings')
    .upsert({ key: 'seed_visible', value: visible ? 'true' : 'false', updated_at: new Date().toISOString() });
  
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── 2. Delete Test Data (keep seed) ────────────────────

export async function deleteTestData(): Promise<{ ok: boolean; deleted: number; error?: string }> {
  let deleted = 0;
  
  try {
    // Delete in order (respect FK constraints)
    // 1. Reactions from test messages
    // 2. Votes from test users  
    // 3. Now playing for test sessions
    // 4. Messages from test users
    // 5. Tips from test users
    // 6. Songs from test users
    // 7. Session members that are test users
    // 8. Follows from test users
    // 9. User settings for test users
    // 10. Test profiles

    // Delete test user votes
    const { count: c1 } = await supabase.from('ws_votes')
      .delete({ count: 'exact' })
      .filter('user_id', 'not.like', 'd0000001%')
      .filter('user_id', 'not.like', 'a0000001%');
    deleted += c1 || 0;

    // Delete test user messages  
    const { count: c2 } = await supabase.from('ws_messages')
      .delete({ count: 'exact' })
      .eq('is_seed', false);
    deleted += c2 || 0;

    // Delete test tips
    const { count: c3 } = await supabase.from('ws_tips')
      .delete({ count: 'exact' })
      .eq('is_seed', false);
    deleted += c3 || 0;

    // Delete test songs
    const { count: c4 } = await supabase.from('ws_songs')
      .delete({ count: 'exact' })
      .eq('is_seed', false);
    deleted += c4 || 0;

    // Delete test session members
    const { count: c5 } = await supabase.from('ws_session_members')
      .delete({ count: 'exact' })
      .eq('is_seed', false);
    deleted += c5 || 0;

    // Delete test follows
    const { count: c6 } = await supabase.from('ws_follows')
      .delete({ count: 'exact' })
      .eq('is_seed', false);
    deleted += c6 || 0;

    // Delete test user settings
    const { count: c7 } = await supabase.from('ws_user_settings')
      .delete({ count: 'exact' })
      .eq('is_seed', false);
    deleted += c7 || 0;

    // Delete test sessions (non-seed)
    const { count: c8 } = await supabase.from('ws_sessions')
      .delete({ count: 'exact' })
      .eq('is_seed', false);
    deleted += c8 || 0;

    // Delete test profiles
    const { count: c9 } = await supabase.from('ws_profiles')
      .delete({ count: 'exact' })
      .eq('is_seed', false);
    deleted += c9 || 0;

    return { ok: true, deleted };
  } catch (e: any) {
    return { ok: false, deleted, error: e.message };
  }
}

// ─── 3. Delete ALL Data (nuclear) ───────────────────────

export async function deleteAllData(): Promise<{ ok: boolean; deleted: number; error?: string }> {
  let deleted = 0;

  try {
    // Delete everything in order
    const tables = [
      'ws_reactions', 'ws_votes', 'ws_now_playing', 'ws_messages',
      'ws_tips', 'ws_songs', 'ws_session_members', 'ws_follows',
      'ws_user_settings', 'ws_reports', 'ws_sessions', 'ws_profiles',
    ];

    for (const table of tables) {
      const { count } = await supabase.from(table).delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000');
      deleted += count || 0;
    }

    return { ok: true, deleted };
  } catch (e: any) {
    return { ok: false, deleted, error: e.message };
  }
}

// ─── Get current data counts ────────────────────────────

export async function getDataCounts(): Promise<{ seed: number; test: number; total: number }> {
  const { count: seed } = await supabase.from('ws_profiles').select('*', { count: 'exact', head: true }).eq('is_seed', true);
  const { count: test } = await supabase.from('ws_profiles').select('*', { count: 'exact', head: true }).eq('is_seed', false);
  return { seed: seed || 0, test: test || 0, total: (seed || 0) + (test || 0) };
}
