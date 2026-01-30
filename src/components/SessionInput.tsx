/**
 * SessionInput — Message input bar with send button and optional music actions
 */
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

export interface SessionInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isChatMode: boolean;
  onSearchPress: () => void;
  onQueuePress: () => void;
}

export const SessionInput: React.FC<SessionInputProps> = ({
  value, onChangeText, onSend, isChatMode, onSearchPress, onQueuePress,
}) => (
  <View style={styles.inputBar}>
    {!isChatMode && (
      <TouchableOpacity style={styles.inputBtn} onPress={onSearchPress}>
        <Ionicons name="search" size={24} color={colors.primary} />
      </TouchableOpacity>
    )}
    {!isChatMode && (
      <TouchableOpacity style={styles.inputBtn} onPress={onQueuePress}>
        <Ionicons name="list" size={24} color={colors.accent} />
      </TouchableOpacity>
    )}
    <TextInput
      style={styles.textInput}
      placeholder="Escribe un mensaje..."
      placeholderTextColor={colors.textMuted}
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSend}
      returnKeyType="send"
    />
    <TouchableOpacity
      style={[styles.inputBtn, styles.sendBtn]}
      onPress={onSend}
      activeOpacity={0.7}
    >
      <Ionicons name="send" size={22} color={colors.textOnPrimary} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    gap: spacing.xs,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  inputBtn: { padding: spacing.xs },
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
});
