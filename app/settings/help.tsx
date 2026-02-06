/**
 * WhatsSound — Centro de Ayuda
 * FAQ y soporte
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const FAQ = [
  { q: '¿Cómo creo una sesión musical?', a: 'Ve a la pestaña "En Vivo" y pulsa "+ Crear". Elige nombre, género y configuración.' },
  { q: '¿Necesito Spotify para escuchar?', a: 'No. Solo el DJ necesita una cuenta de Spotify. Los oyentes escuchan directamente en la app.' },
  { q: '¿Cómo pido una canción?', a: 'Dentro de una sesión activa, pulsa "Pedir canción", busca y selecciona. Otros pueden votar tu petición.' },
  { q: '¿Cómo funcionan los decibelios?', a: 'Ganas 1 dB por cada minuto escuchando. Puedes enviar tus decibelios al DJ para apoyarle. Los decibelios con mensaje pueden subir tu canción en la cola.' },
  { q: '¿Los grupos funcionan como WhatsApp?', a: 'Sí. Son chats normales que además pueden activar sesiones musicales cuando quieran.' },
  { q: '¿Cómo me hago DJ verificado?', a: 'Ve a Ajustes → Perfil de DJ. Tras 10 sesiones y buenas valoraciones, puedes solicitar verificación.' },
];

export default function HelpScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState<number | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centro de ayuda</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickIcon}><Ionicons name="chatbox-ellipses" size={24} color={colors.primary} /></View>
          <Text style={styles.quickText}>Chat con soporte</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickIcon}><Ionicons name="mail" size={24} color={colors.accent} /></View>
          <Text style={styles.quickText}>Enviar email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickIcon}><Ionicons name="bug" size={24} color={colors.warning} /></View>
          <Text style={styles.quickText}>Reportar bug</Text>
        </TouchableOpacity>
      </View>

      {/* FAQ */}
      <Text style={styles.sectionLabel}>PREGUNTAS FRECUENTES</Text>
      {FAQ.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={styles.faqItem}
          onPress={() => setExpanded(expanded === i ? null : i)}
        >
          <View style={styles.faqHeader}>
            <Text style={styles.faqQuestion}>{item.q}</Text>
            <Ionicons name={expanded === i ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
          </View>
          {expanded === i && <Text style={styles.faqAnswer}>{item.a}</Text>}
        </TouchableOpacity>
      ))}

      <Text style={styles.version}>WhatsSound v0.1.0 · Build 1</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['3xl'] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  quickActions: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.base, marginBottom: spacing.xl },
  quickAction: { flex: 1, alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.xl },
  quickIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  quickText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  sectionLabel: { ...typography.captionBold, color: colors.textMuted, letterSpacing: 0.5, paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  faqItem: { paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.divider },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { ...typography.bodyBold, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  faqAnswer: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 22 },
  version: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
