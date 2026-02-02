/**
 * SessionChat — WhatsApp-style chat with role badges (DJ, VIP, Mod)
 * Burbujas con colores del design system
 */
import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { SongCard, parseSongCard } from './SongCard';

export interface ChatMessage {
  id: string;
  user: string;
  userId: string;
  text: string;
  isSystem: boolean;
  isDJ: boolean;
  isMine: boolean;
  time: string;
  fromDB?: boolean;
  role?: 'dj' | 'vip' | 'mod';
}

// WhatsApp-style user colors
const USER_COLORS = [
  '#ff6b9d', '#c084fc', '#fb923c', '#34d399', '#f472b6',
  '#a78bfa', '#fbbf24', '#22d3ee', '#f87171', '#4ade80',
];
const userColorMap = new Map<string, string>();
let colorIndex = 0;

function getUserColor(userId: string): string {
  if (!userColorMap.has(userId)) {
    userColorMap.set(userId, USER_COLORS[colorIndex % USER_COLORS.length]);
    colorIndex++;
  }
  return userColorMap.get(userId)!;
}

// Role Badge component
const RoleBadge = ({ role }: { role: 'dj' | 'vip' | 'mod' }) => {
  const config = {
    dj: { label: '🎧 DJ', bg: colors.primary + '30', color: colors.primary },
    vip: { label: '⭐ VIP', bg: '#FFA72630', color: '#FFA726' },
    mod: { label: '🛡️ MOD', bg: colors.accent + '30', color: colors.accent },
  }[role];
  return (
    <View style={[styles.roleBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.roleBadgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const MessageBubble = ({ message, onVoteSong }: { message: ChatMessage; onVoteSong: (id: string, vote: 'up' | 'down') => void }) => {
  if (message.isSystem) {
    const songData = parseSongCard(message.text);
    if (songData) {
      return <SongCard song={songData} message={message} onVote={onVoteSong} />;
    }
    return (
      <View style={styles.systemMessage}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  const role = message.role || (message.isDJ ? 'dj' : undefined);

  return (
    <View style={[styles.bubbleRow, message.isMine ? styles.bubbleRowMine : styles.bubbleRowOther]}>
      <View style={[
        styles.bubble,
        message.isMine
          ? styles.bubbleMine
          : [styles.bubbleOther, { borderLeftColor: getUserColor(message.userId) }],
      ]}>
        {!message.isMine && (
          <View style={styles.bubbleHeader}>
            <Text style={[styles.userName, { color: getUserColor(message.userId) }]}>{message.user}</Text>
            {role && <RoleBadge role={role} />}
          </View>
        )}
        <Text style={styles.messageText}>{message.text}</Text>
        <Text style={[styles.messageTime, message.isMine && styles.messageTimeMine]}>{message.time}</Text>
      </View>
    </View>
  );
};

export interface SessionChatProps {
  messages: ChatMessage[];
  loading: boolean;
  error: boolean;
  flatListRef: React.RefObject<FlatList | null>;
}

export const SessionChat: React.FC<SessionChatProps> = ({ messages, loading, error, flatListRef }) => (
  <FlatList
    ref={flatListRef}
    data={messages}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <MessageBubble message={item} onVoteSong={(msgId, vote) => { console.log('Vote', msgId, vote); }} />}
    contentContainerStyle={[styles.messagesList, messages.length === 0 && { flex: 1 }]}
    showsVerticalScrollIndicator={false}
    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
    ListHeaderComponent={
      loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Cargando chat...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
          <Text style={styles.stateText}>Error al cargar mensajes</Text>
        </View>
      ) : null
    }
    ListEmptyComponent={
      !loading && !error ? (
        <View style={styles.centerState}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textMuted} />
          <Text style={styles.stateTitle}>Sin mensajes aún</Text>
          <Text style={styles.stateText}>¡Sé el primero en escribir!</Text>
        </View>
      ) : null
    }
  />
);

const styles = StyleSheet.create({
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: colors.bubbleSystem,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginVertical: spacing.xs,
  },
  systemText: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  bubbleRow: { flexDirection: 'row', marginVertical: 2 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: '80%',
  },
  bubbleMine: {
    backgroundColor: colors.bubbleOwn,
    borderTopRightRadius: 4,
    borderRightWidth: 3,
    borderRightColor: colors.primary,
  },
  bubbleOther: {
    backgroundColor: colors.bubbleOther,
    borderTopLeftRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  userName: { ...typography.captionBold, color: '#53bdeb', fontSize: 12 },
  messageTime: { ...typography.caption, color: 'rgba(255,255,255,0.5)', fontSize: 10, alignSelf: 'flex-end', marginTop: 2 },
  messageTimeMine: { color: 'rgba(255,255,255,0.6)' },
  messageText: { ...typography.body, color: '#e9edef', fontSize: 15 },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['3xl'], gap: spacing.sm },
  stateTitle: { ...typography.h3, color: colors.textPrimary },
  stateText: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center' },
});
