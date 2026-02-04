/**
 * WhatsSound — FloatingReactionsContainer
 * Gestiona múltiples reacciones flotantes
 * Se integra con Supabase Broadcast para recibir reacciones de otros
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
// Haptics solo disponible en native, no en web
const Haptics = Platform.OS === 'web' ? null : require('expo-haptics');
import { FloatingReaction } from './FloatingReaction';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_REACTIONS = 20;
const THROTTLE_MS = 150;

interface Reaction {
  id: string;
  emoji: string;
  x: number;
}

interface Props {
  sessionId: string;
}

// Ref global para añadir reacciones desde fuera del componente
export const floatingReactionsRef = {
  addReaction: (_emoji: string) => {},
};

export function FloatingReactionsContainer({ sessionId }: Props) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const lastReactionTime = useRef(0);

  // Añadir reacción con throttle
  const addReaction = useCallback((emoji: string) => {
    const now = Date.now();
    
    // Throttle para evitar spam
    if (now - lastReactionTime.current < THROTTLE_MS) return;
    lastReactionTime.current = now;

    // Limitar cantidad máxima
    if (reactions.length >= MAX_REACTIONS) return;

    const id = `${now}-${Math.random().toString(36).substr(2, 9)}`;
    // Posición en zona derecha con variación
    const x = SCREEN_WIDTH - 80 + Math.random() * 50;

    setReactions(prev => [...prev, { id, emoji, x }]);
  }, [reactions.length]);

  // Exponer función globalmente
  useEffect(() => {
    floatingReactionsRef.addReaction = addReaction;
  }, [addReaction]);

  // Remover reacción cuando termina animación
  const removeReaction = useCallback((id: string) => {
    setReactions(prev => prev.filter(r => r.id !== id));
  }, []);

  // Escuchar reacciones de otros usuarios via Supabase Broadcast
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`reactions:${sessionId}`);

    channel
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        if (payload?.emoji) {
          addReaction(payload.emoji);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, addReaction]);

  return (
    <View style={styles.container} pointerEvents="none">
      {reactions.map(reaction => (
        <FloatingReaction
          key={reaction.id}
          emoji={reaction.emoji}
          startX={reaction.x}
          onComplete={() => removeReaction(reaction.id)}
        />
      ))}
    </View>
  );
}

/**
 * Función para enviar reacción (llamar desde botones de reacción)
 */
export async function sendReaction(sessionId: string, emoji: string, userId?: string) {
  // Haptic feedback (solo en dispositivos nativos)
  if (Platform.OS !== 'web') {
    Haptics?.impactAsync?.(Haptics?.ImpactFeedbackStyle?.Light);
  }

  // Mostrar localmente
  floatingReactionsRef.addReaction(emoji);

  // Broadcast a otros usuarios
  try {
    await supabase.channel(`reactions:${sessionId}`).send({
      type: 'broadcast',
      event: 'reaction',
      payload: { emoji, userId, timestamp: Date.now() },
    });
  } catch (error) {
    console.error('[Reactions] Error sending broadcast:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 100,
  },
});

export default FloatingReactionsContainer;
