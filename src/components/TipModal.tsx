/**
 * WhatsSound — TipModal
 * Modal para enviar propinas a DJs
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { usePayments } from '../hooks/usePayments';
// NOTE: Add confetti cuando se instale react-native-confetti-cannon
// import ConfettiCannon from 'react-native-confetti-cannon';

interface TipModalProps {
  visible: boolean;
  onClose: () => void;
  djId: string;
  djName: string;
  djAvatar?: string;
  sessionId?: string;
}

const TIP_PRESETS = [100, 200, 500, 1000]; // €1, €2, €5, €10

type ModalState = 'select' | 'processing' | 'success' | 'error';

export function TipModal({ visible, onClose, djId, djName, djAvatar, sessionId }: TipModalProps) {
  const [state, setState] = useState<ModalState>('select');
  const [selectedAmount, setSelectedAmount] = useState(500); // Default €5
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const { sendTip, formatAmount, minTip, maxTip } = usePayments();

  const COMMISSION_RATE = 0.15;
  const amountCents = customAmount ? Math.round(parseFloat(customAmount) * 100) : selectedAmount;
  const feeCents = Math.round(amountCents * COMMISSION_RATE);
  const netCents = amountCents - feeCents;

  const isValidAmount = amountCents >= minTip && amountCents <= maxTip;

  const handleSend = async () => {
    if (!isValidAmount) return;

    setState('processing');
    
    const success = await sendTip(djId, amountCents, message || undefined, sessionId);
    
    if (success) {
      setState('success');
      setShowConfetti(true);
      // Auto-close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    } else {
      setState('error');
      setErrorMessage('No se pudo procesar el pago. Inténtalo de nuevo.');
    }
  };

  const handleClose = () => {
    setState('select');
    setSelectedAmount(500);
    setCustomAmount('');
    setMessage('');
    setErrorMessage('');
    setShowConfetti(false);
    onClose();
  };

  const handleRetry = () => {
    setState('select');
    setErrorMessage('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          {/* NOTE: Confetti cuando se instale la dependencia */}
          {/* showConfetti && <ConfettiCannon count={100} origin={{x:150,y:0}} fadeOut colors={['#FFD700','#4CAF50','#FFA500']} /> */}

          {/* State: Select */}
          {state === 'select' && (
            <>
              <Text style={styles.title}>💸 Enviar Volumen</Text>

              {/* DJ Info */}
              <View style={styles.djInfo}>
                {djAvatar ? (
                  <Image source={{ uri: djAvatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <Text style={styles.djName}>{djName}</Text>
              </View>

              {/* Amount Presets */}
              <Text style={styles.label}>Selecciona cantidad:</Text>
              <View style={styles.presets}>
                {TIP_PRESETS.map((amount) => (
                  <Pressable
                    key={amount}
                    style={[
                      styles.preset,
                      selectedAmount === amount && !customAmount && styles.presetSelected,
                    ]}
                    onPress={() => {
                      setSelectedAmount(amount);
                      setCustomAmount('');
                    }}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        selectedAmount === amount && !customAmount && styles.presetTextSelected,
                      ]}
                    >
                      {formatAmount(amount)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Custom Amount */}
              <View style={styles.customRow}>
                <Text style={styles.customLabel}>Otro:</Text>
                <TextInput
                  style={styles.customInput}
                  placeholder="€0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={customAmount}
                  onChangeText={(text) => {
                    setCustomAmount(text.replace(',', '.'));
                  }}
                />
              </View>

              {/* Message */}
              <TextInput
                style={styles.messageInput}
                placeholder="Mensaje (opcional)"
                placeholderTextColor={colors.textMuted}
                value={message}
                onChangeText={setMessage}
                maxLength={100}
              />

              {/* Summary */}
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Volumen:</Text>
                  <Text style={styles.summaryValue}>{formatAmount(amountCents)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Comisión WhatsSound (15%):</Text>
                  <Text style={styles.summaryFee}>-{formatAmount(feeCents)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{djName} recibe:</Text>
                  <Text style={styles.summaryNet}>{formatAmount(netCents)}</Text>
                </View>
              </View>

              {/* Send Button */}
              <Pressable
                style={[styles.sendButton, !isValidAmount && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!isValidAmount}
              >
                <Text style={styles.sendButtonText}>
                  💸 Enviar {formatAmount(amountCents)}
                </Text>
              </Pressable>

              {/* Validation Error */}
              {!isValidAmount && amountCents > 0 && (
                <Text style={styles.validationError}>
                  {amountCents < minTip
                    ? `Mínimo ${formatAmount(minTip)}`
                    : `Máximo ${formatAmount(maxTip)}`}
                </Text>
              )}

              {/* Cancel */}
              <Pressable onPress={handleClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </>
          )}

          {/* State: Processing */}
          {state === 'processing' && (
            <View style={styles.centerContent}>
              <Text style={styles.title}>💸 Procesando...</Text>
              <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
              <Text style={styles.processingText}>Procesando tu pago</Text>
              <Text style={styles.processingSubtext}>No cierres esta ventana</Text>
            </View>
          )}

          {/* State: Success */}
          {state === 'success' && (
            <View style={styles.centerContent}>
              <Text style={styles.title}>🎉 ¡Volumen Enviado!</Text>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              </View>
              <Text style={styles.successText}>Gracias por apoyar a</Text>
              <Text style={styles.successDj}>{djName}</Text>
              <Text style={styles.successAmount}>Tu volumen: {formatAmount(amountCents)}</Text>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </Pressable>
            </View>
          )}

          {/* State: Error */}
          {state === 'error' && (
            <View style={styles.centerContent}>
              <Text style={styles.title}>❌ Error en el pago</Text>
              <View style={styles.errorIcon}>
                <Ionicons name="alert-circle" size={64} color="#F44336" />
              </View>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Pressable style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
              </Pressable>
              <Pressable onPress={handleClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 360,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  djInfo: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: spacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  djName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  presets: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  preset: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
  },
  presetSelected: {
    backgroundColor: colors.primary,
  },
  presetText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  presetTextSelected: {
    color: '#FFF',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  customLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  customInput: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
  },
  messageInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.textPrimary,
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  summary: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  summaryFee: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  summaryNet: {
    ...typography.bodyBold,
    color: colors.success,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  sendButtonText: {
    ...typography.button,
    color: '#FFF',
  },
  validationError: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  cancelText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  centerContent: {
    alignItems: 'center',
  },
  spinner: {
    marginVertical: spacing.lg,
  },
  processingText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  processingSubtext: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  successIcon: {
    marginVertical: spacing.md,
  },
  successText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  successDj: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  successAmount: {
    ...typography.bodyBold,
    color: colors.success,
    marginBottom: spacing.lg,
  },
  closeButton: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
  },
  closeButtonText: {
    ...typography.button,
    color: colors.textPrimary,
  },
  errorIcon: {
    marginVertical: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  retryButtonText: {
    ...typography.button,
    color: '#FFF',
  },
});
