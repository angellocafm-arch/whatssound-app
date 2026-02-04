/**
 * WhatsSound — Programar Sesión
 * UI para que los DJs programen sesiones futuras
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Button } from '../../src/components/ui/Button';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/authStore';
import { isDemoMode } from '../../src/lib/demo';

const GENRES = [
  { id: 'reggaeton', label: 'Reggaetón', emoji: '🔥' },
  { id: 'pop', label: 'Pop', emoji: '💖' },
  { id: 'electronic', label: 'Electrónica', emoji: '⚡' },
  { id: 'hiphop', label: 'Hip Hop', emoji: '🎤' },
  { id: 'rock', label: 'Rock', emoji: '🎸' },
  { id: 'latin', label: 'Latin', emoji: '💃' },
  { id: 'indie', label: 'Indie', emoji: '🌿' },
  { id: 'rnb', label: 'R&B', emoji: '💜' },
  { id: 'techno', label: 'Techno', emoji: '🔊' },
  { id: 'chill', label: 'Chill', emoji: '🌙' },
];

const DURATIONS = [
  { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' },
  { value: 240, label: '4 horas' },
];

export default function ScheduleSessionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Mañana
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [duration, setDuration] = useState(120);
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const toggleGenre = (id: string) => {
    setSelectedGenres(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Dale un nombre a tu sesión');
      return;
    }
    if (selectedGenres.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un género');
      return;
    }
    if (date < new Date()) {
      Alert.alert('Error', 'La fecha debe ser en el futuro');
      return;
    }

    setSubmitting(true);

    try {
      if (isDemoMode()) {
        // Simular creación
        await new Promise(resolve => setTimeout(resolve, 1000));
        Alert.alert('¡Sesión programada! 🎉', `"${name}" está lista para el ${formatDate(date)}`, [
          { text: 'Ver sesiones', onPress: () => router.back() }
        ]);
        return;
      }

      const { error } = await supabase.from('ws_scheduled_sessions').insert({
        dj_id: user?.id,
        name: name.trim(),
        description: description.trim() || null,
        scheduled_at: date.toISOString(),
        duration_minutes: duration,
        genres: selectedGenres,
        is_public: isPublic,
      });

      if (error) throw error;

      Alert.alert('¡Sesión programada! 🎉', `"${name}" está lista para el ${formatDate(date)}`, [
        { text: 'Ver sesiones', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('[Schedule] Error:', error);
      Alert.alert('Error', 'No se pudo programar la sesión');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Programar sesión</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nombre */}
        <View style={styles.field}>
          <Text style={styles.label}>Nombre de la sesión</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Viernes Latino 🔥"
            placeholderTextColor={colors.textMuted}
            maxLength={50}
          />
        </View>

        {/* Descripción */}
        <View style={styles.field}>
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Cuéntale a tu audiencia qué esperar..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        {/* Fecha y hora */}
        <View style={styles.field}>
          <Text style={styles.label}>Fecha y hora</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity 
              style={styles.dateBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={styles.dateBtnText}>
                {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dateBtn}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={styles.dateBtnText}>
                {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.datePreview}>{formatDate(date)}</Text>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setDate(prev => {
                const newDate = new Date(prev);
                newDate.setFullYear(selectedDate.getFullYear());
                newDate.setMonth(selectedDate.getMonth());
                newDate.setDate(selectedDate.getDate());
                return newDate;
              });
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            is24Hour
            onChange={(_, selectedDate) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (selectedDate) setDate(prev => {
                const newDate = new Date(prev);
                newDate.setHours(selectedDate.getHours());
                newDate.setMinutes(selectedDate.getMinutes());
                return newDate;
              });
            }}
          />
        )}

        {/* Duración */}
        <View style={styles.field}>
          <Text style={styles.label}>Duración estimada</Text>
          <View style={styles.optionsRow}>
            {DURATIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionBtn, duration === opt.value && styles.optionBtnActive]}
                onPress={() => setDuration(opt.value)}
              >
                <Text style={[styles.optionText, duration === opt.value && styles.optionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Géneros */}
        <View style={styles.field}>
          <Text style={styles.label}>Géneros</Text>
          <View style={styles.genresGrid}>
            {GENRES.map(genre => (
              <TouchableOpacity
                key={genre.id}
                style={[styles.genreChip, selectedGenres.includes(genre.id) && styles.genreChipActive]}
                onPress={() => toggleGenre(genre.id)}
              >
                <Text style={styles.genreEmoji}>{genre.emoji}</Text>
                <Text style={[styles.genreLabel, selectedGenres.includes(genre.id) && styles.genreLabelActive]}>
                  {genre.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Visibilidad */}
        <View style={styles.field}>
          <TouchableOpacity 
            style={styles.toggleRow}
            onPress={() => setIsPublic(!isPublic)}
          >
            <View>
              <Text style={styles.label}>Sesión pública</Text>
              <Text style={styles.toggleDesc}>
                {isPublic ? 'Visible en el feed para todos' : 'Solo visible con enlace directo'}
              </Text>
            </View>
            <Ionicons 
              name={isPublic ? 'eye' : 'eye-off'} 
              size={24} 
              color={isPublic ? colors.primary : colors.textMuted} 
            />
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <View style={styles.submitArea}>
          <Button
            title="Programar sesión"
            onPress={handleSubmit}
            fullWidth
            size="lg"
            loading={submitting}
            disabled={!name.trim() || selectedGenres.length === 0}
          />
          <Text style={styles.hint}>
            Tus seguidores recibirán una notificación 15 minutos antes
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateBtnText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 15,
  },
  datePreview: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    textTransform: 'capitalize',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionBtnActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genreChipActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  genreEmoji: {
    fontSize: 14,
  },
  genreLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
  },
  genreLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  toggleDesc: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  submitArea: {
    paddingVertical: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: 12,
  },
});
