/**
 * WhatsSound — Centro de Notificaciones / Actividad
 * Referencia: 29-centro-notificaciones.png
 * Tabs: Todo, Sesiones, Propinas, Menciones
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';

type NotifType = 'session' | 'song' | 'tip' | 'mention' | 'join' | 'rating';

interface Notif {
  id: string;
  type: NotifType;
  text: string;
  bold: string[];
  time: string;
  unread: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}

const NOTIFS: Notif[] = [
  { id:'1', type:'session', text:'DJ Marcos inició sesión Viernes Latino 🔥', bold:['DJ Marcos','Viernes Latino'], time:'Hace 2 min', unread:true, icon:'headset', iconColor:'#A78BFA', iconBg:'#A78BFA18' },
  { id:'2', type:'song', text:'Tu canción Pepas va a sonar 🎵 ¡Prepárate!', bold:['Pepas'], time:'Hace 5 min', unread:true, icon:'musical-notes', iconColor:colors.primary, iconBg:colors.primary+'18' },
  { id:'3', type:'tip', text:'Laura te dio propina €5 🙌', bold:['Laura'], time:'Hace 15 min', unread:true, icon:'cash', iconColor:colors.warning, iconBg:colors.warning+'18' },
  { id:'4', type:'mention', text:'Te mencionaron en Viernes Latino: "@marcos ponla de nuevo!"', bold:['Viernes Latino'], time:'Hace 30 min', unread:false, icon:'chatbubble', iconColor:colors.textSecondary, iconBg:colors.surfaceLight },
  { id:'5', type:'session', text:'DJ Sara inició sesión Techno Nights', bold:['DJ Sara','Techno Nights'], time:'Hace 1h', unread:false, icon:'headset', iconColor:'#A78BFA', iconBg:'#A78BFA18' },
  { id:'6', type:'join', text:'Carlos se unió a tu sesión Chill Vibes', bold:['Carlos','Chill Vibes'], time:'Hace 2h', unread:false, icon:'people', iconColor:colors.accent, iconBg:colors.accent+'18' },
  { id:'7', type:'rating', text:'Pedro te valoró con 5★ en Reggaeton Mix', bold:['Pedro','Reggaeton Mix'], time:'Hace 3h', unread:false, icon:'star', iconColor:colors.warning, iconBg:colors.warning+'18' },
  { id:'8', type:'tip', text:'Ana te dio propina €2', bold:['Ana'], time:'Ayer', unread:false, icon:'cash', iconColor:colors.warning, iconBg:colors.warning+'18' },
  { id:'9', type:'song', text:'Tu canción Yandel 150 sonó en Sábado Mix', bold:['Yandel 150','Sábado Mix'], time:'Ayer', unread:false, icon:'musical-note', iconColor:colors.primary, iconBg:colors.primary+'18' },
];

const TABS = [
  { key: 'all', label: 'Todo' },
  { key: 'session', label: 'Sesiones' },
  { key: 'tip', label: 'Propinas' },
  { key: 'mention', label: 'Menciones' },
] as const;

export default function NotificationsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<string>('all');

  const filtered = tab === 'all' ? NOTIFS : NOTIFS.filter(n => n.type === tab);

  const renderText = (notif: Notif) => {
    // Simple bold rendering - just return plain text for now
    return <Text style={s.notifText}>{notif.text}</Text>;
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Actividad</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}>
            <Text style={[s.tabText, tab === t.key && s.tabActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={s.list}>
        {filtered.map(notif => (
          <TouchableOpacity key={notif.id} style={s.notifRow} activeOpacity={0.7}>
            <View style={[s.notifIcon, { backgroundColor: notif.iconBg }]}>
              <Ionicons name={notif.icon} size={20} color={notif.iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              {renderText(notif)}
              <Text style={s.notifTime}>{notif.time}</Text>
            </View>
            {notif.unread && <View style={s.unreadDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary, fontSize: 22 },
  tabs: { flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.base, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabText: { ...typography.bodySmall, color: colors.textMuted, fontSize: 14 },
  tabActive: { color: colors.primary, fontWeight: '600' },
  list: { paddingBottom: 40 },
  notifRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border + '40',
  },
  notifIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  notifText: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  notifTime: { ...typography.caption, color: colors.textMuted, fontSize: 12, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
