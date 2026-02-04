/**
 * WhatsSound — Chat de Grupo (estilo WhatsApp)
 * Conectado a Supabase: mensajes reales, nombres de perfil, envío
 * Updated: 2026-02-04T20:05 - Demo mode fix
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';
import { isDemoMode } from '../../src/lib/demo';

// Ionicons web font fix
if (Platform.OS === 'web') {
  const s = document.createElement('style');
  s.textContent = '@font-face{font-family:"Ionicons";src:url("/Ionicons.ttf") format("truetype")}';
  if (!document.querySelector('style[data-ionicons-grp]')) {
    s.setAttribute('data-ionicons-grp', '1');
    document.head.appendChild(s);
  }
}

const SB = 'https://xyehncvvvprrqwnsefcr.supabase.co/rest/v1';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTA4OTgsImV4cCI6MjA4NTIyNjg5OH0.VEaTmqpMA7XdUa-tZ7mXib1ciweD7y5UU4dFGZq3EtQ';

// El modo demo se controla por URL: ?demo=true (mock) o ?demo=false (real)
// IDs especiales siempre usan mock: g1, demo*, test*
function isGroupDemo(groupId: string | undefined): boolean {
  if (!groupId) return true;
  if (isDemoMode()) return true;
  // IDs especiales siempre en modo demo
  const id = groupId.toLowerCase();
  return id === 'g1' || id.startsWith('demo') || id.startsWith('test');
}

function getHeaders() {
  let token = '';
  try { token = JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').access_token || ''; } catch {}
  return { 'apikey': ANON, 'Authorization': `Bearer ${token || ANON}`, 'Content-Type': 'application/json' };
}

function getCurrentUserId() {
  try { return JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').user?.id || ''; } catch { return ''; }
}

// WhatsApp-style sender colors
const SENDER_COLORS = [
  '#25D366', '#34B7F1', '#FF6B6B', '#FFA726', '#AB47BC',
  '#26A69A', '#EF5350', '#42A5F5', '#66BB6A', '#EC407A',
];

function getSenderColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = ((hash << 5) - hash) + userId.charCodeAt(i);
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

// Mock data para demo - Conversación grupal tipo WhatsApp
const MOCK_GROUP_MESSAGES: ChatMessage[] = [
  {
    id: 'sys-1',
    content: 'María García creó el grupo "Amigos Madrid 🎉"',
    user_id: '',
    is_system: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    display_name: '',
  },
  {
    id: 'msg-1',
    content: '¡Hola a todos! Bienvenidos al grupo 👋',
    user_id: 'maria-1',
    is_system: false,
    created_at: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString(),
    display_name: 'María García',
  },
  {
    id: 'msg-2',
    content: 'Gracias por la invitación María! 🙌',
    user_id: 'carlos-2',
    is_system: false,
    created_at: new Date(Date.now() - 1.8 * 60 * 60 * 1000).toISOString(),
    display_name: 'Carlos López',
  },
  {
    id: 'msg-3',
    content: 'Hola!! Qué buena idea crear este grupo',
    user_id: 'ana-3',
    is_system: false,
    created_at: new Date(Date.now() - 1.7 * 60 * 60 * 1000).toISOString(),
    display_name: 'Ana Martín',
  },
  {
    id: 'msg-4',
    content: 'Oye, ¿quedamos este finde para la sesión de DJ Carlos?',
    user_id: 'maria-1',
    is_system: false,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    display_name: 'María García',
  },
  {
    id: 'msg-5',
    content: 'Por mí perfecto, el sábado estoy libre 🎧',
    user_id: 'carlos-2',
    is_system: false,
    created_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    display_name: 'Carlos López',
  },
  {
    id: 'msg-6',
    content: 'Yo también puedo el sábado! A qué hora?',
    user_id: 'ana-3',
    is_system: false,
    created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    display_name: 'Ana Martín',
  },
  {
    id: 'msg-7',
    content: 'La sesión empieza a las 22:00, pero podemos quedar antes para cenar 🍕',
    user_id: 'maria-1',
    is_system: false,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    display_name: 'María García',
  },
  {
    id: 'msg-8',
    content: 'Genial! Os paso la ubicación luego',
    user_id: 'carlos-2',
    is_system: false,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    display_name: 'Carlos López',
  },
  {
    id: 'msg-9',
    content: '¡Perfecto! Nos vemos el sábado entonces 🔥',
    user_id: 'ana-3',
    is_system: false,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    display_name: 'Ana Martín',
  },
];

const MOCK_GROUP_INFO = {
  name: 'Amigos Madrid 🎉',
  memberCount: 3,
};

interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  is_system: boolean;
  created_at: string;
  display_name?: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

const MessageBubble = ({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) => {
  if (msg.is_system) {
    return (
      <View style={styles.systemMsg}>
        <Text style={styles.systemText}>{msg.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      {!isMe && <Avatar name={msg.display_name || '?'} size="sm" />}
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        {!isMe && (
          <Text style={[styles.senderName, { color: getSenderColor(msg.user_id) }]}>
            {msg.display_name || 'Desconocido'}
          </Text>
        )}
        <Text style={styles.msgText}>{msg.content}</Text>
        <Text style={styles.msgTime}>{formatTime(msg.created_at)}</Text>
      </View>
    </View>
  );
};

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [groupName, setGroupName] = useState('Grupo');
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const profileCache = useRef<Record<string, string>>({});

  const fetchProfileName = async (userId: string, headers: any): Promise<string> => {
    if (profileCache.current[userId]) return profileCache.current[userId];
    try {
      const res = await fetch(`${SB}/profiles?id=eq.${userId}&select=display_name`, { headers });
      const data = await res.json();
      const name = data?.[0]?.display_name || 'Desconocido';
      profileCache.current[userId] = name;
      return name;
    } catch { return 'Desconocido'; }
  };

  const fetchMessages = useCallback(async () => {
    if (!id) return;
    
    // Modo demo o ID especial: usar mensajes mock (bypass total a Supabase)
    if (isGroupDemo(id)) {
      setMessages(MOCK_GROUP_MESSAGES);
      return;
    }
    
    try {
      const headers = getHeaders();
      const res = await fetch(`${SB}/chat_messages?chat_id=eq.${id}&order=created_at.asc&select=id,content,user_id,is_system,created_at`, { headers });
      const data = await res.json();
      if (!Array.isArray(data)) return;

      // Resolve display names
      const enriched: ChatMessage[] = await Promise.all(data.map(async (msg: any) => {
        const display_name = msg.user_id ? await fetchProfileName(msg.user_id, headers) : '';
        return { ...msg, display_name };
      }));

      setMessages(enriched);
    } catch (e) {
      console.error('Error fetching messages:', e);
      // Fallback a mock en caso de error
      setMessages(MOCK_GROUP_MESSAGES);
    }
  }, [id]);

  const fetchGroupInfo = useCallback(async () => {
    if (!id) return;
    
    // Modo demo o ID especial: usar info mock (bypass total a Supabase)
    if (isGroupDemo(id)) {
      setGroupName(MOCK_GROUP_INFO.name);
      setMemberCount(MOCK_GROUP_INFO.memberCount);
      return;
    }
    
    try {
      const headers = getHeaders();
      // Group name
      const chatRes = await fetch(`${SB}/chats?id=eq.${id}&select=name`, { headers });
      const chats = await chatRes.json();
      if (chats?.[0]?.name) setGroupName(chats[0].name);

      // Member count
      const memRes = await fetch(`${SB}/chat_members?chat_id=eq.${id}&select=id`, { headers: { ...headers, 'Prefer': 'count=exact' } });
      const countHeader = memRes.headers.get('content-range');
      const count = countHeader ? parseInt(countHeader.split('/')[1]) || 0 : (await memRes.json()).length || 0;
      setMemberCount(count);
    } catch (e) {
      console.error('Error fetching group info:', e);
      // Fallback a mock
      setGroupName(MOCK_GROUP_INFO.name);
      setMemberCount(MOCK_GROUP_INFO.memberCount);
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    Promise.all([fetchGroupInfo(), fetchMessages()]).finally(() => setLoading(false));

    // Poll for new messages every 3s (solo si NO es demo)
    if (!isGroupDemo(id)) {
      pollRef.current = setInterval(fetchMessages, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id, fetchGroupInfo, fetchMessages]));

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    setMessage('');
    try {
      const headers = getHeaders();
      const userId = getCurrentUserId();
      await fetch(`${SB}/chat_messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ chat_id: id, user_id: userId || null, content: text, is_system: false }),
      });
      await fetchMessages();
    } catch (e) {
      console.error('Error sending message:', e);
    } finally {
      setSending(false);
    }
  };

  const userId = getCurrentUserId();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Avatar name={groupName} size="sm" />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{groupName}</Text>
          <Text style={styles.headerMembers}>{memberCount} miembros</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MessageBubble msg={item} isMe={item.user_id === userId} />}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Mensaje"
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity>
            <Ionicons name="happy-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          {message.trim() ? (
            <Ionicons name="send" size={20} color={colors.textOnPrimary} />
          ) : (
            <Ionicons name="mic" size={22} color={colors.textOnPrimary} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 0.5, borderBottomColor: colors.divider,
  },
  headerInfo: { flex: 1 },
  headerName: { ...typography.bodyBold, color: colors.textPrimary },
  headerMembers: { ...typography.caption, color: colors.textMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { padding: spacing.sm, gap: spacing.xs, flexGrow: 1 },
  systemMsg: { alignSelf: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.surface, borderRadius: borderRadius.full, marginVertical: spacing.xs },
  systemText: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, marginBottom: spacing.xs },
  bubbleRowMe: { flexDirection: 'row-reverse' },
  bubble: { maxWidth: '75%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  bubbleMe: { backgroundColor: colors.primary + '30', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  senderName: { ...typography.captionBold, marginBottom: 2 },
  msgText: { ...typography.body, color: colors.textPrimary },
  msgTime: { ...typography.caption, color: colors.textMuted, alignSelf: 'flex-end', marginTop: 2, fontSize: 10 },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderTopWidth: 0.5, borderTopColor: colors.divider,
  },
  inputContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  input: { flex: 1, ...typography.body, color: colors.textPrimary, paddingVertical: spacing.sm },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
});
