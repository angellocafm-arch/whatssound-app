/**
 * WhatsSound — useGoldenBoost Hook
 * Gestiona el estado y acciones de Golden Boost para el usuario actual
 * 
 * Funcionalidades:
 * - Estado de disponibilidad
 * - Dar Golden Boost
 * - Tracking de sesiones para acelerador
 * - Historial
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export interface GoldenBoostState {
  /** Golden Boosts disponibles para dar */
  available: number;
  /** Total de Golden Boosts dados (lifetime) */
  given: number;
  /** Total de Golden Boosts recibidos (lifetime) */
  received: number;
  /** Sesiones únicas escuchadas esta semana */
  sessionsThisWeek: number;
  /** Badge actual */
  badge: 'none' | 'rising_star' | 'fan_favorite' | 'verified' | 'hall_of_fame';
  /** Fecha del último reset */
  lastReset: Date | null;
}

export interface GoldenBoostGiven {
  id: string;
  toUserId: string;
  toUserName: string;
  toUserAvatar?: string;
  sessionId?: string;
  createdAt: Date;
}

export interface GoldenBoostReceived {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  sessionId?: string;
  createdAt: Date;
}

export function useGoldenBoost() {
  const { user } = useAuthStore();
  const [state, setState] = useState<GoldenBoostState>({
    available: 0,
    given: 0,
    received: 0,
    sessionsThisWeek: 0,
    badge: 'none',
    lastReset: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar estado inicial
  const loadState = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('ws_profiles')
        .select(`
          golden_boost_available,
          golden_boosts_given,
          golden_boosts_received,
          sessions_listened_this_week,
          golden_badge,
          golden_boost_last_reset
        `)
        .eq('id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      setState({
        available: data?.golden_boost_available ?? 0,
        given: data?.golden_boosts_given ?? 0,
        received: data?.golden_boosts_received ?? 0,
        sessionsThisWeek: data?.sessions_listened_this_week ?? 0,
        badge: (data?.golden_badge as GoldenBoostState['badge']) ?? 'none',
        lastReset: data?.golden_boost_last_reset 
          ? new Date(data.golden_boost_last_reset) 
          : null,
      });
    } catch (err: unknown) {
      console.error('[useGoldenBoost] Error cargando estado:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  /**
   * Dar un Golden Boost a un DJ
   */
  const giveBoost = useCallback(async (
    toDjId: string,
    sessionId?: string,
    message?: string
  ): Promise<boolean> => {
    if (!user) {
      setError('Debes iniciar sesión');
      return false;
    }
    
    if (state.available < 1) {
      setError('No tienes Golden Boosts disponibles');
      return false;
    }
    
    if (user.id === toDjId) {
      setError('No puedes darte un Golden Boost a ti mismo');
      return false;
    }
    
    try {
      setError(null);
      
      const { error: insertError } = await supabase
        .from('ws_golden_boosts')
        .insert({
          from_user_id: user.id,
          to_dj_id: toDjId,
          session_id: sessionId || null,
          message: message || null,
        });
      
      if (insertError) throw insertError;
      
      // Actualizar estado local
      setState(prev => ({
        ...prev,
        available: prev.available - 1,
        given: prev.given + 1,
      }));
      
      return true;
    } catch (err: unknown) {
      console.error('[useGoldenBoost] Error dando boost:', err);
      setError(err.message);
      return false;
    }
  }, [user, state.available]);

  /**
   * Registrar que escuchó una sesión (para acelerador)
   */
  const registerSessionListened = useCallback(async (sessionId: string): Promise<void> => {
    if (!user) return;
    
    try {
      // Llamar función SQL que maneja la lógica
      await supabase.rpc('register_session_listened', {
        p_user_id: user.id,
        p_session_id: sessionId,
      });
      
      // Recargar estado para ver si ganó el acelerador
      await loadState();
    } catch (err) {
      console.error('[useGoldenBoost] Error registrando sesión:', err);
    }
  }, [user, loadState]);

  /**
   * Obtener historial de Golden Boosts dados
   */
  const getGivenHistory = useCallback(async (
    limit: number = 20
  ): Promise<GoldenBoostGiven[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('ws_golden_boosts')
        .select(`
          id,
          to_dj_id,
          session_id,
          created_at,
          receiver:ws_profiles!to_dj_id(display_name, avatar_url)
        `)
        .eq('from_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        toUserId: item.to_dj_id,
        toUserName: (item.receiver as any)?.display_name || 'Usuario',
        toUserAvatar: (item.receiver as any)?.avatar_url,
        sessionId: item.session_id,
        createdAt: new Date(item.created_at),
      }));
    } catch (err) {
      console.error('[useGoldenBoost] Error obteniendo historial:', err);
      return [];
    }
  }, [user]);

  /**
   * Obtener historial de Golden Boosts recibidos
   */
  const getReceivedHistory = useCallback(async (
    limit: number = 20
  ): Promise<GoldenBoostReceived[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('ws_golden_boosts')
        .select(`
          id,
          from_user_id,
          session_id,
          created_at,
          giver:ws_profiles!from_user_id(display_name, avatar_url)
        `)
        .eq('to_dj_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        fromUserId: item.from_user_id,
        fromUserName: (item.giver as any)?.display_name || 'Usuario',
        fromUserAvatar: (item.giver as any)?.avatar_url,
        sessionId: item.session_id,
        createdAt: new Date(item.created_at),
      }));
    } catch (err) {
      console.error('[useGoldenBoost] Error obteniendo recibidos:', err);
      return [];
    }
  }, [user]);

  /**
   * Calcular días hasta el próximo reset (viernes 12:00)
   */
  const getDaysUntilReset = useCallback((): number => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = domingo, 5 = viernes
    const hour = now.getHours();
    
    // Si es viernes antes de las 12, es hoy
    if (dayOfWeek === 5 && hour < 12) {
      return 0;
    }
    
    // Calcular días hasta el próximo viernes
    let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    if (daysUntilFriday === 0) daysUntilFriday = 7; // Si ya pasó el viernes
    
    return daysUntilFriday;
  }, []);

  /**
   * Calcular sesiones restantes para ganar acelerador
   */
  const getSessionsUntilBonus = useCallback((): number => {
    return Math.max(0, 5 - state.sessionsThisWeek);
  }, [state.sessionsThisWeek]);

  return {
    // Estado
    ...state,
    isLoading,
    error,
    
    // Acciones
    giveBoost,
    registerSessionListened,
    refresh: loadState,
    
    // Historial
    getGivenHistory,
    getReceivedHistory,
    
    // Utilidades
    getDaysUntilReset,
    getSessionsUntilBonus,
    
    // Helpers
    canGive: state.available > 0,
    hasBonus: state.sessionsThisWeek >= 5,
  };
}

export default useGoldenBoost;
