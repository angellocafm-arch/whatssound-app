/**
 * WhatsSound — Enviar Volumen (Bottom Sheet style)
 * Referencia: 26-enviar-propina.png
 * 
 * CONECTADO A SUPABASE: guarda en ws_tips
 * Modo test: status='test' (sin dinero real)
 * Modo prod: status='completed' (con Stripe)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, ActivityIndicator, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { sendTip, TIP_AMOUNTS, PLATFORM_FEE_PERCENT, getPaymentStatus } from '../../src/lib/tips';
import { supabase } from '../../src/lib/supabase';

const { height: SCREEN_H } = Dimensions.get('window');

export default function SendTipScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string; djId?: string; djName?: string; songId?: string }>();
  
  const [selected, setSelected] = useState<number | null>(5);
  const [custom, setCustom] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // DJ info
  const [djName, setDjName] = useState(params.djName || 'DJ');
  const [djId, setDjId] = useState(params.djId || '');

  // Fetch DJ if not provided
  useEffect(() => {
    if (!djId && params.sessionId) {
      (async () => {
        const { data } = await supabase
          .from('ws_sessions')
          .select('dj_id, dj:ws_profiles!dj_id(display_name, dj_name)')
          .eq('id', params.sessionId)
          .single();
        if (data) {
          setDjId(data.dj_id);
          setDjName((data.dj as any)?.dj_name || (data.dj as any)?.display_name || 'DJ');
        }
      })();
    }
  }, [params.sessionId, djId]);

  const amount = custom ? Number(custom) : (selected || 0);
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT * 100) / 100;
  const total = Math.round((amount + platformFee) * 100) / 100;

  const paymentStatus = getPaymentStatus();

  const handleSend = async () => {
    if (amount <= 0 || !djId) return;
    
    setLoading(true);
    setError(null);

    const result = await sendTip({
      receiverId: djId,
      sessionId: params.sessionId,
      songId: params.songId,
      amount,
      message: message || undefined,
      isAnonymous,
    });

    setLoading(false);

    if (result.ok) {
      setSent(true);
    } else {
      setError(result.error || 'Error desconocido');
    }
  };

  if (sent) {
    return (
      <View style={s.container}>
        <View style={s.overlay} />
        <View style={s.successSheet}>
          <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          <Text style={s.successTitle}>¡Volumen enviado!</Text>
          <Text style={s.successAmount}>€{amount}</Text>
          <Text style={s.successSub}>{djName} te lo agradece 🙌</Text>
          {!paymentStatus.enabled && (
            <View style={s.testBadge}>
              <Ionicons name="flask" size={14} color={colors.warning} />
              <Text style={s.testBadgeText}>Modo demo · Sin cargo real</Text>
            </View>
          )}
          <TouchableOpacity style={s.sendBtn} onPress={() => router.back()}>
            <Text style={s.sendBtnText}>Volver a la sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Overlay oscuro - tap para cerrar */}
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => router.back()} />

      {/* Bottom Sheet */}
      <View style={s.sheet}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Test mode badge */}
        {!paymentStatus.enabled && (
          <View style={s.testBanner}>
            <Ionicons name="flask" size={16} color={colors.warning} />
            <Text style={s.testBannerText}>Modo demo: decibelios sin cargo real</Text>
          </View>
        )}

        {/* Title */}
        <Text style={s.title}>Volumen para {djName} 🎧</Text>
        <Text style={s.subtitle}>Apoya al DJ con decibelios</Text>

        {/* Amount pills */}
        <View style={s.amountsRow}>
          {TIP_AMOUNTS.slice(0, 4).map(amt => (
            <TouchableOpacity
              key={amt}
              style={[s.pill, selected === amt && !custom && s.pillSelected]}
              onPress={() => { setSelected(amt); setCustom(''); }}
            >
              <Text style={[s.pillText, selected === amt && !custom && s.pillTextSelected]}>€{amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Second row */}
        <View style={s.amountsRow}>
          {TIP_AMOUNTS.slice(4).map(amt => (
            <TouchableOpacity
              key={amt}
              style={[s.pill, selected === amt && !custom && s.pillSelected]}
              onPress={() => { setSelected(amt); setCustom(''); }}
            >
              <Text style={[s.pillText, selected === amt && !custom && s.pillTextSelected]}>€{amt}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[s.pill, custom ? s.pillSelected : {}]}
            onPress={() => { setSelected(null); setCustom(''); }}
          >
            <Text style={[s.pillText, custom ? s.pillTextSelected : {}]}>Otro</Text>
          </TouchableOpacity>
        </View>

        {/* Custom input */}
        {(custom !== '' || !selected) && (
          <TextInput
            style={s.customInput}
            placeholder="€0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={custom}
            onChangeText={(t) => { setCustom(t.replace(/[^0-9.]/g, '')); setSelected(null); }}
            autoFocus
          />
        )}

        {/* Message */}
        <TextInput
          style={s.messageInput}
          placeholder="¡Gran sesión! (opcional)"
          placeholderTextColor={colors.textMuted}
          value={message}
          onChangeText={setMessage}
          maxLength={100}
        />

        {/* Anonymous toggle */}
        <View style={s.toggleRow}>
          <Text style={s.toggleLabel}>Enviar como anónimo</Text>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: colors.border, true: colors.primary + '60' }}
            thumbColor={isAnonymous ? colors.primary : colors.textMuted}
          />
        </View>

        {/* Summary */}
        {amount > 0 && (
          <View style={s.summary}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Volumen</Text>
              <Text style={s.summaryValue}>€{amount.toFixed(2)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Comisión servicio (13%)</Text>
              <Text style={s.summaryValue}>€{platformFee.toFixed(2)}</Text>
            </View>
            <View style={[s.summaryRow, s.summaryTotal]}>
              <Text style={s.summaryTotalLabel}>Total</Text>
              <Text style={s.summaryTotalValue}>€{total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Note */}
        <Text style={s.note}>💡 Tus decibelios suben tu canción en la cola</Text>

        {/* Error */}
        {error && (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Send button */}
        <TouchableOpacity
          style={[s.sendBtn, (amount <= 0 || loading) && { opacity: 0.4 }]}
          onPress={handleSend}
          disabled={amount <= 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.sendBtnText}>
              💰 Enviar €{total.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    paddingBottom: 40,
    gap: spacing.md,
  },
  handle: { width: 40, height: 4, backgroundColor: colors.borderLight, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  
  testBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning + '15',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  testBannerText: { ...typography.captionBold, color: colors.warning, fontSize: 12 },
  
  title: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: -8 },
  
  amountsRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.full,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  pillSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  pillText: { ...typography.bodyBold, color: colors.textSecondary, fontSize: 15 },
  pillTextSelected: { color: colors.primary },
  
  customInput: {
    backgroundColor: colors.surfaceDark, borderRadius: borderRadius.lg,
    padding: spacing.md, color: colors.textPrimary, fontSize: 18,
    textAlign: 'center', borderWidth: 1, borderColor: colors.border,
  },
  messageInput: {
    backgroundColor: colors.surfaceDark, borderRadius: borderRadius.lg,
    padding: spacing.md, color: colors.textPrimary, fontSize: 15,
  },
  
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  toggleLabel: { ...typography.bodySmall, color: colors.textSecondary },
  
  summary: {
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: { ...typography.bodySmall, color: colors.textMuted, fontSize: 13 },
  summaryValue: { ...typography.bodySmall, color: colors.textSecondary, fontSize: 13 },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  summaryTotalLabel: { ...typography.bodyBold, color: colors.textPrimary },
  summaryTotalValue: { ...typography.bodyBold, color: colors.primary, fontSize: 16 },
  
  note: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  errorText: { ...typography.caption, color: colors.error, flex: 1 },
  
  sendBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  sendBtnText: { ...typography.button, color: '#fff', fontSize: 16 },
  
  successSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.xl, paddingVertical: 60,
    alignItems: 'center', gap: spacing.md,
  },
  successTitle: { ...typography.h2, color: colors.textPrimary },
  successAmount: { ...typography.h1, color: colors.primary, fontSize: 48 },
  successSub: { ...typography.body, color: colors.textSecondary },
  
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning + '15',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  testBadgeText: { ...typography.caption, color: colors.warning },
});
