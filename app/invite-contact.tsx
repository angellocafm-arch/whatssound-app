/**
 * WhatsSound — Invitar Contacto por Link
 * Genera links de invitación para nuevos contactos
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/stores/authStore';
import { isDemoMode, isTestMode } from '../src/lib/demo';

// Lista de países comunes
const COUNTRIES = [
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'UK', name: 'Reino Unido', flag: '🇬🇧' },
];

interface CountryPickerProps {
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
  visible: boolean;
  onClose: () => void;
}

const CountryPicker = ({ selectedCountry, onSelectCountry, visible, onClose }: CountryPickerProps) => {
  if (!visible) return null;

  return (
    <View style={s.overlay}>
      <View style={s.pickerContainer}>
        <View style={s.pickerHeader}>
          <Text style={s.pickerTitle}>Seleccionar país</Text>
          <TouchableOpacity onPress={onClose} style={s.pickerClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={s.pickerList}>
          {COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country.code}
              style={[
                s.countryItem,
                selectedCountry === country.code && s.countryItemSelected
              ]}
              onPress={() => {
                onSelectCountry(country.code);
                onClose();
              }}
            >
              <Text style={s.countryFlag}>{country.flag}</Text>
              <Text style={s.countryName}>{country.name}</Text>
              {selectedCountry === country.code && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function InviteContactScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [inviteeName, setInviteeName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ES');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedCountryData = COUNTRIES.find(c => c.code === selectedCountry) || COUNTRIES[0];

  const handleGenerateLink = async () => {
    if (!inviteeName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del contacto');
      return;
    }

    setLoading(true);

    try {
      const code = generateInviteCode();
      
      if (isDemoMode()) {
        // Modo demo: generar link fake
        const demoLink = `https://whatssound-app.vercel.app/join/${code}`;
        setGeneratedLink(demoLink);
        return;
      }

      if (!user?.id) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      // Crear invitación en Supabase
      const { data, error } = await supabase
        .from('ws_invites')
        .insert({
          code: code,
          creator_id: user.id,
          invitee_name: inviteeName.trim(),
          invitee_country: selectedCountry,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Código duplicado, intentar de nuevo
          handleGenerateLink();
          return;
        }
        throw error;
      }

      const link = `https://whatssound-app.vercel.app/join/${code}`;
      setGeneratedLink(link);

    } catch (error) {
      console.error('Error generating invite:', error);
      Alert.alert('Error', 'No se pudo generar el link de invitación');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;

    try {
      await Clipboard.setString(generatedLink);
      Alert.alert('¡Copiado!', 'Link copiado al portapapeles');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleShareLink = async () => {
    if (!generatedLink) return;

    try {
      const message = `¡Únete a WhatsSound! ${inviteeName}, te invito a chatear conmigo:\n\n${generatedLink}`;
      
      const result = await Share.share({
        message: message,
        url: generatedLink,
        title: 'Invitación a WhatsSound',
      });

      if (result.action === Share.sharedAction) {
        // Compartido exitosamente
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const resetForm = () => {
    setInviteeName('');
    setSelectedCountry('ES');
    setGeneratedLink('');
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Invitar contacto</Text>
        <View style={s.placeholder} />
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {!generatedLink ? (
          /* Form */
          <View style={s.form}>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Información del contacto</Text>
              <Text style={s.sectionSubtitle}>
                Enviaremos una invitación personalizada con su nombre
              </Text>
            </View>

            <View style={s.inputContainer}>
              <Text style={s.inputLabel}>Nombre</Text>
              <TextInput
                style={s.textInput}
                placeholder="Ej: María García"
                placeholderTextColor={colors.textMuted}
                value={inviteeName}
                onChangeText={setInviteeName}
                maxLength={50}
              />
            </View>

            <View style={s.inputContainer}>
              <Text style={s.inputLabel}>País</Text>
              <TouchableOpacity
                style={s.countrySelector}
                onPress={() => setShowCountryPicker(true)}
                activeOpacity={0.7}
              >
                <View style={s.countryDisplay}>
                  <Text style={s.countryFlag}>{selectedCountryData.flag}</Text>
                  <Text style={s.countryText}>{selectedCountryData.name}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.generateButton, !inviteeName.trim() && s.generateButtonDisabled]}
              onPress={handleGenerateLink}
              disabled={!inviteeName.trim() || loading}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="link" 
                size={20} 
                color={inviteeName.trim() ? colors.textOnPrimary : colors.textMuted} 
              />
              <Text style={[
                s.generateButtonText,
                !inviteeName.trim() && s.generateButtonTextDisabled
              ]}>
                {loading ? 'Generando...' : 'Generar link de invitación'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Generated Link */
          <View style={s.generatedContainer}>
            <View style={s.successIcon}>
              <Ionicons name="checkmark" size={32} color={colors.success} />
            </View>
            
            <Text style={s.successTitle}>¡Link generado!</Text>
            <Text style={s.successSubtitle}>
              Comparte este link con {inviteeName} para que se una a WhatsSound
            </Text>

            <View style={s.linkContainer}>
              <Text style={s.linkText} numberOfLines={2}>
                {generatedLink}
              </Text>
            </View>

            <View style={s.linkActions}>
              <TouchableOpacity
                style={s.linkActionButton}
                onPress={handleCopyLink}
                activeOpacity={0.7}
              >
                <Ionicons name="copy" size={20} color={colors.primary} />
                <Text style={s.linkActionText}>Copiar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.linkActionButton, s.linkActionButtonPrimary]}
                onPress={handleShareLink}
                activeOpacity={0.7}
              >
                <Ionicons name="share" size={20} color={colors.textOnPrimary} />
                <Text style={[s.linkActionText, s.linkActionTextPrimary]}>Compartir</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={s.newInviteButton}
              onPress={resetForm}
              activeOpacity={0.7}
            >
              <Text style={s.newInviteButtonText}>Crear nueva invitación</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Country Picker Modal */}
      <CountryPicker
        selectedCountry={selectedCountry}
        onSelectCountry={setSelectedCountry}
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 18,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.base,
  },
  form: {
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  textInput: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.base,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  generateButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  generateButtonText: {
    ...typography.bodyBold,
    color: colors.textOnPrimary,
    fontSize: 16,
  },
  generateButtonTextDisabled: {
    color: colors.textMuted,
  },
  generatedContainer: {
    alignItems: 'center',
    paddingTop: spacing['2xl'],
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  linkContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    marginBottom: spacing.lg,
    width: '100%',
  },
  linkText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    width: '100%',
  },
  linkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.base,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  linkActionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  linkActionText: {
    ...typography.bodyBold,
    color: colors.primary,
    fontSize: 14,
  },
  linkActionTextPrimary: {
    color: colors.textOnPrimary,
  },
  newInviteButton: {
    paddingVertical: spacing.sm,
  },
  newInviteButtonText: {
    ...typography.caption,
    color: colors.accent,
    fontSize: 14,
  },
  // Country Picker Modal
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 18,
  },
  pickerClose: {
    padding: spacing.xs,
  },
  pickerList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    gap: spacing.base,
  },
  countryItemSelected: {
    backgroundColor: colors.surfaceLight,
  },
  countryName: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 16,
    flex: 1,
  },
});