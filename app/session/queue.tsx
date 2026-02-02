/**
 * WhatsSound — Cola de Canciones (Demo Inversores)
 * Lista con votación, medallas, canción actual
 */

import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const NOW = {
  title: 'Pepas', artist: 'Farruko',
  art: 'https://e-cdns-images.dzcdn.net/images/cover/6ebe38518b35b9fab21e9a1e21b0d400/500x500-000000-80-0-0.jpg',
};

const QUEUE = [
  { id:'q1', title:'Gasolina', artist:'Daddy Yankee', art:'https://e-cdns-images.dzcdn.net/images/cover/ed4fed49e1447e63e4e8d0e0e3a20ca3/500x500-000000-80-0-0.jpg', by:'María G.', votes:8, dur:'3:12' },
  { id:'q2', title:'Despacito', artist:'Luis Fonsi ft. Daddy Yankee', art:'https://e-cdns-images.dzcdn.net/images/cover/11be4e951f2e7467b255f4e2a4c37ae8/500x500-000000-80-0-0.jpg', by:'Pablo R.', votes:6, dur:'3:47' },
  { id:'q3', title:'Dákiti', artist:'Bad Bunny & Jhay Cortez', art:'https://e-cdns-images.dzcdn.net/images/cover/59e41ee07b3a9af3e1a8a6ce79b5a7bb/500x500-000000-80-0-0.jpg', by:'Ana L.', votes:5, dur:'3:25' },
  { id:'q4', title:'La Bicicleta', artist:'Shakira & Carlos Vives', art:'https://e-cdns-images.dzcdn.net/images/cover/a61aec4942e11c528e0dda3a39978af3/500x500-000000-80-0-0.jpg', by:'Carlos M.', votes:4, dur:'3:40' },
  { id:'q5', title:'Vivir Mi Vida', artist:'Marc Anthony', art:'https://e-cdns-images.dzcdn.net/images/cover/cf1ef4ff2daa7e6fde7a171f8e934b33/500x500-000000-80-0-0.jpg', by:'Sofía T.', votes:3, dur:'4:11' },
  { id:'q6', title:'Baila Conmigo', artist:'Selena Gomez & Rauw Alejandro', art:'https://e-cdns-images.dzcdn.net/images/cover/13e56cd62c1804214ef3e8b1c01c6f67/500x500-000000-80-0-0.jpg', by:'Diego F.', votes:2, dur:'3:08' },
];

export default function QueueScreen() {
  const router = useRouter();
  const [voted, setVoted] = useState<Set<string>>(new Set());

  const vote = (id: string) => setVoted(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <View style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Cola de canciones</Text>
        <TouchableOpacity onPress={() => router.push('/session/request-song')}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Now Playing */}
      <View style={st.nowRow}><View style={st.nowDot} /><Text style={st.nowLabel}>SONANDO AHORA</Text></View>
      <View style={st.nowItem}>
        <Image source={{ uri: NOW.art }} style={st.nowArt} />
        <View style={{ flex: 1 }}>
          <Text style={st.nowTitle}>{NOW.title}</Text>
          <Text style={st.nowArtist}>{NOW.artist}</Text>
        </View>
        <View style={st.bars}><View style={[st.bar,{height:14}]} /><View style={[st.bar,{height:20}]} /><View style={[st.bar,{height:10}]} /><View style={[st.bar,{height:16}]} /></View>
      </View>

      <View style={st.divRow}>
        <Ionicons name="list" size={14} color={colors.textMuted} />
        <Text style={st.divText}>SIGUIENTES ({QUEUE.length})</Text>
      </View>

      <FlatList
        data={QUEUE}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index: i }) => {
          const v = voted.has(item.id);
          const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : null;
          return (
            <View style={st.songItem}>
              {medal ? <Text style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{medal}</Text> : <Text style={st.songNum}>{i + 1}</Text>}
              <Image source={{ uri: item.art }} style={st.songArt} />
              <View style={{ flex: 1 }}>
                <Text style={st.songTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={st.songArtist} numberOfLines={1}>{item.artist}</Text>
                <Text style={st.songMeta}>Pedida por {item.by} · {item.dur}</Text>
              </View>
              <TouchableOpacity style={st.voteBtn} onPress={() => vote(item.id)}>
                <Ionicons name={v ? 'arrow-up-circle' : 'arrow-up-circle-outline'} size={28} color={v ? colors.primary : colors.textMuted} />
                <Text style={[st.voteCount, v && { color: colors.primary }]}>{item.votes + (v ? 1 : 0)}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <TouchableOpacity style={st.fab} onPress={() => router.push('/session/request-song')} activeOpacity={0.85}>
        <Ionicons name="add" size={24} color={colors.background} />
        <Text style={st.fabText}>Pedir canción</Text>
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: .5, borderBottomColor: colors.border },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  nowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  nowLabel: { ...typography.captionBold, color: colors.primary, letterSpacing: .5 },
  nowItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, gap: spacing.md, backgroundColor: colors.primary + '10' },
  nowArt: { width: 48, height: 48, borderRadius: borderRadius.md },
  nowTitle: { ...typography.bodyBold, color: colors.primary, fontSize: 15 },
  nowArtist: { ...typography.bodySmall, color: colors.textSecondary },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 24 },
  bar: { width: 3, backgroundColor: colors.primary, borderRadius: 1.5 },
  divRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  divText: { ...typography.captionBold, color: colors.textMuted, letterSpacing: .5 },
  songItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, gap: spacing.md, borderBottomWidth: .5, borderBottomColor: colors.divider },
  songNum: { ...typography.caption, color: colors.textMuted, width: 32, textAlign: 'center', fontSize: 14 },
  songArt: { width: 44, height: 44, borderRadius: borderRadius.md },
  songTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  songArtist: { ...typography.bodySmall, color: colors.textSecondary },
  songMeta: { ...typography.caption, color: colors.textMuted },
  voteBtn: { alignItems: 'center', minWidth: 40 },
  voteCount: { ...typography.captionBold, color: colors.textMuted, marginTop: 2 },
  fab: { position: 'absolute', bottom: spacing.base, right: spacing.base, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.full, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: .3, shadowRadius: 8, elevation: 8 },
  fabText: { ...typography.buttonSmall, color: colors.background },
});
