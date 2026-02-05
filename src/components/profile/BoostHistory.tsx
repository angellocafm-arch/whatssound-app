/**
 * WhatsSound — BoostHistory
 * Historial de Golden Boosts dados y recibidos
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { supabase } from '../../lib/supabase';

interface BoostRecord {
  id: string;
  type: 'given' | 'received';
  userId: string;
  userName: string;
  userAvatar?: string;
  sessionName?: string;
  createdAt: Date;
}

interface BoostHistoryProps {
  userId: string;
  mode?: 'given' | 'received' | 'all';
  limit?: number;
}

export function BoostHistory({ userId, mode = 'all', limit = 20 }: BoostHistoryProps) {
  const [records, setRecords] = useState<BoostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'given' | 'received'>(
    mode === 'all' ? 'received' : mode
  );

  useEffect(() => {
    loadHistory();
  }, [userId, activeTab]);

  const loadHistory = async () => {
    setLoading(true);

    if (activeTab === 'received') {
      // Boosts recibidos (soy el DJ)
      const { data } = await supabase
        .from('ws_golden_boosts')
        .select(`
          id, created_at, session_id,
          from_user:from_user_id(id, display_name, avatar_url),
          session:session_id(name)
        `)
        .eq('to_dj_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      setRecords(
        (data || []).map((b: { id: string; from_user?: { display_name?: string }; to_user?: { display_name?: string }; created_at: string }) => ({
          id: b.id,
          type: 'received',
          userId: b.from_user?.id,
          userName: b.from_user?.display_name || 'Usuario',
          userAvatar: b.from_user?.avatar_url,
          sessionName: b.session?.name,
          createdAt: new Date(b.created_at),
        }))
      );
    } else {
      // Boosts dados (yo di el boost)
      const { data } = await supabase
        .from('ws_golden_boosts')
        .select(`
          id, created_at, session_id,
          to_dj:to_dj_id(id, display_name, dj_name, avatar_url),
          session:session_id(name)
        `)
        .eq('from_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      setRecords(
        (data || []).map((b: { id: string; from_user?: { display_name?: string }; to_user?: { display_name?: string }; created_at: string }) => ({
          id: b.id,
          type: 'given',
          userId: b.to_dj?.id,
          userName: b.to_dj?.dj_name || b.to_dj?.display_name || 'DJ',
          userAvatar: b.to_dj?.avatar_url,
          sessionName: b.session?.name,
          createdAt: new Date(b.created_at),
        }))
      );
    }

    setLoading(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const renderItem = ({ item }: { item: BoostRecord }) => (
    <View style={styles.item}>
      {item.userAvatar ? (
        <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>
            {item.userName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.userName}</Text>
        {item.sessionName && (
          <Text style={styles.itemSession}>en {item.sessionName}</Text>
        )}
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
        <Text style={styles.itemIcon}>⭐</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      {mode === 'all' && (
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'received' && styles.tabActive]}
            onPress={() => setActiveTab('received')}
          >
            <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
              Recibidos
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'given' && styles.tabActive]}
            onPress={() => setActiveTab('given')}
          >
            <Text style={[styles.tabText, activeTab === 'given' && styles.tabTextActive]}>
              Dados
            </Text>
          </Pressable>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'received'
              ? 'Aún no has recibido Golden Boosts'
              : 'Aún no has dado ningún Golden Boost'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
  },
  tabActive: {
    backgroundColor: '#FFD700',
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  loading: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  itemSession: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  itemIcon: {
    fontSize: 20,
  },
});
