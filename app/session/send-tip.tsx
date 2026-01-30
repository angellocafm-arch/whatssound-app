/**
 * WhatsSound — Enviar Propina
 * Modal para enviar propina al DJ
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Avatar } from '../../src/components/ui/Avatar';
import { supabase } from '../../src/lib/supabase';

const AMOUNTS = [1, 2, 5, 10];

export default function SendTipScreen() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const amount = selectedAmount || Number(customAmount) || 0;

  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = id || '';

  const handleSend = async () => {
    if (amount <= 0) return;
    setLoading(true);
    const { data: { session: _s } } = await supabase.auth.getSession(); const user = _s?.user;
    if (user) {
      await supabase.from('tips').insert({
        session_id: sessionId,
        from_user: user.id,
        amount,
        message: message || null,
      });
    }
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          </View>
          <Text style={styles.successTitle}>¡Propina enviada!</Text>
          <Text style={styles.successAmount}>€{amount}</Text>
          <Text style={styles.successSubtitle}>DJ Marcos te lo agradece 🙌</Text>
          <Button title="Volver a la sesión" onPress={() => router.back()} variant="secondary" size="lg" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enviar propina</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* DJ info */}
      <View style={styles.djInfo}>
        <Avatar name="DJ Marcos" size="lg" />
        <Text style={styles.djName}>DJ Marcos</Text>
        <Text style={styles.djSession}>Viernes Latino 🔥</Text>
      </View>

      {/* Amount selection */}
      <Text style={styles.sectionLabel}>ELIGE UNA CANTIDAD</Text>
      <View style={styles.amountsRow}>
        {AMOUNTS.map(amt => (
          <TouchableOpacity
            key={amt}
            style={[styles.amountBtn, selectedAmount === amt && styles.amountBtnSelected]}
            onPress={() => { setSelectedAmount(amt); setCustomAmount(''); }}
          >
            <Text style={[styles.amountText, selectedAmount === amt && styles.amountTextSelected]}>
              €{amt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom amount */}
      <Input
        label="O escribe otra cantidad"
        placeholder="€0.00"
        keyboardType="numeric"
        value={customAmount}
        onChangeText={(t) => { setCustomAmount(t); setSelectedAmount(null); }}
      />

      {/* Message */}
      <Input
        label="Mensaje (opcional)"
        placeholder="¡Sube mi canción en la cola! 🎶"
        value={message}
        onChangeText={setMessage}
        maxLength={100}
      />

      {/* Note */}
      <View style={styles.note}>
        <Ionicons name="information-circle" size={16} color={colors.accent} />
        <Text style={styles.noteText}>
          Las propinas con mensaje suben tu canción en la cola
        </Text>
      </View>

      {/* Send button */}
      <Button
        title={amount > 0 ? `Enviar €${amount}` : 'Selecciona una cantidad'}
        onPress={handleSend}
        fullWidth
        size="lg"
        loading={loading}
        disabled={amount <= 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  djInfo: { alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xl },
  djName: { ...typography.h3, color: colors.textPrimary },
  djSession: { ...typography.body, color: colors.textSecondary },
  sectionLabel: { ...typography.captionBold, color: colors.textSecondary, letterSpacing: 0.5, marginBottom: spacing.sm },
  amountsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  amountBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    borderWidth: 1.5, borderColor: colors.border,
  },
  amountBtnSelected: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  amountText: { ...typography.h3, color: colors.textSecondary },
  amountTextSelected: { color: colors.primary },
  note: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.accent + '10', padding: spacing.md,
    borderRadius: borderRadius.lg, marginBottom: spacing.xl,
  },
  noteText: { ...typography.bodySmall, color: colors.accent, flex: 1 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  successIcon: { marginBottom: spacing.md },
  successTitle: { ...typography.h2, color: colors.textPrimary },
  successAmount: { ...typography.h1, color: colors.primary, fontSize: 48 },
  successSubtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
});
