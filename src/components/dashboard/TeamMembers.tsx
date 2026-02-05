/**
 * WhatsSound — Team Members Component
 * Lista de miembros del equipo con roles
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  status: 'online' | 'offline';
}

interface TeamMembersProps {
  members: TeamMember[];
  onInvite?: () => void;
}

export const TeamMembers: React.FC<TeamMembersProps> = ({ members, onInvite }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👥 Equipo</Text>
        {onInvite && (
          <TouchableOpacity style={styles.addBtn} onPress={onInvite}>
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addBtnText}>Invitar</Text>
          </TouchableOpacity>
        )}
      </View>

      {members.map((member, idx) => (
        <View key={idx} style={styles.memberCard}>
          <Text style={styles.avatar}>{member.avatar}</Text>
          <View style={styles.info}>
            <Text style={styles.name}>{member.name}</Text>
            <Text style={styles.role}>{member.role}</Text>
          </View>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: member.status === 'online' ? '#10B981' : colors.textMuted },
            ]}
          />
        </View>
      ))}
    </View>
  );
};

export const RolesInfo: React.FC = () => {
  const roles = [
    { name: 'Owner', desc: 'Control total' },
    { name: 'Admin', desc: 'Gestión de sesiones y equipo' },
    { name: 'Moderador', desc: 'Moderar chat y aprobar canciones' },
    { name: 'DJ', desc: 'Crear y gestionar sesiones' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Roles disponibles</Text>
      <View style={styles.rolesCard}>
        {roles.map((role, idx) => (
          <View key={idx} style={styles.roleRow}>
            <Text style={styles.roleName}>{role.name}</Text>
            <Text style={styles.roleDesc}>{role.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  role: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rolesCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  roleName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  roleDesc: {
    ...typography.caption,
    color: colors.textMuted,
  },
});

export default TeamMembers;
