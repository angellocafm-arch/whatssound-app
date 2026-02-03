/**
 * WhatsSound — Pedir canción con búsqueda de Deezer
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import SongSearch from '../../src/components/SongSearch';
import { DeezerTrack } from '../../src/lib/deezer';
import { supabase } from '../../src/lib/supabase';
import { isTestMode, getOrCreateTestUser } from '../../src/lib/demo';

export default function RequestSongScreen() {
  const router = useRouter();
  const { sid } = useLocalSearchParams<{ sid: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>('');

  // Obtener user id al montar
  React.useEffect(() => {
    (async () => {
      if (isTestMode()) {
        const testProfile = await getOrCreateTestUser();
        if (testProfile) setUserId(testProfile.id);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);
      }
    })();
  }, []);

  const handleSongSelect = async (track: DeezerTrack) => {
    if (isSubmitting || !userId) return;
    
    setIsSubmitting(true);

    try {
      // Convertir duración de segundos a milisegundos
      const durationMs = track.duration * 1000;

      // Datos de la canción para insertar
      const songData = {
        session_id: sid,
        user_id: userId,
        external_id: `deezer:${track.id}`,
        deezer_id: track.id,
        title: track.title,
        artist: track.artist.name,
        album_name: track.album.title,
        cover_url: track.album.cover_medium || track.album.cover_big || track.album.cover,
        preview_url: track.preview,
        duration_ms: durationMs,
        status: 'pending',
      };

      console.log('Guardando canción:', songData);

      const { error } = await supabase
        .from('ws_songs')
        .insert([songData]);

      if (error) {
        console.error('Error insertando canción:', error);
        if (error.code === '23505') { // Unique constraint violation
          Alert.alert(
            'Canción duplicada', 
            'Esta canción ya está en la cola de esta sesión.'
          );
        } else {
          Alert.alert(
            'Error', 
            'No se pudo agregar la canción. Inténtalo de nuevo.'
          );
        }
        return;
      }

      // Éxito
      Alert.alert(
        '¡Canción agregada! 🎵',
        `"${track.title}" se ha añadido a la cola.`,
        [
          {
            text: 'Ver cola',
            onPress: () => router.replace(`/session/${sid}?tab=queue`),
          },
          {
            text: 'Agregar otra',
            onPress: () => {
              // Solo limpiar el estado, mantener la pantalla abierta
              setIsSubmitting(false);
            },
          }
        ]
      );

    } catch (error) {
      console.error('Error agregando canción:', error);
      Alert.alert('Error', 'Algo salió mal. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Pedir canción</Text>
            <Text style={styles.headerSubtitle}>Busca en Deezer</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <View style={styles.instructionRow}>
            <View style={styles.instructionIcon}>
              <Ionicons name="search" size={20} color={colors.primary} />
            </View>
            <Text style={styles.instructionText}>
              Busca por título o artista
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.instructionIcon}>
              <Ionicons name="play-circle" size={20} color={colors.primary} />
            </View>
            <Text style={styles.instructionText}>
              Escucha un preview de 30 segundos
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.instructionIcon}>
              <Ionicons name="add-circle" size={20} color={colors.primary} />
            </View>
            <Text style={styles.instructionText}>
              Toca + para agregar a la cola
            </Text>
          </View>
        </View>

        {/* Song Search */}
        <View style={styles.searchContainer}>
          <SongSearch
            onSongSelect={handleSongSelect}
            sessionId={sid || ''}
            placeholder="Buscar canciones..."
            maxResults={15}
            showAudioPreview={true}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Instructions
  instructions: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  instructionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },

  // Search
  searchContainer: {
    flex: 1,
    padding: spacing.md,
  },
});