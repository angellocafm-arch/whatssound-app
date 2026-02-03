import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { chat as aiChat, getAIConfig, AIMessage, PROVIDER_MODELS } from '../../src/lib/ai-provider';
import { supabase } from '../../src/lib/supabase';

const isWide = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth > 768 : true) : Dimensions.get('window').width > 768;

interface Message { role: 'user'|'assistant'; content: string; time: string; }

const SUGGESTIONS = [
  '¿Cuántos usuarios hay activos ahora?',
  '¿Cuál es la sesión más popular?',
  '¿Cómo van las propinas?',
  '¿Qué género es más popular?',
  'Dame un resumen del día',
  '¿Cómo cambio el modelo de IA?',
];

// Fetch DB context for AI
async function getDBContext(): Promise<string> {
  try {
    const [
      { count: users },
      { count: sessions },
      { count: songs },
      { count: msgs },
      { data: tips },
      { data: active },
    ] = await Promise.all([
      supabase.from('ws_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('ws_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('ws_songs').select('*', { count: 'exact', head: true }),
      supabase.from('ws_messages').select('*', { count: 'exact', head: true }),
      supabase.from('ws_tips').select('amount').eq('status', 'completed'),
      supabase.from('ws_sessions').select('name, genres, dj:ws_profiles!dj_id(dj_name), members:ws_session_members(id)').eq('is_active', true),
    ]);
    const totalTips = tips?.reduce((s: number, t: any) => s + Number(t.amount), 0) || 0;
    const lines = [
      `Usuarios: ${users}`,
      `Sesiones totales: ${sessions}`,
      `Canciones: ${songs}`,
      `Mensajes: ${msgs}`,
      `Propinas: €${totalTips.toFixed(2)} (${tips?.length || 0} transacciones)`,
      `Sesiones activas: ${active?.map((s: any) => `${s.name} (${s.dj?.dj_name}, ${s.members?.length || 0} miembros)`).join(', ') || 'ninguna'}`,
    ];
    return lines.join('\n');
  } catch { return '(No se pudieron obtener datos de la DB)'; }
}

export default function ChatPage() {
  const config = getAIConfig();
  const providerLabel = PROVIDER_MODELS[config.provider]?.label || 'Mock';
  const modelName = config.model || 'mock';

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `¡Hola! Soy Leo, tu analista IA de WhatsSound. 🎧\n\nConectado a Supabase con datos reales. Provider: **${providerLabel}**\n\nPuedo ayudarte con métricas, análisis de sesiones, engagement, revenue y más.\n\n¿Qué quieres saber?`, time: new Date().toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'}) },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<AIMessage[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (text?: string) => {
    const q = text || input.trim();
    if (!q || thinking) return;
    const now = new Date().toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'});
    setMessages(prev => [...prev, { role: 'user', content: q, time: now }]);
    setInput('');
    setThinking(true);

    const newHistory: AIMessage[] = [...chatHistory, { role: 'user', content: q }];
    setChatHistory(newHistory);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const dbContext = await getDBContext();
      const response = await aiChat(newHistory, dbContext);
      const rTime = new Date().toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'});
      setMessages(prev => [...prev, { role: 'assistant', content: response, time: rTime }]);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e: any) {
      const rTime = new Date().toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'});
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${e.message}`, time: rTime }]);
    }
    setThinking(false);
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
          <Text style={{color: colors.primary, fontSize: 11, fontWeight: '700'}}>{providerLabel}</Text>
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
        {thinking && (
          <View style={s.msgRow}>
            <View style={s.msgAvatar}><Ionicons name="sparkles" size={14} color={colors.primary}/></View>
            <View style={[s.msgBubble, s.msgBubbleAI, {flexDirection: 'row', alignItems: 'center', gap: 8}]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={s.msgText}>Pensando...</Text>
            </View>
          </View>
        )}
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
