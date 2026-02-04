/**
 * WhatsSound — usePresence Hook
 * Muestra quién está escuchando una sesión en tiempo real
 * Usa Supabase Presence API
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export interface PresenceUser {
  id: string;
  name: string;
  avatar: string | null;
  joinedAt: string;
}

interface UsePresenceReturn {
  users: PresenceUser[];
  count: number;
  isConnected: boolean;
}

export function usePresence(sessionId: string | undefined): UsePresenceReturn {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [count, setCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const channelName = `presence:session:${sessionId}`;
    
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user?.id || `anon-${Date.now()}`,
        },
      },
    });

    // Sincronizar estado de presencia
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const presentUsers: PresenceUser[] = [];
      
      Object.keys(state).forEach(key => {
        const presences = state[key] as any[];
        presences.forEach(presence => {
          // Evitar duplicados
          if (!presentUsers.find(u => u.id === presence.user_id)) {
            presentUsers.push({
              id: presence.user_id || key,
              name: presence.user_name || 'Anónimo',
              avatar: presence.user_avatar || null,
              joinedAt: presence.joined_at || new Date().toISOString(),
            });
          }
        });
      });

      // Ordenar por tiempo de entrada (más recientes primero)
      presentUsers.sort((a, b) => 
        new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      );

      setUsers(presentUsers);
      setCount(presentUsers.length);
    });

    // Usuario entra
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('[Presence] Usuario entró:', newPresences);
    });

    // Usuario sale
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('[Presence] Usuario salió:', leftPresences);
    });

    // Suscribirse al canal
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        
        // Trackear mi presencia
        const presenceData = {
          user_id: user?.id || `anon-${Date.now()}`,
          user_name: user?.user_metadata?.display_name || 'Oyente',
          user_avatar: user?.user_metadata?.avatar_url || null,
          joined_at: new Date().toISOString(),
        };
        
        await channel.track(presenceData);
        console.log('[Presence] Conectado a sesión:', sessionId);
      } else if (status === 'CHANNEL_ERROR') {
        setIsConnected(false);
        console.error('[Presence] Error en canal');
      }
    });

    // Cleanup al desmontar
    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      setIsConnected(false);
      console.log('[Presence] Desconectado de sesión:', sessionId);
    };
  }, [sessionId, user?.id, user?.user_metadata?.display_name, user?.user_metadata?.avatar_url]);

  return { users, count, isConnected };
}

/**
 * Hook para obtener solo el conteo (más ligero)
 */
export function usePresenceCount(sessionId: string | undefined): number {
  const { count } = usePresence(sessionId);
  return count;
}

export default usePresence;
