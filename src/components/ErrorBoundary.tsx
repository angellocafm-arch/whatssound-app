/**
 * WhatsSound — Error Boundary Global
 * Captura errores de React y los envía a Sentry
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { captureError } from '../lib/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enviar a Sentry con contexto adicional
    captureError(error, {
      componentStack: errorInfo.componentStack,
      source: 'ErrorBoundary',
    });
    
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={64} color={colors.warning} />
          </View>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.message}>
            Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.
          </Text>
          {__DEV__ && this.state.error && (
            <View style={styles.debugBox}>
              <Text style={styles.debugText}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  debugBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    maxWidth: '100%',
  },
  debugText: {
    ...typography.caption,
    color: colors.error,
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryText: {
    ...typography.button,
    color: '#fff',
  },
});

export default ErrorBoundary;
