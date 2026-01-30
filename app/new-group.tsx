/**
 * WhatsSound — Create Group
 * Select members, set group name, create group chat
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';
import { Avatar } from '../src/components/ui/Avatar';
import { supabase } from '../src/lib/supabase';

interface UserProfile {
  id: string;
  display_name: string;
  username: string;
  is_dj: boolean;
}

export default function NewGroupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'members' | 'name'>('members');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const myId = session?.user?.id;
    setCurrentUserId(myId || null);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, username, is_dj')
      .order('display_name');

    if (data) {
      // Exclude current user from selection
      setUsers(data.filter((u: UserProfile) => u.id !== myId));
    }
    setLoading(false);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const goToName = () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Selecciona miembros', 'Elige al menos un miembro para el grupo');
      return;
    }
    setStep('name');
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Nombre requerido', 'Escribe un nombre para el grupo');
      return;
    }
    if (!currentUserId) return;

    setCreating(true);

    // All member IDs including creator
    const allMembers = [currentUserId, ...selectedUsers];

    // Create session with genre=Group, store members in current_song as JSON
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        dj_id: currentUserId,
        name: groupName.trim(),
        genre: 'Group',
        status: 'live',
        listener_count: allMembers.length,
        max_listeners: 50,
        current_song: JSON.stringify({ members: allMembers }),
      })
      .select()
      .single();

    if (error) {
      Alert.alert('Error', 'No se pudo crear el grupo');
      setCreating(false);
      return;
    }

    // Send system message
    await supabase.from('messages').insert({
      session_id: data.id,
      user_id: currentUserId,
      content: `Grupo "${groupName.trim()}" creado`,
      is_system: true,
    });

    setCreating(false);
    router.replace(`/session/${data.id}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => step === 'name' ? setStep('members') : router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {step === 'members' ? 'Nuevo grupo' : 'Nombre del grupo'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {step === 'members'
              ? `${selectedUsers.length} de ${users.length} seleccionados`
              : `${selectedUsers.length + 1} miembros`}
          </Text>
        </View>
        {step === 'members' ? (
          <TouchableOpacity
            onPress={goToName}
            style={[styles.nextBtn, selectedUsers.length === 0 && styles.nextBtnDisabled]}
          >
            <Ionicons name="arrow-forward" size={22} color={selectedUsers.length > 0 ? colors.textOnPrimary : colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={createGroup}
            style={[styles.nextBtn, !groupName.trim() && styles.nextBtnDisabled]}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Ionicons name="checkmark" size={22} color={groupName.trim() ? colors.textOnPrimary : colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {step === 'members' ? (
        <ScrollView style={styles.list}>
          {/* Selected chips */}
          {selectedUsers.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipBar}>
              {selectedUsers.map(uid => {
                const user = users.find(u => u.id === uid);
                if (!user) return null;
                return (
                  <TouchableOpacity key={uid} style={styles.chip} onPress={() => toggleUser(uid)}>
                    <Avatar name={user.display_name} size="sm" />
                    <Text style={styles.chipText}>{user.display_name}</Text>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* User list */}
          {users.map(user => {
            const isSelected = selectedUsers.includes(user.id);
            return (
              <TouchableOpacity
                key={user.id}
                style={styles.userRow}
                onPress={() => toggleUser(user.id)}
              >
                <Avatar name={user.display_name} size="md" />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.display_name}</Text>
                  <Text style={styles.userHandle}>
                    @{user.username} {user.is_dj ? '🎧 DJ' : ''}
                  </Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.nameStep}>
          {/* Group icon */}
          <View style={styles.groupIconContainer}>
            <View style={styles.groupIcon}>
              <Ionicons name="people" size={40} color={colors.primary} />
            </View>
          </View>

          {/* Group name input */}
          <TextInput
            style={styles.nameInput}
            placeholder="Nombre del grupo"
            placeholderTextColor={colors.textMuted}
            value={groupName}
            onChangeText={setGroupName}
            autoFocus
            maxLength={50}
          />

          {/* Member preview */}
          <Text style={styles.membersLabel}>Miembros: {selectedUsers.length + 1}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberPreview}>
            {/* Current user */}
            <View style={styles.memberBubble}>
              <Avatar name="Tú" size="lg" />
              <Text style={styles.memberName}>Tú</Text>
            </View>
            {selectedUsers.map(uid => {
              const user = users.find(u => u.id === uid);
              if (!user) return null;
              return (
                <View key={uid} style={styles.memberBubble}>
                  <Avatar name={user.display_name} size="lg" />
                  <Text style={styles.memberName}>{user.display_name}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  headerInfo: { flex: 1 },
  headerTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 17 },
  headerSubtitle: { ...typography.caption, color: colors.textSecondary },
  nextBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: colors.border },
  list: { flex: 1 },
  chipBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    maxHeight: 56,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingRight: spacing.sm,
    paddingLeft: 2,
    marginRight: spacing.xs,
    gap: 4,
    height: 36,
  },
  chipText: { ...typography.caption, color: colors.textPrimary },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  userInfo: { flex: 1 },
  userName: { ...typography.bodyBold, color: colors.textPrimary },
  userHandle: { ...typography.caption, color: colors.textSecondary },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  nameStep: { flex: 1, paddingTop: spacing['2xl'] },
  groupIconContainer: { alignItems: 'center', marginBottom: spacing.xl },
  groupIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  nameInput: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    marginHorizontal: spacing['2xl'],
  },
  membersLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing.md,
  },
  memberPreview: {
    paddingHorizontal: spacing.xl,
  },
  memberBubble: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 60,
  },
  memberName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
