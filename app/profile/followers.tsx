/**
 * WhatsSound — Seguidores / Siguiendo
 * Lista con tabs, avatar, nombre, botón seguir
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';

interface UserItem {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isFollowing: boolean;
}

const FOLLOWERS: UserItem[] = [
  { id: '1', name: 'DJ Blaze', username: '@djblaze', isFollowing: true },
  { id: '2', name: 'María López', username: '@mariamusic', isFollowing: false },
  { id: '3', name: 'Carlos Beat', username: '@carlosbeat', isFollowing: true },
  { id: '4', name: 'Luna Sound', username: '@lunasound', isFollowing: false },
  { id: '5', name: 'Pedro Mix', username: '@pedromix', isFollowing: true },
  { id: '6', name: 'Ana Vibe', username: '@anavibe', isFollowing: false },
  { id: '7', name: 'Ricky Flow', username: '@rickyflow', isFollowing: false },
  { id: '8', name: 'Sara Beats', username: '@sarabeats', isFollowing: true },
];

const FOLLOWING: UserItem[] = [
  { id: '10', name: 'DJ Blaze', username: '@djblaze', isFollowing: true },
  { id: '11', name: 'Carlos Beat', username: '@carlosbeat', isFollowing: true },
  { id: '12', name: 'Pedro Mix', username: '@pedromix', isFollowing: true },
  { id: '13', name: 'Sara Beats', username: '@sarabeats', isFollowing: true },
  { id: '14', name: 'Neon Tracks', username: '@neontracks', isFollowing: true },
];

type Tab = 'followers' | 'following';

export default function FollowersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('followers');
  const [followers, setFollowers] = useState(FOLLOWERS);
  const [following, setFollowing] = useState(FOLLOWING);

  const data = activeTab === 'followers' ? followers : following;

  const toggleFollow = (id: string) => {
    const update = (list: UserItem[]) =>
      list.map(u => u.id === id ? { ...u, isFollowing: !u.isFollowing } : u);
    if (activeTab === 'followers') setFollowers(update(followers));
    else setFollowing(update(following));
  };

  const renderUser = ({ item }: { item: UserItem }) => (
    <View style={styles.userRow}>
      <Avatar size="md" name={item.name} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userHandle}>{item.username}</Text>
      </View>
      <TouchableOpacity
        style={[styles.followBtn, item.isFollowing && styles.followingBtn]}
        onPress={() => toggleFollow(item.id)}
      >
        <Text style={[styles.followBtnText, item.isFollowing && styles.followingBtnText]}>
          {item.isFollowing ? 'Siguiendo' : 'Seguir'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seguidores</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.tabActive]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.tabTextActive]}>
            Seguidores · {followers.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.tabActive]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
            Siguiendo · {following.length}
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  userName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  userHandle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  followBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  followBtnText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  followingBtnText: {
    color: colors.textSecondary,
  },
});
