/**
 * WhatsSound — TipNotification
 * Notificación flotante cuando alguien envía una propina
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { supabase } from '../../lib/supabase';

interface Tip {
  id: string;
  amount: number;
  tipperName: string;
  timestamp: number;
}

interface Props {
  sessionId: string;
  djId: string;
}

export function TipNotificationContainer({ sessionId, djId }: Props) {
  const [tips, setTips] = useState<Tip[]>([]);

  // Escuchar propinas en tiempo real
  useEffect(() => {
    if (!sessionId || !djId) return;

    const channel = supabase
      .channel(`tips:${sessionId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ws_tips',
          filter: `session_id=eq.${sessionId}` 
        },
        async (payload) => {
          const tip = payload.new as any;
          
          // Obtener nombre del tipper
          const { data: tipper } = await supabase
            .from('ws_profiles')
            .select('display_name')
            .eq('id', tip.tipper_id)
            .single();

          const newTip: Tip = {
            id: tip.id,
            amount: tip.amount * 100, // Convertir a centavos para display
            tipperName: tipper?.display_name || 'Alguien',
            timestamp: Date.now(),
          };

          setTips(prev => [...prev, newTip]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, djId]);

  const removeTip = useCallback((id: string) => {
    setTips(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {tips.map(tip => (
        <TipNotificationItem
          key={tip.id}
          tip={tip}
          onComplete={() => removeTip(tip.id)}
        />
      ))}
    </View>
  );
}

interface ItemProps {
  tip: Tip;
  onComplete: () => void;
}

function TipNotificationItem({ tip, onComplete }: ItemProps) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    // Entrada
    translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.back(1.5)) });
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSequence(
      withTiming(1.1, { duration: 300 }),
      withTiming(1, { duration: 200 })
    );

    // Salida después de 4 segundos
    translateY.value = withDelay(4000, 
      withTiming(-50, { duration: 300 }, (finished) => {
        if (finished) runOnJS(onComplete)();
      })
    );
    opacity.value = withDelay(4000, withTiming(0, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const getEmoji = (amount: number) => {
    if (amount >= 2000) return '💎';
    if (amount >= 1000) return '🔥';
    if (amount >= 500) return '🎉';
    if (amount >= 200) return '🍺';
    return '☕';
  };

  const formatAmount = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  return (
    <Animated.View style={[styles.notification, animatedStyle]}>
      <Text style={styles.emoji}>{getEmoji(tip.amount)}</Text>
      <View style={styles.content}>
        <Text style={styles.tipper}>{tip.tipperName}</Text>
        <Text style={styles.message}>envió una propina</Text>
      </View>
      <Text style={styles.amount}>{formatAmount(tip.amount)}</Text>
    </Animated.View>
  );
}

/**
 * Componente simple para mostrar propina inline en el chat
 */
export function TipMessage({ tipperName, amount }: { tipperName: string; amount: number }) {
  return (
    <View style={styles.tipMessage}>
      <Text style={styles.tipMessageEmoji}>💰</Text>
      <Text style={styles.tipMessageText}>
        <Text style={styles.tipMessageName}>{tipperName}</Text>
        {' envió '}
        <Text style={styles.tipMessageAmount}>€{(amount / 100).toFixed(2)}</Text>
        {' de propina'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 200,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emoji: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  tipper: {
    ...typography.captionBold,
    color: '#000',
    fontSize: 13,
  },
  message: {
    ...typography.caption,
    color: '#000',
    opacity: 0.8,
    fontSize: 11,
  },
  amount: {
    ...typography.h3,
    color: '#000',
    fontSize: 18,
  },
  // Tip message in chat
  tipMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  tipMessageEmoji: {
    fontSize: 20,
  },
  tipMessageText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  tipMessageName: {
    color: colors.warning,
    fontWeight: '600',
  },
  tipMessageAmount: {
    color: colors.warning,
    fontWeight: '700',
  },
});

export default TipNotificationContainer;
