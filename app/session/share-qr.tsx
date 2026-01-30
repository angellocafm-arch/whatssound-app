/**
 * WhatsSound — Compartir QR
 * QR de la sesión para invitar gente — reads real session data from route params
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Button } from '../../src/components/ui/Button';

if (Platform.OS === 'web') {
  const s = document.createElement('style');
  s.textContent = '@font-face{font-family:"Ionicons";src:url("/Ionicons.ttf") format("truetype")}';
  if (!document.querySelector('style[data-ionicons-fix]')) { s.setAttribute('data-ionicons-fix','1'); document.head.appendChild(s); }
}

export default function ShareQRScreen() {
  const router = useRouter();
  const { id, name, dj } = useLocalSearchParams<{ id: string; name: string; dj: string }>();

  const sessionName = name || 'Sesión';
  const djName = dj || 'DJ';
  const sessionUrl = `whatssound.app/s/${id || 'unknown'}`;

  const handleShare = async () => {
    await Share.share({
      message: `¡Únete a mi sesión en WhatsSound! 🎧\nhttps://${sessionUrl}`,
    });
  };

  const handleCopy = () => {
    if (Platform.OS === 'web' && navigator.clipboard) {
      navigator.clipboard.writeText(`https://${sessionUrl}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compartir sesión</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sessionName}>{sessionName}</Text>
        <Text style={styles.djName}>{djName}</Text>

        {/* QR Code placeholder */}
        <View style={styles.qrContainer}>
          <View style={styles.qrCode}>
            <View style={styles.qrInner}>
              <Ionicons name="qr-code" size={120} color={colors.primary} />
            </View>
            <View style={styles.qrLogo}>
              <Ionicons name="headset" size={24} color={colors.textOnPrimary} />
            </View>
          </View>
        </View>

        <Text style={styles.link}>{sessionUrl}</Text>

        <View style={styles.shareButtons}>
          <Button title="Compartir enlace" onPress={handleShare} fullWidth size="lg" icon={<Ionicons name="share-outline" size={20} color={colors.textOnPrimary} />} />
          <Button title="Copiar enlace" onPress={handleCopy} variant="secondary" fullWidth icon={<Ionicons name="copy-outline" size={20} color={colors.primary} />} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn}>
            <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
            <Text style={styles.socialText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <Ionicons name="logo-instagram" size={28} color="#E4405F" />
            <Text style={styles.socialText}>Instagram</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <Ionicons name="logo-twitter" size={28} color="#1DA1F2" />
            <Text style={styles.socialText}>Twitter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <Ionicons name="ellipsis-horizontal" size={28} color={colors.textSecondary} />
            <Text style={styles.socialText}>Más</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  sessionName: { ...typography.h2, color: colors.textPrimary },
  djName: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  qrContainer: { marginVertical: spacing['2xl'] },
  qrCode: { width: 220, height: 220, backgroundColor: colors.textPrimary, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  qrInner: { alignItems: 'center', justifyContent: 'center' },
  qrLogo: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  link: { ...typography.bodySmall, color: colors.accent, marginBottom: spacing.xl },
  shareButtons: { width: '100%', gap: spacing.sm, marginBottom: spacing.xl },
  socialRow: { flexDirection: 'row', gap: spacing.lg },
  socialBtn: { alignItems: 'center', gap: spacing.xs },
  socialText: { ...typography.caption, color: colors.textSecondary },
});
