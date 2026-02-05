/**
 * WhatsSound — Verificación OTP
 * 6 dígitos enviados por SMS
 * Modo test: cualquier código funciona
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';
import { isTestMode, getOrCreateTestUser } from '../../src/lib/demo';
import { useAuthStore } from '../../src/stores/authStore';

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const router = useRouter();
  const { setProfile } = useAuthStore();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);

  // Obtener teléfono guardado
  useEffect(() => {
    if (Platform.OS === 'web') {
      const savedPhone = localStorage.getItem('ws_pending_phone');
      if (savedPhone) {
        setPhone(savedPhone);
      }
    }
  }, []);

  // Countdown para reenvío
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev <= 1 ? 0 : prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleChange = (text: string, index: number) => {
    // Solo números
    const digit = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    // Auto-advance
    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-verify cuando completo
    if (newOtp.every((d) => d !== '') && newOtp.join('').length === OTP_LENGTH) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: { nativeEvent?: { key?: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (code: string) => {
    setLoading(true);
    setError('');

    try {
      // Modo test: cualquier código de 6 dígitos funciona
      if (isTestMode()) {
        const testProfile = await getOrCreateTestUser();
        if (testProfile) {
          setProfile({
            id: testProfile.id,
            display_name: testProfile.display_name,
            username: testProfile.username,
            avatar_url: testProfile.avatar_url,
            is_dj: testProfile.is_dj,
            bio: '',
            is_verified: false,
            dj_name: null,
            genres: [],
            role: 'user',
          });
          
          // Limpiar teléfono pendiente
          if (Platform.OS === 'web') {
            localStorage.removeItem('ws_pending_phone');
          }
          
          // Ir a crear perfil o tabs según si ya tiene perfil completo
          router.replace('/(tabs)');
        }
        setLoading(false);
        return;
      }

      // Producción: verificar con Supabase
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'sms',
      });

      if (verifyError) {
        setError('Código incorrecto. Inténtalo de nuevo.');
        setOtp(Array(OTP_LENGTH).fill(''));
        inputs.current[0]?.focus();
        setLoading(false);
        return;
      }

      if (data.user) {
        // Verificar si tiene perfil
        const { data: profile, error: profileError } = await supabase
          .from('ws_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // Si hay perfil Y no hay error, ir a tabs
        if (profile && !profileError) {
          setProfile({
            id: profile.id,
            display_name: profile.display_name,
            username: profile.username,
            avatar_url: profile.avatar_url,
            is_dj: profile.is_dj,
            bio: profile.bio || '',
            is_verified: profile.is_verified || false,
            dj_name: profile.dj_name || null,
            genres: profile.genres || [],
            role: profile.role || 'user',
          });
          router.replace('/(tabs)');
        } else {
          // Nuevo usuario, crear perfil
          router.replace('/(auth)/create-profile');
        }
      }
    } catch (e: unknown) {
      setError('Error de verificación. Inténtalo de nuevo.');
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (countdown > 0 || !phone) return;
    
    setCountdown(30);
    setError('');

    if (!isTestMode()) {
      await supabase.auth.signInWithOtp({ phone });
    }
  };

  // Formatear teléfono para mostrar
  const displayPhone = phone || '+34 XXX XXX XXX';

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title}>Código de verificación</Text>
      <Text style={styles.subtitle}>
        Introduce el código de 6 dígitos enviado a{'\n'}
        <Text style={styles.phone}>{displayPhone}</Text>
      </Text>

      {/* Error */}
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* OTP inputs */}
      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref: TextInput | null) => { inputs.current[index] = ref; }}
            style={[
              styles.otpInput, 
              digit && styles.otpInputFilled,
              error && styles.otpInputError,
            ]}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            selectionColor={colors.primary}
            editable={!loading}
          />
        ))}
      </View>

      {/* Loading */}
      {loading && (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
      )}

      {/* Resend */}
      <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
        <Text style={[styles.resend, countdown > 0 && styles.resendDisabled]}>
          {countdown > 0
            ? `Reenviar código en ${countdown}s`
            : 'Reenviar código'}
        </Text>
      </TouchableOpacity>

      {/* Test mode indicator */}
      {isTestMode() && (
        <View style={styles.testBadge}>
          <Ionicons name="flask" size={14} color={colors.warning} />
          <Text style={styles.testBadgeText}>Modo demo: cualquier código funciona</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    padding: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  phone: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.error },
  otpRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  otpInputError: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  resend: {
    ...typography.bodySmall,
    color: colors.accent,
  },
  resendDisabled: {
    color: colors.textMuted,
  },
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning + '15',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.xl,
  },
  testBadgeText: { ...typography.caption, color: colors.warning },
});
