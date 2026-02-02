import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const ITEMS: { icon: keyof typeof Ionicons.glyphMap; label: string; path: string }[] = [
  { icon: 'grid', label: 'Overview', path: '/admin' },
  { icon: 'people', label: 'Usuarios', path: '/admin/users' },
  { icon: 'radio', label: 'Sesiones', path: '/admin/sessions' },
  { icon: 'chatbubbles', label: 'Chat IA', path: '/admin/chat' },
  { icon: 'bar-chart', label: 'Engagement', path: '/admin/engagement' },
  { icon: 'cash', label: 'Revenue', path: '/admin/revenue' },
  { icon: 'warning', label: 'Alertas', path: '/admin/alerts' },
  { icon: 'settings', label: 'Config', path: '/admin/config' },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={s.sidebar}>
      <View style={s.logo}>
        <Ionicons name="headset" size={28} color={colors.primary} />
        <Text style={s.title}>WhatsSound</Text>
      </View>
      <Text style={s.subtitle}>Admin Dashboard</Text>

      {ITEMS.map((item, i) => {
        const active = pathname === item.path || (item.path === '/admin' && pathname === '/admin/');
        return (
          <TouchableOpacity key={i} style={[s.item, active && s.itemActive]} onPress={() => router.push(item.path as any)}>
            <Ionicons name={item.icon} size={18} color={active ? colors.primary : colors.textMuted} />
            <Text style={[s.itemText, active && { color: colors.primary }]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={s.footer}>
        <View style={s.admin}>
          <View style={s.avatar}><Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>KA</Text></View>
          <View>
            <Text style={s.name}>Kike & Ángel</Text>
            <Text style={s.role}>Super Admin</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sidebar: { width: 240, backgroundColor: '#0d1321', borderRightWidth: 1, borderRightColor: colors.border, paddingTop: spacing.xl, paddingHorizontal: spacing.md },
  logo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  title: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  subtitle: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginBottom: spacing.xl },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: borderRadius.md, marginBottom: 2 },
  itemActive: { backgroundColor: colors.primary + '15' },
  itemText: { ...typography.bodySmall, color: colors.textMuted, fontSize: 13 },
  footer: { position: 'absolute', bottom: spacing.xl, left: spacing.md, right: spacing.md },
  admin: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 13 },
  role: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
});
