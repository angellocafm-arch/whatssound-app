/**
 * WhatsSound — Deep Link Landing
 * Maneja sesiones y invitaciones de contactos
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';
import { supabase } from '../../src/lib/supabase';
import { isDemoMode } from '../../src/lib/demo';

interface InviteData {
  id: string;
  code: string;
  creator_name: string;
  creator_avatar: string | null;
  invitee_name: string;
  invitee_country: string;
  created_at: string;
  used_by: string | null;
}

const COUNTRY_FLAGS: Record<string, string> = {
  ES: '🇪🇸', MX: '🇲🇽', AR: '🇦🇷', CO: '🇨🇴', PE: '🇵🇪',
  CL: '🇨🇱', BR: '🇧🇷', US: '🇺🇸', FR: '🇫🇷', IT: '🇮🇹',
  DE: '🇩🇪', UK: '🇬🇧', CA: '🇨🇦', JP: '🇯🇵', KR: '🇰🇷',
};

export default function DeepLinkScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContactInvite, setIsContactInvite] = useState(false);

  useEffect(() => {
    if (code) {
      checkInviteCode(code as string);
    } else {
      setLoading(false);
    }
  }, [code]);

  const checkInviteCode = async (inviteCode: string) => {
    try {
      if (isDemoMode()) {
        // Modo demo: simular invitación de contacto
        if (inviteCode.length === 8) {
          setInviteData({
            id: 'demo-1',
            code: inviteCode,
            creator_name: 'DJ Carlos Madrid',
            creator_avatar: null,
            invitee_name: 'María',
            invitee_country: 'ES',
            created_at: new Date().toISOString(),
            used_by: null,
          });
          setIsContactInvite(true);
        }
        setLoading(false);
        return;
      }

      // Verificar si es una invitación de contacto
      const { data: invite, error } = await supabase
        .from('ws_invites')
        .select(`
          id,
          code,
          creator_id,
          invitee_name,
          invitee_country,
          created_at,
          used_by,
          creator:ws_profiles(display_name, avatar_url)
        `)
        .eq('code', inviteCode.toUpperCase())
        .single();

      if (!error && invite) {
        setInviteData({
          id: invite.id,
          code: invite.code,
          creator_name: invite.creator?.display_name || 'Usuario',
          creator_avatar: invite.creator?.avatar_url || null,
          invitee_name: invite.invitee_name,
          invitee_country: invite.invitee_country,
          created_at: invite.created_at,
          used_by: invite.used_by,
        });
        setIsContactInvite(true);
      } else {
        // No es invitación de contacto, mantener como sesión
        setIsContactInvite(false);
      }
    } catch (error) {
      console.error('Error checking invite code:', error);
      setIsContactInvite(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApp = () => {
    // TODO: Implementar deep linking real
    // Por ahora solo placeholder
    console.log('Opening app with code:', code);
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center' }]}>
        <Ionicons name="headset" size={48} color={colors.primary} />
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.base }]}>
          Cargando...
        </Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Logo */}
      <View style={s.logoWrap}>
        <Ionicons name="headset" size={48} color={colors.primary} />
      </View>
      <Text style={s.brand}>WhatsSound</Text>

      {isContactInvite && inviteData ? (
        /* Contact Invite Preview */
        <View style={s.card}>
          <View style={s.inviteIcon}>
            <Ionicons name="person-add" size={28} color={colors.primary} />
          </View>
          
          <Text style={s.inviteTitle}>Invitación de contacto</Text>
          
          <View style={s.inviteInfo}>
            <Avatar size={50} name={inviteData.creator_name} uri={inviteData.creator_avatar} />
            <View style={s.inviteDetails}>
              <Text style={s.inviterName}>{inviteData.creator_name}</Text>
              <Text style={s.inviteText}>
                te invitó a chatear en WhatsSound
              </Text>
            </View>
          </View>

          <View style={s.inviteeInfo}>
            <Text style={s.inviteLabel}>Para:</Text>
            <View style={s.inviteeRow}>
              <Text style={s.inviteeName}>{inviteData.invitee_name}</Text>
              <Text style={s.countryFlag}>
                {COUNTRY_FLAGS[inviteData.invitee_country] || '🌍'}
              </Text>
            </View>
          </View>

          {inviteData.used_by ? (
            <View style={s.usedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={s.usedText}>Invitación ya utilizada</Text>
            </View>
          ) : (
            <Text style={s.code}>Código: {inviteData.code}</Text>
          )}
        </View>
      ) : (
        /* Session preview */
        <View style={s.card}>
          <View style={s.sessionIcon}>
            <Ionicons name="radio" size={28} color={colors.primary} />
          </View>
          <Text style={s.sessionName}>Viernes Latino 🔥</Text>
          <Text style={s.sessionInfo}>DJ Carlos Madrid · Reggaeton</Text>
          <View style={s.statsRow}>
            <Text style={s.stat}>👥 47 personas</Text>
            <Text style={s.stat}>🎵 En vivo</Text>
          </View>
          <Text style={s.code}>Código: {code || 'WSND-4521'}</Text>
        </View>
      )}

      {/* Open button */}
      <TouchableOpacity style={s.openBtn} onPress={handleOpenApp}>
        <Ionicons name="headset" size={20} color="#fff" />
        <Text style={s.openText}>Abrir en WhatsSound</Text>
      </TouchableOpacity>

      {/* Install */}
      <Text style={s.orText}>¿No tienes la app?</Text>
      <View style={s.storeRow}>
        <TouchableOpacity style={s.storeBtn}>
          <Ionicons name="logo-apple" size={20} color="#fff" />
          <Text style={s.storeText}>App Store</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.storeBtn}>
          <Ionicons name="logo-google-playstore" size={20} color="#fff" />
          <Text style={s.storeText}>Google Play</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  logoWrap: { width: 80, height: 80, borderRadius: 20, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  brand: { ...typography.h1, color: colors.textPrimary, fontSize: 28, marginBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl, width: '100%', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  
  // Session styles
  sessionIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  sessionName: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  sessionInfo: { ...typography.bodySmall, color: colors.textSecondary, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: spacing.lg },
  stat: { ...typography.captionBold, color: colors.textMuted, fontSize: 12 },
  
  // Contact invite styles
  inviteIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  inviteTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 18, marginBottom: spacing.sm },
  inviteInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.base, marginBottom: spacing.md },
  inviteDetails: { flex: 1, alignItems: 'flex-start' },
  inviterName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 16 },
  inviteText: { ...typography.caption, color: colors.textSecondary, fontSize: 13 },
  inviteeInfo: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  inviteLabel: { ...typography.caption, color: colors.textMuted, fontSize: 12 },
  inviteeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inviteeName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 16 },
  countryFlag: { fontSize: 18 },
  usedBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.success + '20', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.lg },
  usedText: { ...typography.caption, color: colors.success, fontSize: 12 },
  
  // Common styles
  code: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginTop: spacing.sm },
  openBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: borderRadius.lg, width: '100%', justifyContent: 'center', marginBottom: spacing.lg },
  openText: { ...typography.button, color: '#fff', fontSize: 16 },
  orText: { ...typography.bodySmall, color: colors.textMuted, marginBottom: spacing.md },
  storeRow: { flexDirection: 'row', gap: spacing.sm },
  storeBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surface, paddingHorizontal: 20, paddingVertical: 12, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
  storeText: { ...typography.buttonSmall, color: colors.textPrimary, fontSize: 13 },
});
