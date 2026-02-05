/**
 * WhatsSound — Crear Perfil
 * Nombre, avatar, bio y géneros
 * Conectado a Supabase
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { supabase } from '../../src/lib/supabase';
import { isTestMode, getOrCreateTestUser, clearTestNeedsProfile } from '../../src/lib/demo';
import { useAuthStore } from '../../src/stores/authStore';

const GENRES = [
  'Reggaeton', 'Pop', 'Rock', 'Techno', 'Lo-Fi', 
  'Hip Hop', 'Indie', 'Jazz', 'Clásica', 'Latina',
  'R&B', 'House', 'Trap', 'Bachata', 'Salsa',
];

export default function CreateProfileScreen() {
  const router = useRouter();
  const { setProfile, user } = useAuthStore();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else if (selectedGenres.length < 5) {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    setError('');

    try {
      // Modo test: actualizar perfil existente o crear uno
      if (isTestMode()) {
        const testProfile = await getOrCreateTestUser();
        if (testProfile) {
          // Actualizar con los datos del formulario
          const { error: updateError } = await supabase
            .from('ws_profiles')
            .update({
              display_name: name.trim(),
              bio: bio.trim() || null,
              genres: selectedGenres,
              updated_at: new Date().toISOString(),
            })
            .eq('id', testProfile.id);

          if (updateError) {
            console.warn('Error updating profile:', updateError);
          }

          // Guardar user + session + profile en el store
          // AuthGate verifica 'user', no solo 'profile'
          useAuthStore.setState({
            user: {
              id: testProfile.id,
              email: `${testProfile.username}@test.whatssound.app`,
              app_metadata: {},
              user_metadata: { display_name: name.trim() },
              aud: 'authenticated',
              created_at: new Date().toISOString(),
            } as any,
            session: {
              access_token: 'test-token',
              refresh_token: 'test-refresh',
              expires_at: Math.floor(Date.now() / 1000) + 86400,
              user: { id: testProfile.id },
            } as any,
            profile: {
              id: testProfile.id,
              display_name: name.trim(),
              username: testProfile.username,
              avatar_url: testProfile.avatar_url,
              is_dj: testProfile.is_dj,
              bio: bio.trim(),
              is_verified: false,
              dj_name: null,
              genres: selectedGenres,
              role: 'user',
            },
            initialized: true,
            loading: false,
          });

          // Clear the flag that was blocking auto-auth
          clearTestNeedsProfile();
          
          router.replace('/(auth)/permissions');
        }
        setLoading(false);
        return;
      }

      // Producción: obtener usuario autenticado y crear/actualizar perfil
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Sesión expirada. Vuelve a iniciar sesión.');
        setLoading(false);
        return;
      }

      // Generar username desde nombre
      const username = name.trim().toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 15) + Math.floor(Math.random() * 1000);

      // Crear o actualizar perfil
      const { data: profile, error: profileError } = await supabase
        .from('ws_profiles')
        .upsert({
          id: user.id,
          display_name: name.trim(),
          username,
          bio: bio.trim() || null,
          genres: selectedGenres,
          is_dj: false,
          is_seed: false,
        })
        .select()
        .single();

      if (profileError) {
        setError('Error al crear perfil. Inténtalo de nuevo.');
        setLoading(false);
        return;
      }

      setProfile({
        id: profile.id,
        display_name: profile.display_name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        is_dj: profile.is_dj,
        bio: profile.bio || '',
        is_verified: profile.is_verified || false,
        dj_name: profile.dj_name || null,
        genres: profile.genres || [],
        role: profile.role || 'user',
      });

      // Ir a permisos
      router.replace('/(auth)/permissions');
    } catch (e: unknown) {
      setError('Error inesperado. Inténtalo de nuevo.');
    }

    setLoading(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title}>Crea tu perfil</Text>
      <Text style={styles.subtitle}>
        Así te verán los demás en las sesiones
      </Text>

      {/* Error */}
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Avatar picker */}
      <TouchableOpacity style={styles.avatarPicker}>
        <View style={styles.avatarCircle}>
          <Ionicons name="camera" size={32} color={colors.textMuted} />
        </View>
        <Text style={styles.avatarLabel}>Añadir foto</Text>
      </TouchableOpacity>

      {/* Form */}
      <Input
        label="Nombre"
        placeholder="Tu nombre o apodo"
        value={name}
        onChangeText={setName}
        maxLength={25}
      />

      <Input
        label="Bio (opcional)"
        placeholder="Cuéntanos algo sobre ti..."
        value={bio}
        onChangeText={setBio}
        maxLength={120}
        multiline
        numberOfLines={3}
      />

      {/* Géneros favoritos */}
      <Text style={styles.sectionLabel}>GÉNEROS FAVORITOS (máx 5)</Text>
      <View style={styles.genreChips}>
        {GENRES.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          return (
            <TouchableOpacity 
              key={genre} 
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggleGenre(genre)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {genre}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Test mode indicator */}
      {isTestMode() && (
        <View style={styles.testBadge}>
          <Ionicons name="flask" size={14} color={colors.warning} />
          <Text style={styles.testBadgeText}>Modo demo</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="Crear perfil"
          onPress={handleCreate}
          fullWidth
          size="lg"
          loading={loading}
          disabled={!name.trim()}
        />
      </View>
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
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['4xl'],
  },
  backBtn: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.error, flex: 1 },
  avatarPicker: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  avatarLabel: {
    ...typography.bodySmall,
    color: colors.accent,
    marginTop: spacing.sm,
  },
  sectionLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  genreChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning + '15',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  testBadgeText: { ...typography.caption, color: colors.warning },
  buttonContainer: {
    marginTop: spacing.lg,
  },
});
