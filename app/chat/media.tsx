/**
 * WhatsSound — Medios compartidos
 * Clean empty state — no mock data
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

if (Platform.OS === 'web') {
  const s = document.createElement('style');
  s.textContent = '@font-face{font-family:"Ionicons";src:url("/Ionicons.ttf") format("truetype")}';
  if (!document.querySelector('style[data-ionicons-fix]')) { s.setAttribute('data-ionicons-fix','1'); document.head.appendChild(s); }
}

export default function MediaScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medios compartidos</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.emptyState}>
        <Ionicons name="images-outline" size={64} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No hay media compartida aún</Text>
        <Text style={styles.emptySub}>Las fotos, videos y archivos compartidos aparecerán aquí</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.sm,
  },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl,
  },
  emptyTitle: { ...typography.h3, color: colors.textPrimary },
  emptySub: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
