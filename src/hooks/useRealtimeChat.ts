/**
 * WhatsSound — Realtime Chat Hook
 * Subscribes to ws_messages via Supabase Realtime
 * New messages appear instantly without refresh
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isDemoMode } from '../lib/demo';

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  isMine: boolean;
  role?: 'dj' | 'vip' | 'mod';
  type?: string;
}

export function useRealtimeChat(sessionId: string, userId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial messages
  useEffect(() => {
    if (!sessionId || isDemoMode()) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from('ws_messages')
        .select('*, author:ws_profiles!author_id(display_name)')
        .eq('session_id', sessionId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (data) {
        setMessages(data.map((m: any) => ({
          id: m.id,
          user: m.author?.display_name || 'Anónimo',
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          isMine: m.author_id === userId,
          role: m.type === 'dj_announce' ? 'dj' : undefined,
          type: m.type,
        })));
      }
      setLoading(false);
    })();
  }, [sessionId, userId]);

  // Subscribe to realtime inserts
  useEffect(() => {
    if (!sessionId || isDemoMode()) return;

    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ws_messages',
        filter: `session_id=eq.${sessionId}`,
      }, async (payload) => {
        const msg = payload.new as any;
        // Fetch author name
        const { data: author } = await supabase
          .from('ws_profiles')
          .select('display_name')
          .eq('id', msg.author_id)
          .single();

        const newMsg: ChatMessage = {
          id: msg.id,
          user: author?.display_name || 'Anónimo',
          text: msg.content,
          time: new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          isMine: msg.author_id === userId,
          role: msg.type === 'dj_announce' ? 'dj' : undefined,
          type: msg.type,
        };

        setMessages(prev => [...prev, newMsg]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId]);

  // Send a message
  const sendMessage = useCallback(async (content: string, authorId: string) => {
    if (isDemoMode()) return;
    await supabase.from('ws_messages').insert({
      session_id: sessionId,
      author_id: authorId,
      type: 'text',
      content,
    });
  }, [sessionId]);

  return { messages, loading, sendMessage };
}
