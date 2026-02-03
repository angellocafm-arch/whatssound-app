/**
 * WhatsSound — Chats Privados
 * Lista de conversaciones privadas (WhatsApp style)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/authStore';
import { isDemoMode, isTestMode } from '../../src/lib/demo';

// Datos mock para modo demo
const MOCK_CHATS = [
  {
    id: 'c1',
    type: 'private',
    contact: {
      id: 'u1',
      name: 'DJ Carlos Madrid',
      avatar: null,
      username: 'carlosmadrid',
    },
    lastMessage: {
      content: 'Oye, ¿vas a la sesión de esta noche?',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      senderId: 'u1',
    },
    unreadCount: 2,
  },
  {
    id: 'c2',
    type: 'private',
    contact: {
      id: 'u2',
      name: 'Luna DJ',
      avatar: null,
      username: 'lunadj',
    },
    lastMessage: {
      content: '🎵 Te comparto esta canción',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      senderId: 'u2',
    },
    unreadCount: 0,
  },
  {
    id: 'c3',
    type: 'private',
    contact: {
      id: 'u3',
      name: 'Ángel Fernández',
      avatar: null,
      username: 'angel',
    },
    lastMessage: {
      content: 'Tú: Perfecto, nos vemos mañana',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      senderId: 'self',
    },
    unreadCount: 0,
  },
  {
    id: 'c4',
    type: 'private',
    contact: {
      id: 'u4',
      name: 'Sarah B',
      avatar: null,
      username: 'sarahb',
    },
    lastMessage: {
      content: 'Gracias por la invitación!',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      senderId: 'u4',
    },
    unreadCount: 0,
  },
];

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'ahora';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

interface ChatRowProps {
  chat: any;
  onPress: () => void;
}

const ChatRow = ({ chat, onPress }: ChatRowProps) => {
  const isOwn = chat.lastMessage?.senderId === 'self';
  const displayContent = isOwn ? chat.lastMessage.content : chat.lastMessage?.content || 'Sin mensajes';

  return (
    <TouchableOpacity style={s.chatRow} onPress={onPress} activeOpacity={0.7}>
      <Avatar size={50} name={chat.contact.name} uri={chat.contact.avatar} />
      
      <View style={s.chatInfo}>
        <View style={s.chatHeader}>
          <Text style={s.contactName} numberOfLines={1}>
            {chat.contact.name}
          </Text>
          <Text style={s.timestamp}>
            {formatTimestamp(chat.lastMessage?.timestamp || new Date())}
          </Text>
        </View>
        
        <View style={s.messageRow}>
          <Text style={s.lastMessage} numberOfLines={1}>
            {displayContent}
          </Text>
          {chat.unreadCount > 0 && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadText}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    if (isDemoMode()) {
      // Modo demo: usar datos mock
      setChats(MOCK_CHATS);
      return;
    }

    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Cargar conversaciones del usuario actual
      const { data: conversations } = await supabase
        .from('ws_conversations')
        .select(`
          id,
          type,
          name,
          updated_at,
          members:ws_conversation_members(
            user_id,
            last_read_at,
            profile:ws_profiles(id, display_name, username, avatar_url)
          )
        `)
        .eq('members.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!conversations) return;

      // Para cada conversación, obtener el último mensaje
      const chatsWithMessages = await Promise.all(
        conversations.map(async (conv) => {
          // Obtener último mensaje
          const { data: lastMessage } = await supabase
            .from('ws_private_messages')
            .select('content, sender_id, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Obtener count de mensajes no leídos
          const { count: unreadCount } = await supabase
            .from('ws_private_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          // Para chats privados, encontrar el contacto (no soy yo)
          const contact = conv.members?.find((m: any) => m.user_id !== user.id);

          return {
            id: conv.id,
            type: conv.type,
            contact: contact ? {
              id: contact.user_id,
              name: contact.profile?.display_name || 'Usuario',
              avatar: contact.profile?.avatar_url,
              username: contact.profile?.username,
            } : null,
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              timestamp: new Date(lastMessage.created_at),
              senderId: lastMessage.sender_id === user.id ? 'self' : lastMessage.sender_id,
            } : null,
            unreadCount: unreadCount || 0,
            updatedAt: new Date(conv.updated_at),
          };
        })
      );

      // Filtrar solo conversaciones con contacto válido
      const validChats = chatsWithMessages.filter(chat => chat.contact);
      
      setChats(validChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      // Fallback a datos mock en caso de error
      if (isTestMode()) {
        setChats(MOCK_CHATS);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatPress = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleNewChat = () => {
    router.push('/contacts');
  };

  const handleContactsPress = () => {
    router.push('/contacts');
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Chats</Text>
        <View style={s.headerActions}>
          <TouchableOpacity
            style={s.headerButton}
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.headerButton}
            onPress={handleContactsPress}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchContainer}>
        <View style={s.searchInput}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={s.searchText}
            placeholder="Buscar chats"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Chat List */}
      <ScrollView style={s.chatsList} showsVerticalScrollIndicator={false}>
        {filteredChats.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No tienes chats</Text>
            <Text style={s.emptySubtitle}>
              Toca el botón + para iniciar una conversación
            </Text>
          </View>
        ) : (
          filteredChats.map((chat) => (
            <ChatRow
              key={chat.id}
              chat={chat}
              onPress={() => handleChatPress(chat.id)}
            />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={handleNewChat}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 22,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchText: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 16,
  },
  chatsList: {
    flex: 1,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.base,
  },
  chatInfo: {
    flex: 1,
    paddingLeft: spacing.sm,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 16,
    flex: 1,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    ...typography.captionBold,
    color: colors.textOnPrimary,
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl * 3,
    paddingHorizontal: spacing.base,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 18,
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.base,
    width: 56,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});