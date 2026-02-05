/**
 * WhatsSound — Reactions System
 * Reacciones en tiempo real conectadas a Supabase
 */

import { supabase } from './supabase';
import { isTestMode, getOrCreateTestUser } from './demo';

// Emojis disponibles
export const REACTION_EMOJIS = ['🔥', '❤️', '🎵', '🙌', '👏', '😂', '💀', '🤠', '🎤', '🎹', '🥁', '🎸'];

export interface Reaction {
  id: string;
  session_id: string;
  song_id?: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionCount {
  emoji: string;
  count: number;
  userReacted: boolean;
}

// ─── Send Reaction ─────────────────────────────────────────

export async function sendReaction(params: {
  sessionId: string;
  songId?: string;
  emoji: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { sessionId, songId, emoji } = params;

  if (!REACTION_EMOJIS.includes(emoji)) {
    return { ok: false, error: 'Emoji no válido' };
  }

  // Obtener user id
  let userId: string;
  
  if (isTestMode()) {
    const testProfile = await getOrCreateTestUser();
    if (!testProfile) {
      return { ok: false, error: 'No se pudo obtener usuario' };
    }
    userId = testProfile.id;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: 'Debes iniciar sesión' };
    }
    userId = user.id;
  }

  // Verificar si ya reaccionó con este emoji
  const { data: existing } = await supabase
    .from('ws_reactions')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
    // Ya existe, eliminar (toggle)
    const { error } = await supabase
      .from('ws_reactions')
      .delete()
      .eq('id', existing.id);

    if (error) {
      return { ok: false, error: 'Error al quitar reacción' };
    }
    return { ok: true };
  }

  // Crear nueva reacción
  const { error } = await supabase
    .from('ws_reactions')
    .insert({
      session_id: sessionId,
      song_id: songId || null,
      user_id: userId,
      emoji,
    });

  if (error) {
    console.error('Error sending reaction:', error);
    return { ok: false, error: 'Error al enviar reacción' };
  }

  return { ok: true };
}

// ─── Get Reaction Counts ───────────────────────────────────

export async function getReactionCounts(
  sessionId: string,
  currentUserId?: string
): Promise<ReactionCount[]> {
  // Obtener todas las reacciones de la sesión
  const { data: reactions, error } = await supabase
    .from('ws_reactions')
    .select('emoji, user_id')
    .eq('session_id', sessionId);

  if (error || !reactions) {
    return REACTION_EMOJIS.map(emoji => ({ emoji, count: 0, userReacted: false }));
  }

  // Contar por emoji
  const counts = new Map<string, { count: number; userReacted: boolean }>();
  
  REACTION_EMOJIS.forEach(emoji => {
    counts.set(emoji, { count: 0, userReacted: false });
  });

  reactions.forEach((r: { emoji: string }) => {
    const current = counts.get(r.emoji) || { count: 0, userReacted: false };
    counts.set(r.emoji, {
      count: current.count + 1,
      userReacted: current.userReacted || r.user_id === currentUserId,
    });
  });

  return REACTION_EMOJIS.map(emoji => ({
    emoji,
    ...(counts.get(emoji) || { count: 0, userReacted: false }),
  }));
}

// ─── Subscribe to Reactions ────────────────────────────────

export function subscribeToReactions(
  sessionId: string,
  callback: (counts: ReactionCount[], currentUserId?: string) => void,
  currentUserId?: string
): () => void {
  // Cargar inicial
  getReactionCounts(sessionId, currentUserId).then(callback);

  // Suscribirse a cambios
  const channel = supabase
    .channel(`reactions:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'ws_reactions',
        filter: `session_id=eq.${sessionId}`,
      },
      () => {
        // Recargar counts cuando hay cambio
        getReactionCounts(sessionId, currentUserId).then(counts => callback(counts, currentUserId));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Get Recent Reactions (for animation) ──────────────────

export async function getRecentReactions(
  sessionId: string,
  limit = 10
): Promise<Array<{ emoji: string; userName: string }>> {
  const { data, error } = await supabase
    .from('ws_reactions')
    .select('emoji, user:ws_profiles!user_id(display_name)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((r: { id: string; emoji: string; user_id: string; created_at: string }) => ({
    emoji: r.emoji,
    userName: r.user?.display_name || 'Usuario',
  }));
}
