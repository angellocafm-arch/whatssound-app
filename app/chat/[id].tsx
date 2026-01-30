/**
 * WhatsSound — Chat 1 a 1
 * Conversación privada estilo WhatsApp — datos reales desde Supabase
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';

const SUPABASE_URL = 'https://xyehncvvvprrqwnsefcr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTA4OTgsImV4cCI6MjA4NTIyNjg5OH0.VEaTmqpMA7XdUa-tZ7mXib1ciweD7y5UU4dFGZq3EtQ';

function getHeaders() {
  let token = '';
  try { token = JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').access_token || ''; } catch {}
  return { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token || ANON_KEY}`, 'Content-Type': 'application/json' };
}

function getCurrentUserId(): string {
  try { return JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').user?.id || ''; } catch { return ''; }
}

interface Message {
  id: string;
  text: string;
  time: string;
  isMe: boolean;
  senderName: string;
  read?: boolean;
}

const MessageBubble = ({ msg }: { msg: Message }) => (
  <View style={[styles.bubbleRow, msg.isMe && styles.bubbleRowMe]}>
    <View style={[styles.bubble, msg.isMe ? styles.bubbleMe : styles.bubbleOther]}>
      {!msg.isMe && <Text style={styles.senderName}>{msg.senderName}</Text>}
      <Text style={styles.msgText}>{msg.text}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.msgTime}>{msg.time}</Text>
        {msg.isMe && (
          <Ionicons
            name="checkmark-done"
            size={14}
            color={colors.primary}
          />
        )}
      </View>
    </View>
  </View>
);

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatName, setChatName] = useState('Chat');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentUserId = getCurrentUserId();

  // Ionicons font fix for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const s = document.createElement('style');
      s.textContent = '@font-face{font-family:"Ionicons";src:url("/Ionicons.ttf") format("truetype")}';
      if (!document.querySelector('style[data-ionicons-chat]')) {
        s.setAttribute('data-ionicons-chat', '1');
        document.head.appendChild(s);
      }
    }
  }, []);

  useEffect(() => {
    loadChatInfo();
    loadMessages();
    // Poll every 3 seconds
    pollingRef.current = setInterval(loadMessages, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [id]);

  const loadChatInfo = async () => {
    try {
      // Get chat details
      const res = await fetch(`${SUPABASE_URL}/rest/v1/chats?id=eq.${id}&select=*`, { headers: getHeaders() });
      const chats = await res.json();
      const chat = chats?.[0];
      if (!chat) return;

      if (chat.type === 'group') {
        setChatName(chat.name || 'Grupo');
      } else {
        // Direct chat: find the other member's name
        const membersRes = await fetch(`${SUPABASE_URL}/rest/v1/chat_members?chat_id=eq.${id}&user_id=neq.${currentUserId}&select=user_id`, { headers: getHeaders() });
        const members = await membersRes.json();
        if (members?.[0]?.user_id) {
          const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${members[0].user_id}&select=display_name`, { headers: getHeaders() });
          const profiles = await profileRes.json();
          setChatName(profiles?.[0]?.display_name || 'Chat');
        }
      }
    } catch (e) {
      console.error('Error loading chat info:', e);
    }
  };

  const loadMessages = async () => {
    try {
      // Fetch messages with user profile info
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/chat_messages?chat_id=eq.${id}&select=id,content,created_at,user_id,is_system&order=created_at.asc`,
        { headers: getHeaders() }
      );
      const msgs = await res.json();
      if (!Array.isArray(msgs)) { setLoading(false); return; }

      // Get unique user IDs for display names
      const userIds = [...new Set(msgs.map((m: any) => m.user_id).filter(Boolean))];
      const profileMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const profileRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=in.(${userIds.join(',')})&select=id,display_name`,
          { headers: getHeaders() }
        );
        const profiles = await profileRes.json();
        if (Array.isArray(profiles)) {
          profiles.forEach((p: any) => { profileMap[p.id] = p.display_name || 'Usuario'; });
        }
      }

      const formatted: Message[] = msgs.map((m: any) => ({
        id: m.id,
        text: m.content || '',
        time: m.created_at ? new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
        isMe: m.user_id === currentUserId,
        senderName: profileMap[m.user_id] || 'Usuario',
        read: true,
      }));

      setMessages(formatted);
    } catch (e) {
      console.error('Error loading messages:', e);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || sending || !currentUserId) return;
    setSending(true);
    setMessage('');

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/chat_messages`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Prefer': 'return=representation' },
        body: JSON.stringify({
          chat_id: id,
          user_id: currentUserId,
          content: text,
          is_system: false,
        }),
      });
      await loadMessages();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.error('Error sending message:', e);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
        <Avatar name={chatName} size="sm" />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{chatName}</Text>
          <Text style={styles.headerStatus}>en línea</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="call-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="videocam-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>
              No hay mensajes aún. ¡Envía el primero!
            </Text>
          </View>
        }
      />

      {/* Input */}
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
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity>
            <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="happy-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={sending}>
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
  headerStatus: { ...typography.caption, color: colors.primary },
  messageList: { padding: spacing.sm, gap: spacing.xs },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing.xs },
  bubbleRowMe: { flexDirection: 'row-reverse' },
  bubble: { maxWidth: '75%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  bubbleMe: { backgroundColor: colors.primary + '30', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  senderName: { ...typography.captionBold, color: colors.primary, marginBottom: 2 },
  msgText: { ...typography.body, color: colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 },
  msgTime: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
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
