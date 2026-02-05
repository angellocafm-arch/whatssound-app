/**
 * WhatsSound — Input Component
 * Input reutilizable con label y error
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  leftIcon,
  rightIcon,
  containerStyle,
  ...rest
}) => {
  const resolvedLeftIcon = leftIcon || icon;
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {resolvedLeftIcon && <View style={styles.iconLeft}>{resolvedLeftIcon}</View>}
        <TextInput
          style={[styles.input, resolvedLeftIcon ? styles.inputWithLeftIcon : undefined]}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete="off"
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          {...rest}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 48,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.xs,
  },
  iconLeft: {
    paddingLeft: spacing.md,
  },
  iconRight: {
    paddingRight: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
