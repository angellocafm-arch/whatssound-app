/**
 * WhatsSound — Session Chat Component
 * Chat en vivo de la sesión
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  avatar?: string;
}

interface SessionChatProps {
  messages: ChatMessage[];
  inputValue?: string;
  onInputChange?: (text: string) => void;
  onSend?: () => void;
  placeholder?: string;
  showInput?: boolean;
  maxHeight?: number;
}

export const SessionChat: React.FC<SessionChatProps> = ({
  messages,
  inputValue = '',
  onInputChange,
  onSend,
  placeholder = 'Escribe un mensaje...',
  showInput = true,
  maxHeight = 300,
}) => {
  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={styles.messageCard}>
      <Text style={styles.avatar}>{item.avatar || '👤'}</Text>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.userName}>{item.user}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💬 Chat en vivo</Text>
      
      <View style={[styles.chatContainer, { maxHeight }]}>
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay mensajes aún</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            inverted
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {showInput && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            value={inputValue}
            onChangeText={onInputChange}
            onSubmitEditing={onSend}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={onSend}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chatContainer: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  messageCard: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  avatar: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  messageText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SessionChat;
