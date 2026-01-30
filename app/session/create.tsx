/**
 * WhatsSound — Crear Sesión (DJ)
 * Formulario para iniciar una nueva sesión como DJ
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useSessionStore } from '../../src/stores/sessionStore';

const GENRES = ['Reggaeton', 'Pop', 'Rock', 'Techno', 'Lo-Fi', 'Hip Hop', 'Indie', 'Jazz', 'Latina', 'Electrónica', 'R&B', 'Clásica'];

export default function CreateSessionScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowRequests, setAllowRequests] = useState(true);
  const [allowChat, setAllowChat] = useState(true);
  const [loading, setLoading] = useState(false);

  const { createSession } = useSessionStore();

  const handleCreate = async () => {
    if (!name.trim()) return;
    // Genre is optional — default to 'Varios'
    setLoading(true);
    const { id, error } = await createSession(name.trim(), selectedGenre || 'Varios');
    setLoading(false);
    if (id) {
      router.replace(`/session/${id}`);
    } else {
      console.warn('Create session error:', error);
      // Stay on page — show error to user
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear sesión</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* DJ icon */}
      <View style={styles.djIcon}>
        <Ionicons name="headset" size={40} color={colors.primary} />
      </View>
      <Text style={styles.djLabel}>Vas a ser el DJ</Text>

      {/* Form */}
      <Input
        label="Nombre de la sesión"
        placeholder="Ej: Viernes Latino 🔥"
        value={name}
        onChangeText={setName}
        maxLength={30}
      />

      {/* Genre selection */}
      <Text style={styles.sectionLabel}>GÉNERO PRINCIPAL</Text>
      <View style={styles.genreGrid}>
        {GENRES.map(genre => (
          <TouchableOpacity
            key={genre}
            style={[styles.genreChip, selectedGenre === genre && styles.genreChipSelected]}
            onPress={() => setSelectedGenre(genre)}
          >
            <Text style={[styles.genreText, selectedGenre === genre && styles.genreTextSelected]}>
              {genre}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Settings */}
      <Text style={styles.sectionLabel}>CONFIGURACIÓN</Text>
      <View style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="globe-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.settingText}>Sesión pública</Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: colors.surfaceLight, true: colors.primary + '60' }}
            thumbColor={isPublic ? colors.primary : colors.textMuted}
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="musical-notes-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.settingText}>Permitir peticiones</Text>
          </View>
          <Switch
            value={allowRequests}
            onValueChange={setAllowRequests}
            trackColor={{ false: colors.surfaceLight, true: colors.primary + '60' }}
            thumbColor={allowRequests ? colors.primary : colors.textMuted}
          />
        </View>
        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={styles.settingInfo}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.settingText}>Chat habilitado</Text>
          </View>
          <Switch
            value={allowChat}
            onValueChange={setAllowChat}
            trackColor={{ false: colors.surfaceLight, true: colors.primary + '60' }}
            thumbColor={allowChat ? colors.primary : colors.textMuted}
          />
        </View>
      </View>

      <Button
        title="🎧 Iniciar sesión"
        onPress={handleCreate}
        fullWidth
        size="lg"
        loading={loading}
        disabled={!name.trim() || !selectedGenre}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  djIcon: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  djLabel: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  genreChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  genreChipSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  genreText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  genreTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingText: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
