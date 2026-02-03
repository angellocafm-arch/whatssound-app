/**
 * WhatsSound — Compartir Sesión (QR Flyer)
 * Tarjeta visual tipo evento/flyer con QR y botones de compartir
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';

// ─── Main Screen ─────────────────────────────────────────────

export default function ShareQRScreen() {
  const router = useRouter();
  const { id, name, dj, genre, sessionId } = useLocalSearchParams<{ id: string; name: string; dj: string; genre: string; sessionId: string }>();
  const [copied, setCopied] = useState(false);
  const [sessionData, setSessionData] = useState<{ name: string; djName: string; genre: string } | null>(null);

  // Cargar datos de sesión si no se pasan por params
  React.useEffect(() => {
    const sid = sessionId || id;
    if (sid && !name) {
      (async () => {
        const { data } = await supabase
          .from('ws_sessions')
          .select('name, genres, dj:ws_profiles!dj_id(display_name, dj_name)')
          .eq('id', sid)
          .single();
        if (data) {
          setSessionData({
            name: data.name,
            djName: (data.dj as any)?.dj_name || (data.dj as any)?.display_name || 'DJ',
            genre: data.genres?.[0] || 'Música',
          });
        }
      })();
    }
  }, [id, sessionId, name]);

  const actualId = sessionId || id || 'abc123';
  const sessionName = sessionData?.name || name || 'Sesión WhatsSound';
  const djName = sessionData?.djName || dj || 'DJ';
  const sessionGenre = sessionData?.genre || genre || 'Música';
  const sessionUrl = `whatssound.app/s/${actualId}`;

  const handleShare = async () => {
    await Share.share({
      message: `🎧 ¡Únete a "${sessionName}" con ${djName} en WhatsSound!\n\n🎵 ${sessionGenre}\n🔗 https://${sessionUrl}`,
    });
  };

  const handleCopy = () => {
    if (Platform.OS === 'web' && navigator.clipboard) {
      navigator.clipboard.writeText(`https://${sessionUrl}`);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`🎧 ¡Únete a "${sessionName}" con ${djName}!\nhttps://${sessionUrl}`);
    const url = `https://wa.me/?text=${text}`;
    if (Platform.OS === 'web') window.open(url, '_blank');
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(`🎧 Escuchando "${sessionName}" con @${djName.replace(/\s/g, '')} en @WhatsSound 🔥\nhttps://${sessionUrl}`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    if (Platform.OS === 'web') window.open(url, '_blank');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compartir sesión</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Flyer Card ── */}
      <View style={styles.flyerWrapper}>
        <View style={styles.flyerCard}>
          {/* Top accent bar */}
          <View style={styles.flyerAccent} />

          {/* Content */}
          <View style={styles.flyerContent}>
            {/* Genre tag */}
            <View style={styles.genreTag}>
              <Text style={styles.genreTagText}>{sessionGenre}</Text>
            </View>

            {/* Session name */}
            <Text style={styles.flyerTitle}>{sessionName}</Text>

            {/* DJ */}
            <View style={styles.djRow}>
              <View style={styles.djMiniAvatar}>
                <Text style={styles.djMiniInitials}>{djName.split(' ').map(w => w[0]).join('').slice(0, 2)}</Text>
              </View>
              <View>
                <Text style={styles.flyerDj}>{djName}</Text>
                <Text style={styles.flyerDjSub}>DJ · WhatsSound</Text>
              </View>
            </View>

            {/* QR Code */}
            <View style={styles.qrSection}>
              <View style={styles.qrOuter}>
                <View style={styles.qrCode}>
                  {/* QR pattern placeholder — looks like a real QR */}
                  <View style={styles.qrPattern}>
                    {/* Corner squares */}
                    <View style={[styles.qrCorner, { top: 0, left: 0 }]}>
                      <View style={styles.qrCornerInner} />
                    </View>
                    <View style={[styles.qrCorner, { top: 0, right: 0 }]}>
                      <View style={styles.qrCornerInner} />
                    </View>
                    <View style={[styles.qrCorner, { bottom: 0, left: 0 }]}>
                      <View style={styles.qrCornerInner} />
                    </View>
                    {/* Data dots */}
                    {Array.from({ length: 49 }).map((_, i) => {
                      const row = Math.floor(i / 7);
                      const col = i % 7;
                      // Skip corner areas
                      if (row < 2 && col < 2) return null;
                      if (row < 2 && col > 4) return null;
                      if (row > 4 && col < 2) return null;
                      const show = Math.random() > 0.35;
                      if (!show) return null;
                      return (
                        <View
                          key={i}
                          style={[
                            styles.qrDot,
                            { top: 12 + row * 16, left: 12 + col * 16 },
                          ]}
                        />
                      );
                    })}
                    {/* Center logo */}
                    <View style={styles.qrCenterLogo}>
                      <Ionicons name="headset" size={20} color={colors.textOnPrimary} />
                    </View>
                  </View>
                </View>
              </View>
              <Text style={styles.qrHint}>Escanea para unirte</Text>
            </View>

            {/* URL */}
            <View style={styles.urlRow}>
              <Ionicons name="link-outline" size={14} color={colors.accent} />
              <Text style={styles.urlText}>{sessionUrl}</Text>
            </View>
          </View>

          {/* Bottom branding */}
          <View style={styles.flyerBranding}>
            <Ionicons name="headset" size={14} color={colors.primary} />
            <Text style={styles.brandingText}>WhatsSound</Text>
          </View>
        </View>
      </View>

      {/* ── Share Buttons ── */}
      <View style={styles.shareSection}>
        {/* Primary actions */}
        <View style={styles.shareRow}>
          <TouchableOpacity style={styles.shareMainBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.textOnPrimary} />
            <Text style={styles.shareMainBtnText}>Compartir enlace</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareCopyBtn, copied && styles.shareCopyBtnActive]}
            onPress={handleCopy}
          >
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={copied ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Social buttons */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#25D366' + '20' }]} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={26} color="#25D366" />
            <Text style={styles.socialLabel}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#E4405F' + '20' }]}>
            <Ionicons name="logo-instagram" size={26} color="#E4405F" />
            <Text style={styles.socialLabel}>Stories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#1DA1F2' + '20' }]} onPress={handleTwitter}>
            <Ionicons name="logo-twitter" size={26} color="#1DA1F2" />
            <Text style={styles.socialLabel}>Twitter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.surfaceLight }]} onPress={handleShare}>
            <Ionicons name="ellipsis-horizontal" size={26} color={colors.textSecondary} />
            <Text style={styles.socialLabel}>Más</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.textPrimary },

  // Flyer
  flyerWrapper: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  flyerCard: {
    width: '100%', maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  flyerAccent: { height: 4, backgroundColor: colors.primary },
  flyerContent: { padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  genreTag: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  genreTagText: { ...typography.captionBold, color: colors.primary, letterSpacing: 0.5 },
  flyerTitle: { ...typography.h1, color: colors.textPrimary, textAlign: 'center' },
  djRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  djMiniAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary + '25', alignItems: 'center', justifyContent: 'center',
  },
  djMiniInitials: { ...typography.captionBold, color: colors.primary },
  flyerDj: { ...typography.bodyBold, color: colors.textPrimary },
  flyerDjSub: { ...typography.caption, color: colors.textMuted },

  // QR
  qrSection: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  qrOuter: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
  },
  qrCode: { width: 140, height: 140 },
  qrPattern: { width: 140, height: 140, position: 'relative' },
  qrCorner: {
    position: 'absolute', width: 28, height: 28,
    borderWidth: 3, borderColor: '#1A1A1A', borderRadius: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  qrCornerInner: { width: 12, height: 12, backgroundColor: '#1A1A1A', borderRadius: 1 },
  qrDot: {
    position: 'absolute', width: 8, height: 8,
    backgroundColor: '#1A1A1A', borderRadius: 1,
  },
  qrCenterLogo: {
    position: 'absolute', top: '50%', left: '50%',
    marginTop: -14, marginLeft: -14,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  qrHint: { ...typography.caption, color: colors.textMuted },

  // URL
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  urlText: { ...typography.bodySmall, color: colors.accent },

  // Branding
  flyerBranding: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm, backgroundColor: colors.surfaceDark,
  },
  brandingText: { ...typography.captionBold, color: colors.textMuted },

  // Share
  shareSection: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg },
  shareRow: { flexDirection: 'row', gap: spacing.sm },
  shareMainBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  shareMainBtnText: { ...typography.button, color: colors.textOnPrimary },
  shareCopyBtn: {
    width: 48, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  shareCopyBtnActive: { borderColor: colors.primary },

  // Social
  socialRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  socialBtn: {
    flex: 1, alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.md, borderRadius: borderRadius.lg,
  },
  socialLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
});
