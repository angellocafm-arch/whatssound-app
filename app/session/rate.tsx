/**
 * WhatsSound — Valorar Sesión
 * Post-sesión: valorar DJ, experiencia — connected to Supabase
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';

// Ionicons web font fix
if (Platform.OS === 'web') {
  const s = document.createElement('style');
  s.textContent = '@font-face{font-family:"Ionicons";src:url("/Ionicons.ttf") format("truetype")}';
  if (!document.querySelector('style[data-ionicons-fix]')) { s.setAttribute('data-ionicons-fix','1'); document.head.appendChild(s); }
}

const SUPABASE_URL = 'https://xyehncvvvprrqwnsefcr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTA4OTgsImV4cCI6MjA4NTIyNjg5OH0.VEaTmqpMA7XdUa-tZ7mXib1ciweD7y5UU4dFGZq3EtQ';

function getHeaders() {
  let token = '';
  try { token = JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').access_token || ''; } catch {}
  return { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token || ANON_KEY}`, 'Content-Type': 'application/json' };
}

interface SessionData {
  id: string;
  name: string;
  dj_name?: string;
  created_at?: string;
}

export default function RateSessionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${id}&select=id,name,dj_name,created_at`, { headers: getHeaders() })
      .then(r => r.json())
      .then(data => { if (data?.[0]) setSession(data[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = () => {
    // Store rating locally (no ratings table yet)
    try {
      const key = `ws_rating_${id}`;
      localStorage.setItem(key, JSON.stringify({ rating, comment, date: new Date().toISOString() }));
    } catch {}
    setSent(true);
    Alert.alert('Gracias por tu valoración');
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          <Text style={styles.successTitle}>¡Gracias!</Text>
          <Text style={styles.successSub}>Tu valoración ayuda a otros usuarios</Text>
          <Button title="Volver al inicio" onPress={() => router.replace('/')} variant="secondary" size="lg" />
        </View>
      </View>
    );
  }

  const sessionName = session?.name || 'Sesión';
  const djName = session?.dj_name || 'DJ';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sesión terminada 🎧</Text>

        <View style={styles.summaryCard}>
          <Avatar name={djName} size="lg" />
          <Text style={styles.sessionName}>{sessionName}</Text>
          <Text style={styles.djName}>{djName}</Text>
        </View>

        <Text style={styles.rateLabel}>¿Cómo fue la sesión?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={40}
                color={star <= rating ? colors.warning : colors.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>
          {rating === 0 ? 'Toca para valorar' :
           rating <= 2 ? 'Puede mejorar' :
           rating <= 3 ? 'Estuvo bien' :
           rating <= 4 ? '¡Muy buena!' : '¡Increíble! 🔥'}
        </Text>

        <Input
          label="Comentario (opcional)"
          placeholder="¿Qué te pareció?"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          maxLength={200}
        />

        <Button
          title="Enviar valoración"
          onPress={handleSubmit}
          fullWidth
          size="lg"
          disabled={rating === 0}
        />

        <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/')}>
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'center' },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xl },
  summaryCard: {
    alignItems: 'center', gap: spacing.sm,
    padding: spacing.xl, backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
  },
  sessionName: { ...typography.h3, color: colors.textPrimary },
  djName: { ...typography.body, color: colors.textSecondary },
  rateLabel: { ...typography.bodyBold, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.sm },
  ratingText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  skipBtn: { alignItems: 'center', paddingVertical: spacing.md },
  skipText: { ...typography.body, color: colors.textMuted },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  successTitle: { ...typography.h2, color: colors.textPrimary },
  successSub: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
});
