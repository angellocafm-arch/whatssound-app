/**
 * WhatsSound — Conversación Privada
 * Chat individual estilo WhatsApp con realtime
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/authStore';
import { isDemoMode, isTestMode } from '../../src/lib/demo';

// Mensajes mock para modo demo
const MOCK_MESSAGES = [
  {
    id: 'm1',
    content: 'Hola! ¿Cómo estás?',
    senderId: 'other',
    senderName: 'DJ Carlos Madrid',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: true,
  },
  {
    id: 'm2',
    content: 'Muy bien, gracias! ¿Qué tal tu sesión de ayer?',
    senderId: 'self',
    senderName: 'Tú',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000), // 1h 55m ago
    isRead: true,
  },
  {
    id: 'm3',
    content: 'Increíble! Tuvimos casi 100 personas conectadas 🎉',
    senderId: 'other',
    senderName: 'DJ Carlos Madrid',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    isRead: true,
  },
  {
    id: 'm4',
    content: 'Oye, ¿vas a la sesión de esta noche?',
    senderId: 'other',
    senderName: 'DJ Carlos Madrid',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
    isRead: false,
  },
];

const MOCK_CONTACT = {
  id: 'other',
  name: 'DJ Carlos Madrid',
  avatar: null,
  username: 'carlosmadrid',
  isOnline: true,
};

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  showTime?: boolean;
}

const MessageBubble = ({ message, isOwn, showTime }: MessageBubbleProps) => {
  return (
    <View style={[s.messageContainer, isOwn ? s.messageOwn : s.messageOther]}>
      <View style={[s.bubble, isOwn ? s.bubbleOwn : s.bubbleOther]}>
        <Text style={[s.messageText, isOwn ? s.messageTextOwn : s.messageTextOther]}>
          {message.content}
        </Text>
        <View style={s.messageFooter}>
          <Text style={[s.messageTime, isOwn ? s.messageTimeOwn : s.messageTimeOther]}>
            {formatMessageTime(message.timestamp)}
          </Text>
          {isOwn && (
            <View style={s.readStatus}>
              <Ionicons 
                name={message.isRead ? 'checkmark-done' : 'checkmark'} 
                size={14} 
                color={message.isRead ? colors.primary : colors.textMuted} 
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [contact, setContact] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChatData();
    setupRealtimeSubscription();
  }, [id]);

  const loadChatData = async () => {
    if (isDemoMode()) {
      // Modo demo: usar datos mock
      setContact(MOCK_CONTACT);
      setMessages(MOCK_MESSAGES);
      return;
    }

    if (!user?.id || !id) return;

    try {
      setLoading(true);

      // Cargar información de la conversación
      const { data: conversation } = await supabase
        .from('ws_conversations')
        .select(`
          id,
          type,
          name,
          members:ws_conversation_members(
            user_id,
            profile:ws_profiles(id, display_name, username, avatar_url)
          )
        `)
        .eq('id', id)
        .single();

      if (!conversation) {
        Alert.alert('Error', 'Conversación no encontrada');
        router.back();
        return;
      }

      // Encontrar el contacto (no soy yo)
      const contactMember = conversation.members?.find((m: any) => m.user_id !== user.id);
      if (contactMember) {
        setContact({
          id: contactMember.user_id,
          name: contactMember.profile?.display_name || 'Usuario',
          avatar: contactMember.profile?.avatar_url,
          username: contactMember.profile?.username,
          isOnline: false, // TODO: implementar estado online
        });
      }

      // Cargar mensajes
      const { data: messagesData } = await supabase
        .from('ws_private_messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          is_read,
          type
        `)
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (messagesData) {
        const formattedMessages = messagesData.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.sender_id === user.id ? 'self' : msg.sender_id,
          senderName: msg.sender_id === user.id ? 'Tú' : contact?.name || 'Usuario',
          timestamp: new Date(msg.created_at),
          isRead: msg.is_read,
          type: msg.type || 'text',
        }));
        setMessages(formattedMessages);
      }

      // Marcar mensajes como leídos
      await supabase
        .from('ws_private_messages')
        .update({ is_read: true })
        .eq('conversation_id', id)
        .neq('sender_id', user.id);

    } catch (error) {
      console.error('Error loading chat data:', error);
      // Fallback a datos mock en test mode
      if (isTestMode()) {
        setContact(MOCK_CONTACT);
        setMessages(MOCK_MESSAGES);
      }
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (isDemoMode()) return;

    const channel = supabase
      .channel(`chat-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ws_private_messages',
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const newMessage = {
            id: payload.new.id,
            content: payload.new.content,
            senderId: payload.new.sender_id === user?.id ? 'self' : payload.new.sender_id,
            senderName: payload.new.sender_id === user?.id ? 'Tú' : contact?.name || 'Usuario',
            timestamp: new Date(payload.new.created_at),
            isRead: payload.new.is_read,
            type: payload.new.type || 'text',
          };
          
          setMessages(prev => [...prev, newMessage]);
          
          // Auto scroll to bottom
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);

          // Marcar como leído si no es nuestro mensaje
          if (payload.new.sender_id !== user?.id) {
            supabase
              .from('ws_private_messages')
              .update({ is_read: true })
              .eq('id', payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !user?.id || !id) return;

    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: messageText.trim(),
      senderId: 'self',
      senderName: 'Tú',
      timestamp: new Date(),
      isRead: false,
      type: 'text',
    };

    const messageToSend = messageText.trim();
    setMessageText('');
    setMessages(prev => [...prev, tempMessage]);

    // Auto scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    if (isDemoMode()) {
      // Modo demo: solo agregar mensaje visualmente
      return;
    }

    try {
      // Enviar mensaje real a Supabase
      const { data, error } = await supabase
        .from('ws_private_messages')
        .insert({
          conversation_id: id,
          sender_id: user.id,
          content: messageToSend,
          type: 'text',
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar mensaje temporal con el ID real
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, id: data.id }
          : msg
      ));

      // Actualizar timestamp de la conversación
      await supabase
        .from('ws_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);

    } catch (error) {
      console.error('Error sending message:', error);
      // Remover mensaje temporal en caso de error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  if (!contact) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          Cargando conversación...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={s.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={s.contactInfo}>
          <Avatar size={40} name={contact.name} uri={contact.avatar} />
          <View style={s.contactDetails}>
            <Text style={s.contactName} numberOfLines={1}>
              {contact.name}
            </Text>
            <Text style={s.contactStatus}>
              {contact.isOnline ? 'en línea' : 'última vez recientemente'}
            </Text>
          </View>
        </View>

        <View style={s.headerActions}>
          <TouchableOpacity style={s.headerButton} activeOpacity={0.7}>
            <Ionicons name="call" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerButton} activeOpacity={0.7}>
            <Ionicons name="videocam" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={s.messagesContainer}
        contentContainerStyle={s.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === 'self'}
          />
        ))}
      </ScrollView>

      {/* Input */}
      <View style={s.inputContainer}>
        <View style={s.inputRow}>
          <TouchableOpacity style={s.attachButton} activeOpacity={0.7}>
            <Ionicons name="add" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TextInput
            style={s.textInput}
            placeholder="Escribe un mensaje"
            placeholderTextColor={colors.textMuted}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity
            style={[s.sendButton, messageText.trim() && s.sendButtonActive]}
            onPress={sendMessage}
            disabled={!messageText.trim()}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={messageText.trim() ? "send" : "mic"} 
              size={20} 
              color={messageText.trim() ? colors.textOnPrimary : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.base,
  },
  backButton: {
    padding: spacing.xs,
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 16,
  },
  contactStatus: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.base,
    gap: spacing.xs,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 2,
  },
  messageOwn: {
    alignSelf: 'flex-end',
  },
  messageOther: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  bubbleOwn: {
    backgroundColor: colors.bubbleOwn,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.bubbleOther,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: colors.textPrimary,
  },
  messageTextOther: {
    color: colors.textPrimary,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    ...typography.caption,
    fontSize: 11,
  },
  messageTimeOwn: {
    color: colors.textMuted,
  },
  messageTimeOther: {
    color: colors.textMuted,
  },
  readStatus: {
    marginLeft: 2,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  attachButton: {
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
});