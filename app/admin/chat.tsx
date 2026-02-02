import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const isWide = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth > 768 : true) : Dimensions.get('window').width > 768;

interface Message { role: 'user'|'assistant'; content: string; time: string; }

const SUGGESTIONS = [
  '¿Cuántos usuarios hay activos ahora?',
  '¿Cuál es la sesión más popular?',
  '¿Cómo va el revenue esta semana?',
  '¿Qué género es más popular?',
  'Dame un resumen del día',
  '¿Hay alertas pendientes?',
];

// Mock AI responses based on keywords
function getAIResponse(q: string): string {
  const ql = q.toLowerCase();
  if (ql.includes('usuario') || ql.includes('activo')) {
    return '📊 **Usuarios:**\n• Total registrados: 1,247\n• Activos ahora: 45\n• Nuevos hoy: 18\n• Nuevos esta semana: 87\n• Retención D7: 68%\n\nLa tendencia es positiva — +12% vs semana pasada. El pico de registros fue el viernes.';
  }
  if (ql.includes('sesión') || ql.includes('sesion') || ql.includes('popular')) {
    return '🎵 **Sesiones en vivo ahora: 5**\n\n🏆 Más popular: "Chill & Study Beats" (Luna DJ) — 203 listeners\n\nRanking:\n1. Chill & Study Beats — 203 👥\n2. Deep House Sunset — 128 👥\n3. Warehouse Session — 89 👥\n4. Old School Hip Hop — 67 👥\n5. Viernes Latino — 45 👥\n\nTotal listeners simultáneos: 532';
  }
  if (ql.includes('revenue') || ql.includes('propina') || ql.includes('dinero') || ql.includes('ingreso')) {
    return '💰 **Revenue:**\n• Propinas hoy: €23.50\n• Propinas esta semana: €284.00\n• Propinas total: €1,234\n• Media por sesión: €15.80\n• Top tipper: Ana López (€45 total)\n\nLas propinas subieron un 67% desde que añadimos el botón rápido. Proyección mensual: ~€2,400.';
  }
  if (ql.includes('género') || ql.includes('genero') || ql.includes('música') || ql.includes('musica')) {
    return '🎶 **Géneros más populares:**\n1. Reggaetón — 42% de sesiones\n2. Lo-fi/Chill — 18%\n3. Deep House — 15%\n4. Techno — 12%\n5. Hip Hop — 8%\n6. Otros — 5%\n\nSugerencia: promover DJs de reggaetón y lo-fi en Descubrir — son los que más engagement generan.';
  }
  if (ql.includes('resumen') || ql.includes('día') || ql.includes('dia') || ql.includes('hoy')) {
    return '📋 **Resumen del día (3 feb 2026):**\n\n👥 18 nuevos usuarios (+23% vs ayer)\n📡 12 sesiones creadas (5 live ahora)\n🎵 2,841 canciones reproducidas\n💬 8,432 mensajes de chat\n🔥 12,567 reacciones\n💰 €23.50 en propinas\n👥 45 listeners activos ahora\n⏱️ Duración media sesión: 47 minutos\n\n✅ Todo normal. Engagement alto, sin incidencias.';
  }
  if (ql.includes('alerta') || ql.includes('reporte') || ql.includes('problema')) {
    return '🚨 **Alertas:**\n• Alertas activas: 2\n  - ⚠️ Latencia WebSocket > 500ms en EU-West (hace 1h)\n  - ℹ️ Usuario reportó mensaje inapropiado en "Viernes Latino" (hace 2h, revisado — OK)\n• Alertas resueltas hoy: 5\n• Uptime: 99.97%\n\nNada urgente. La latencia se estabilizó tras el último deploy.';
  }
  return '🤔 No tengo datos específicos para esa consulta todavía. Estoy conectándome a Supabase para tener datos reales. De momento puedo responder sobre:\n\n• Usuarios y actividad\n• Sesiones en vivo\n• Revenue y propinas\n• Géneros populares\n• Resumen del día\n• Alertas\n\n¿Qué te gustaría saber?';
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy Leo, tu analista IA de WhatsSound. 🎧\n\nPuedo ayudarte con métricas, análisis de sesiones, engagement, revenue y más. Pregúntame lo que necesites — solo consulto datos, nunca los modifico.\n\n¿Qué quieres saber?', time: new Date().toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'}) },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const send = (text?: string) => {
    const q = text || input.trim();
    if (!q) return;
    const now = new Date().toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'});
    setMessages(prev => [...prev, { role: 'user', content: q, time: now }]);
    setInput('');
    // Simulate AI thinking
    setTimeout(() => {
      const response = getAIResponse(q);
      const rTime = new Date().toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'});
      setMessages(prev => [...prev, { role: 'assistant', content: response, time: rTime }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 800);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={s.main}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.aiIcon}><Ionicons name="sparkles" size={20} color={colors.primary}/></View>
          <View>
            <Text style={s.title}>Chat IA — Leo</Text>
            <Text style={s.subtitle}>Analista de datos WhatsSound · Solo lectura</Text>
          </View>
        </View>
        <View style={s.modelBadge}>
          <Text style={{color: colors.primary, fontSize: 11, fontWeight: '700'}}>Claude 3.5</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={s.messages} contentContainerStyle={{padding: spacing.md, gap: spacing.md}}>
        {messages.map((m, i) => (
          <View key={i} style={[s.msgRow, m.role === 'user' && s.msgRowUser]}>
            {m.role === 'assistant' && (
              <View style={s.msgAvatar}><Ionicons name="sparkles" size={14} color={colors.primary}/></View>
            )}
            <View style={[s.msgBubble, m.role === 'user' ? s.msgBubbleUser : s.msgBubbleAI]}>
              <Text style={s.msgText}>{m.content}</Text>
              <Text style={s.msgTime}>{m.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Suggestions */}
      <ScrollView horizontal style={s.suggestScroll} contentContainerStyle={{gap: spacing.sm, paddingHorizontal: spacing.md}}>
        {SUGGESTIONS.map((sug, i) => (
          <TouchableOpacity key={i} style={s.suggestBtn} onPress={() => send(sug)}>
            <Text style={s.suggestText}>{sug}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Pregunta sobre métricas, usuarios, sesiones..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send()}
        />
        <TouchableOpacity style={s.sendBtn} onPress={() => send()}>
          <Ionicons name="send" size={18} color={colors.textOnPrimary}/>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#0a0f1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aiIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary+'20', alignItems:'center', justifyContent:'center' },
  title: { ...typography.h3, color: colors.textPrimary, fontSize: 16 },
  subtitle: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  modelBadge: { backgroundColor: colors.primary+'15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  messages: { flex: 1 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  msgRowUser: { justifyContent: 'flex-end' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary+'20', alignItems:'center', justifyContent:'center', marginTop: 4 },
  msgBubble: { maxWidth: '70%', borderRadius: borderRadius.lg, padding: spacing.md },
  msgBubbleAI: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  msgBubbleUser: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  msgText: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 13, lineHeight: 20 },
  msgTime: { ...typography.caption, color: colors.textMuted, fontSize: 10, marginTop: 6, textAlign: 'right' },
  suggestScroll: { maxHeight: 44, borderTopWidth: 1, borderTopColor: colors.border },
  suggestBtn: { backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  suggestText: { ...typography.caption, color: colors.textSecondary, fontSize: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.surface, borderRadius: 24, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems:'center', justifyContent:'center' },
});
