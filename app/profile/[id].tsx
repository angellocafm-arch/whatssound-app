/**
 * WhatsSound — Perfil de Usuario (Modal card)
 * Conectado a Supabase
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';
import { GoldenBadgeFull } from '../../src/components/profile/GoldenBadge';

interface UserProfile {
  name: string;
  role: string;
  isDj: boolean;
  bio?: string;
  sessions: number;
  votes: number;
  tips: number;
  goldenBoostsReceived: number;
  goldenBadge: 'none' | 'rising_star' | 'fan_favorite' | 'verified' | 'hall_of_fame';
}

export default function ProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Cargar perfil
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data: profile, error } = await supabase
        .from('ws_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !profile) {
        setLoading(false);
        return;
      }

      // Contar sesiones donde participó
      const { count: sessionCount } = await supabase
        .from('ws_session_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id);

      // Contar votos dados
      const { count: voteCount } = await supabase
        .from('ws_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id);

      // Contar decibelios dadas
      const { count: tipCount } = await supabase
        .from('ws_tips')
        .select('*', { count: 'exact', head: true })
        .eq('from_user_id', id);

      setUser({
        name: profile.display_name || profile.username || 'Usuario',
        role: profile.is_dj ? 'DJ' : 'Listener',
        isDj: profile.is_dj || false,
        bio: profile.bio,
        sessions: sessionCount || 0,
        votes: voteCount || 0,
        tips: tipCount || 0,
        goldenBoostsReceived: profile.golden_boosts_received || 0,
        goldenBadge: profile.golden_badge || 'none',
      });
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={s.overlay}>
        <View style={s.card}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => router.back()}>
        <View style={s.card}>
          <Text style={s.name}>Usuario no encontrado</Text>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
            <Text style={s.closeBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => router.back()}>
      <TouchableOpacity style={s.card} activeOpacity={1}>
        {/* Avatar */}
        <View style={s.avatarRing}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Name & Role */}
        <Text style={s.name}>{user.name}</Text>
        <View style={[s.roleBadge, user.isDj && s.djBadge]}>
          <Text style={[s.roleText, user.isDj && s.djText]}>
            {user.isDj ? '🎧 DJ' : user.role}
          </Text>
        </View>

        {/* Bio */}
        {user.bio && (
          <Text style={s.bio} numberOfLines={3}>{user.bio}</Text>
        )}

        {/* Stats */}
        <View style={s.statsRow}>
          <TouchableOpacity style={s.statBox} onPress={() => router.push(`/profile/followers?uid=${id}`)}>
            <Text style={s.statValue}>--</Text>
            <Text style={s.statLabel}>Seguidores</Text>
          </TouchableOpacity>
          <View style={s.statBox}>
            <Text style={s.statValue}>{user.sessions}</Text>
            <Text style={s.statLabel}>Sesiones</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{user.votes}</Text>
            <Text style={s.statLabel}>Votos</Text>
          </View>
        </View>

        {/* Golden Boost Badge */}
        {(user.goldenBoostsReceived > 0 || user.goldenBadge !== 'none') && (
          <View style={{width: '100%', marginBottom: spacing.md}}>
            <GoldenBadgeFull
              count={user.goldenBoostsReceived}
              badge={user.goldenBadge}
              showProgress={true}
            />
          </View>
        )}

        {/* Actions */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.actionBtn}>
            <Ionicons name="chatbubble" size={18} color={colors.primary} />
            <Text style={s.actionText}>Mensaje</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <Ionicons name="person-add" size={18} color={colors.primary} />
            <Text style={s.actionText}>Seguir</Text>
          </TouchableOpacity>
        </View>

        {/* Close */}
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
          <Text style={s.closeBtnText}>Cerrar</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius['2xl'], padding: spacing.xl, alignItems: 'center', width: '100%', maxWidth: 340 },
  avatarRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.h2, color: '#fff', fontSize: 24 },
  name: { ...typography.h2, color: colors.textPrimary, fontSize: 20, marginBottom: spacing.xs },
  roleBadge: { backgroundColor: colors.surfaceLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full, marginBottom: spacing.sm },
  djBadge: { backgroundColor: colors.primary + '20' },
  roleText: { ...typography.captionBold, color: colors.textMuted, fontSize: 12 },
  djText: { color: colors.primary },
  bio: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  statBox: { alignItems: 'center' },
  statValue: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  statLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '15', paddingHorizontal: 16, paddingVertical: 10, borderRadius: borderRadius.full },
  actionText: { ...typography.bodyBold, color: colors.primary, fontSize: 13 },
  closeBtn: { paddingVertical: spacing.sm },
  closeBtnText: { ...typography.body, color: colors.textMuted, fontSize: 14 },
});
