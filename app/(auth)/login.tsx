/**
 * WhatsSound — Login con Teléfono
 * Flujo: Teléfono → OTP → Perfil
 * Modo test: salta verificación real
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Button } from '../../src/components/ui/Button';
import { supabase } from '../../src/lib/supabase';
import { isTestMode, getOrCreateTestUser } from '../../src/lib/demo';

// Códigos de país comunes
const COUNTRY_CODES = [
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+54', country: 'AR', flag: '🇦🇷' },
  { code: '+57', country: 'CO', flag: '🇨🇴' },
];

export default function LoginScreen() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const fullPhone = `${countryCode.code}${phone.replace(/\s/g, '')}`;
  const isValidPhone = phone.replace(/\s/g, '').length >= 9;

  const handleContinue = async () => {
    if (!isValidPhone) return;
    
    setLoading(true);
    setError('');

    try {
      // En modo test, saltamos la verificación real
      if (isTestMode()) {
        // Guardamos el teléfono en localStorage para usarlo después
        if (Platform.OS === 'web') {
          localStorage.setItem('ws_pending_phone', fullPhone);
        }
        router.push('/(auth)/otp');
        setLoading(false);
        return;
      }

      // En producción: enviar OTP real via Supabase
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (otpError) {
        setError(otpError.message);
        setLoading(false);
        return;
      }

      // Guardamos el teléfono para verificar en la siguiente pantalla
      if (Platform.OS === 'web') {
        localStorage.setItem('ws_pending_phone', fullPhone);
      }

      router.push('/(auth)/otp');
    } catch (e: any) {
      setError('Error al enviar el código. Inténtalo de nuevo.');
    }
    
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="headset" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>WhatsSound</Text>
        </View>

        <Text style={styles.subtitle}>
          Introduce tu número de teléfono para empezar
        </Text>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Phone input */}
        <View style={styles.phoneRow}>
          {/* Country code selector */}
          <TouchableOpacity 
            style={styles.countryBtn}
            onPress={() => setShowCountryPicker(!showCountryPicker)}
          >
            <Text style={styles.countryFlag}>{countryCode.flag}</Text>
            <Text style={styles.countryCode}>{countryCode.code}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Phone number */}
          <TextInput
            style={styles.phoneInput}
            placeholder="612 345 678"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={15}
          />
        </View>

        {/* Country picker dropdown */}
        {showCountryPicker && (
          <View style={styles.countryPicker}>
            {COUNTRY_CODES.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={styles.countryOption}
                onPress={() => {
                  setCountryCode(c);
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.countryFlag}>{c.flag}</Text>
                <Text style={styles.countryOptionText}>{c.country}</Text>
                <Text style={styles.countryOptionCode}>{c.code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Continue button */}
        <Button
          title="Continuar"
          onPress={handleContinue}
          fullWidth
          size="lg"
          loading={loading}
          disabled={!isValidPhone}
        />

        {/* Test mode indicator */}
        {isTestMode() && (
          <View style={styles.testBadge}>
            <Ionicons name="flask" size={14} color={colors.warning} />
            <Text style={styles.testBadgeText}>Modo demo: verificación simulada</Text>
          </View>
        )}

        {/* Terms */}
        <Text style={styles.terms}>
          Al continuar, aceptas nuestros{' '}
          <Text style={styles.link}>Términos de Servicio</Text> y{' '}
          <Text style={styles.link}>Política de Privacidad</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1, justifyContent: 'center',
    paddingHorizontal: spacing.xl, gap: spacing.md,
  },
  logoContainer: { alignItems: 'center', marginBottom: spacing.lg },
  logo: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { 
    ...typography.body, color: colors.textSecondary, 
    textAlign: 'center', marginBottom: spacing.md,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.error + '20', padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  errorText: { ...typography.bodySmall, color: colors.error, flex: 1 },
  
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryFlag: { fontSize: 20 },
  countryCode: { ...typography.body, color: colors.textPrimary },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 18,
  },
  
  countryPicker: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryOptionText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  countryOptionCode: { ...typography.body, color: colors.textMuted },
  
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning + '15',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
  },
  testBadgeText: { ...typography.caption, color: colors.warning },
  
  terms: {
    ...typography.caption, color: colors.textMuted,
    textAlign: 'center', marginTop: spacing.md, lineHeight: 18,
  },
  link: { color: colors.accent },
});
