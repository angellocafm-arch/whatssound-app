/**
 * WhatsSound — TipButton
 * Botón para enviar propinas al DJ
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { isDemoMode } from '../../lib/demo';

const TIP_AMOUNTS = [
  { value: 100, label: '€1', emoji: '☕' },
  { value: 200, label: '€2', emoji: '🍺' },
  { value: 500, label: '€5', emoji: '🎉' },
  { value: 1000, label: '€10', emoji: '🔥' },
  { value: 2000, label: '€20', emoji: '💎' },
];

interface Props {
  sessionId: string;
  djId: string;
  djName: string;
  onTipSent?: (amount: number) => void;
}

export function TipButton({ sessionId, djId, djName, onTipSent }: Props) {
  const { user } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const buttonScale = useSharedValue(1);

  const handlePress = () => {
    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 50 }),
      withSpring(1, { damping: 15 })
    );
    setModalVisible(true);
  };

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
  };

  const handleSendTip = async () => {
    if (!selectedAmount) return;

    setSending(true);

    try {
      if (isDemoMode()) {
        // Simular envío
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSuccess(true);
        onTipSent?.(selectedAmount);
        
        setTimeout(() => {
          setModalVisible(false);
          setSuccess(false);
          setSelectedAmount(null);
        }, 2000);
        return;
      }

      // Llamar a Edge Function para crear PaymentIntent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: selectedAmount,
          sessionId,
          djId,
          tipperId: user?.id,
        },
      });

      if (error) throw error;

      // En producción: Abrir sheet de pago con Stripe
      // Por ahora: simular éxito
      setSuccess(true);
      onTipSent?.(selectedAmount);
      
      setTimeout(() => {
        setModalVisible(false);
        setSuccess(false);
        setSelectedAmount(null);
      }, 2000);

    } catch (error) {
      console.error('[TipButton] Error:', error);
      Alert.alert('Error', 'No se pudo procesar la propina');
    } finally {
      setSending(false);
    }
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View style={[styles.button, buttonAnimatedStyle]}>
          <Text style={styles.buttonEmoji}>💰</Text>
          <Text style={styles.buttonText}>Propina</Text>
        </Animated.View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !sending && setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {success ? '¡Propina enviada! 🎉' : `Propina para ${djName}`}
              </Text>
              {!sending && !success && (
                <TouchableOpacity 
                  style={styles.closeBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {success ? (
              <View style={styles.successContent}>
                <Text style={styles.successEmoji}>🎉</Text>
                <Text style={styles.successText}>
                  ¡Gracias por apoyar a {djName}!
                </Text>
                <Text style={styles.successAmount}>
                  €{(selectedAmount! / 100).toFixed(2)}
                </Text>
              </View>
            ) : (
              <>
                {/* Amounts grid */}
                <View style={styles.amountsGrid}>
                  {TIP_AMOUNTS.map(tip => (
                    <TouchableOpacity
                      key={tip.value}
                      style={[
                        styles.amountBtn,
                        selectedAmount === tip.value && styles.amountBtnSelected,
                      ]}
                      onPress={() => handleSelectAmount(tip.value)}
                      disabled={sending}
                    >
                      <Text style={styles.amountEmoji}>{tip.emoji}</Text>
                      <Text style={[
                        styles.amountLabel,
                        selectedAmount === tip.value && styles.amountLabelSelected,
                      ]}>
                        {tip.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Info */}
                <View style={styles.info}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.infoText}>
                    El DJ recibe el 87% · WhatsSound 13%
                  </Text>
                </View>

                {/* Send button */}
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    !selectedAmount && styles.sendBtnDisabled,
                  ]}
                  onPress={handleSendTip}
                  disabled={!selectedAmount || sending}
                >
                  {sending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.sendBtnText}>
                      {selectedAmount 
                        ? `Enviar €${(selectedAmount / 100).toFixed(2)}`
                        : 'Selecciona cantidad'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  buttonEmoji: {
    fontSize: 16,
  },
  buttonText: {
    ...typography.captionBold,
    color: colors.warning,
    fontSize: 13,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 18,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  // Amounts
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  amountBtn: {
    width: '28%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceDark || '#2a2a2a',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  amountBtnSelected: {
    borderColor: colors.warning,
    backgroundColor: colors.warning + '15',
  },
  amountEmoji: {
    fontSize: 24,
  },
  amountLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 16,
  },
  amountLabelSelected: {
    color: colors.warning,
  },
  // Info
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  infoText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  // Send button
  sendBtn: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  sendBtnText: {
    ...typography.bodyBold,
    color: '#000',
    fontSize: 16,
  },
  // Success
  successContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  successText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  successAmount: {
    ...typography.h1,
    color: colors.warning,
    fontSize: 36,
  },
});

export default TipButton;
