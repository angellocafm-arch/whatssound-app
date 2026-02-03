/**
 * WhatsSound — Lista de Contactos
 * Gestión de contactos y invitaciones
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
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';
import { Avatar } from '../src/components/ui/Avatar';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/stores/authStore';
import { isDemoMode, isTestMode } from '../src/lib/demo';

// Contactos mock para modo demo
const MOCK_CONTACTS = [
  {
    id: 'c1',
    userId: 'u1',
    name: 'DJ Carlos Madrid',
    username: 'carlosmadrid',
    avatar: null,
    nickname: null,
    country: 'ES',
    isOnline: true,
  },
  {
    id: 'c2',
    userId: 'u2',
    name: 'Luna DJ',
    username: 'lunadj',
    avatar: null,
    nickname: 'Luna 🌙',
    country: 'MX',
    isOnline: false,
  },
  {
    id: 'c3',
    userId: 'u3',
    name: 'Ángel Fernández',
    username: 'angel',
    avatar: null,
    nickname: null,
    country: 'ES',
    isOnline: true,
  },
  {
    id: 'c4',
    userId: 'u4',
    name: 'Sarah B',
    username: 'sarahb',
    avatar: null,
    nickname: 'DJ Sarah',
    country: 'FR',
    isOnline: false,
  },
  {
    id: 'c5',
    userId: 'u5',
    name: 'Paco Techno',
    username: 'paco',
    avatar: null,
    nickname: null,
    country: 'ES',
    isOnline: true,
  },
];

// Emojis de banderas de países
const COUNTRY_FLAGS: Record<string, string> = {
  ES: '🇪🇸',
  MX: '🇲🇽',
  FR: '🇫🇷',
  US: '🇺🇸',
  AR: '🇦🇷',
  CO: '🇨🇴',
  PE: '🇵🇪',
  CL: '🇨🇱',
  BR: '🇧🇷',
  IT: '🇮🇹',
  DE: '🇩🇪',
  UK: '🇬🇧',
  CA: '🇨🇦',
  JP: '🇯🇵',
  KR: '🇰🇷',
  IN: '🇮🇳',
  CN: '🇨🇳',
  AU: '🇦🇺',
  RU: '🇷🇺',
};

interface ContactRowProps {
  contact: any;
  onPress: () => void;
}

const ContactRow = ({ contact, onPress }: ContactRowProps) => {
  const displayName = contact.nickname || contact.name;
  const flag = COUNTRY_FLAGS[contact.country] || '🌍';

  return (
    <TouchableOpacity style={s.contactRow} onPress={onPress} activeOpacity={0.7}>
      <Avatar size={50} name={contact.name} uri={contact.avatar} />
      
      <View style={s.contactInfo}>
        <View style={s.contactHeader}>
          <Text style={s.contactName} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={s.contactMeta}>
            <Text style={s.countryFlag}>{flag}</Text>
            {contact.isOnline && <View style={s.onlineIndicator} />}
          </View>
        </View>
        
        <Text style={s.contactUsername} numberOfLines={1}>
          @{contact.username}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function ContactsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    if (isDemoMode()) {
      // Modo demo: usar datos mock
      setContacts(MOCK_CONTACTS);
      return;
    }

    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Cargar contactos del usuario actual
      const { data: contactsData } = await supabase
        .from('ws_contacts')
        .select(`
          id,
          user_id,
          nickname,
          created_at,
          contact:ws_profiles(
            id,
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!contactsData) return;

      // Formatear contactos
      const formattedContacts = contactsData
        .filter(c => c.contact) // Solo contactos válidos
        .map((contact: any) => ({
          id: contact.id,
          userId: contact.contact.id,
          name: contact.contact.display_name,
          username: contact.contact.username,
          avatar: contact.contact.avatar_url,
          nickname: contact.nickname,
          country: 'ES', // TODO: obtener del perfil
          isOnline: false, // TODO: implementar estado online
        }));

      setContacts(formattedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      // Fallback a datos mock en test mode
      if (isTestMode()) {
        setContacts(MOCK_CONTACTS);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactPress = async (contact: any) => {
    if (isDemoMode()) {
      router.push('/chat/demo-chat-1');
      return;
    }

    if (!user?.id) return;

    try {
      // Buscar conversación existente
      const { data: existingConversation } = await supabase
        .from('ws_conversation_members')
        .select(`
          conversation_id,
          conversation:ws_conversations(
            id,
            type,
            members:ws_conversation_members(user_id)
          )
        `)
        .eq('user_id', user.id);

      // Buscar conversación privada con este contacto
      let conversationId = null;
      if (existingConversation) {
        for (const conv of existingConversation) {
          const conversation = conv.conversation;
          if (conversation?.type === 'private' && conversation.members?.length === 2) {
            const otherMember = conversation.members.find((m: any) => m.user_id !== user.id);
            if (otherMember?.user_id === contact.userId) {
              conversationId = conversation.id;
              break;
            }
          }
        }
      }

      // Si no existe, crear nueva conversación
      if (!conversationId) {
        const { data: newConversation, error: convError } = await supabase
          .from('ws_conversations')
          .insert({
            type: 'private',
            name: null,
          })
          .select()
          .single();

        if (convError) throw convError;
        conversationId = newConversation.id;

        // Agregar miembros a la conversación
        const { error: membersError } = await supabase
          .from('ws_conversation_members')
          .insert([
            { conversation_id: conversationId, user_id: user.id },
            { conversation_id: conversationId, user_id: contact.userId },
          ]);

        if (membersError) throw membersError;
      }

      // Navegar al chat
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Error creating/finding conversation:', error);
      Alert.alert('Error', 'No se pudo abrir el chat');
    }
  };

  const handleInviteByLink = () => {
    router.push('/invite-contact');
  };

  const handleImportContacts = () => {
    Alert.alert('Próximamente', 'Esta función estará disponible pronto');
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Contactos</Text>
        <View style={s.placeholder} />
      </View>

      {/* Search */}
      <View style={s.searchContainer}>
        <View style={s.searchInput}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={s.searchText}
            placeholder="Buscar contactos"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={s.actionsContainer}>
        <TouchableOpacity
          style={s.actionButton}
          onPress={handleInviteByLink}
          activeOpacity={0.7}
        >
          <View style={s.actionIcon}>
            <Ionicons name="link" size={22} color={colors.primary} />
          </View>
          <Text style={s.actionText}>Invitar por link</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.actionButton}
          onPress={handleImportContacts}
          activeOpacity={0.7}
        >
          <View style={s.actionIcon}>
            <Ionicons name="phone-portrait" size={22} color={colors.textSecondary} />
          </View>
          <View style={s.actionTextContainer}>
            <Text style={s.actionText}>Importar del teléfono</Text>
            <Text style={s.actionSubtext}>Próximamente</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Contacts List */}
      <ScrollView style={s.contactsList} showsVerticalScrollIndicator={false}>
        {filteredContacts.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No tienes contactos</Text>
            <Text style={s.emptySubtitle}>
              {searchQuery ? 'No se encontraron contactos' : 'Invita amigos para empezar a chatear'}
            </Text>
          </View>
        ) : (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                {filteredContacts.length} contacto{filteredContacts.length !== 1 ? 's' : ''}
              </Text>
            </View>
            {filteredContacts.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                onPress={() => handleContactPress(contact)}
              />
            ))}
          </>
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 18,
  },
  placeholder: {
    width: 40,
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
  actionsContainer: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    gap: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    gap: spacing.base,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextContainer: {
    flex: 1,
  },
  actionText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 16,
  },
  actionSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  contactsList: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.captionBold,
    color: colors.textSecondary,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.base,
  },
  contactInfo: {
    flex: 1,
    paddingLeft: spacing.sm,
  },
  contactHeader: {
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
  contactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  countryFlag: {
    fontSize: 16,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.online,
  },
  contactUsername: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 14,
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
});