/**
 * SessionChat — Chat message list with bubbles, system messages, and song cards
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

  return (
    <View style={[styles.bubbleRow, message.isMine ? styles.bubbleRowMine : styles.bubbleRowOther]}>
      <View style={[
        styles.bubble,
        message.isMine
          ? styles.bubbleMine
          : [styles.bubbleOther, { borderLeftColor: getUserColor(message.userId) }],
      ]}>
        {!message.isMine && (
          <Text style={[styles.userName, { color: getUserColor(message.userId) }]}>{message.user}</Text>
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
    backgroundColor: '#005c4b',
    borderTopRightRadius: 4,
    borderRightWidth: 3,
    borderRightColor: '#25d366',
  },
  bubbleOther: {
    backgroundColor: '#1f2c34',
    borderTopLeftRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#53bdeb',
  },
  userName: { ...typography.captionBold, color: '#53bdeb', marginBottom: 2 },
  messageTime: { ...typography.caption, color: 'rgba(255,255,255,0.5)', fontSize: 10, alignSelf: 'flex-end', marginTop: 2 },
  messageTimeMine: { color: 'rgba(255,255,255,0.6)' },
  messageText: { ...typography.body, color: '#e9edef', fontSize: 15 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['3xl'], gap: spacing.sm },
  stateTitle: { ...typography.h3, color: colors.textPrimary },
  stateText: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center' },
});
