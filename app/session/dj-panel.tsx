/**
 * WhatsSound — Panel DJ (Dashboard Principal)
 * Vista profesional para inversores — datos mock para demo
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Mock Data ───────────────────────────────────────────────
const CURRENT_SONG = {
  title: 'Pepas',
  artist: 'Farruko',
  album: 'LA 167',
  albumArt: 'https://i.scdn.co/image/ab67616d0000b273a0e9b4f42cf8e1fdabe43c4b',
  duration: '4:15',
  elapsed: '2:47',
  progress: 0.65,
};

const CHAT_MESSAGES = [
  { id: '1', user: 'María G.', text: '🔥🔥🔥 Qué temazo!!', time: 'hace 1m', avatar: '👩‍🦰' },
  { id: '2', user: 'Javi R.', text: 'DJ pon reggaeton viejo porfa', time: 'hace 2m', avatar: '🧔' },
  { id: '3', user: 'Laura S.', text: 'Increíble sesión Carlos!! 💃', time: 'hace 3m', avatar: '👱‍♀️' },
];

const NEXT_SONGS = [
  { title: 'Gasolina', artist: 'Daddy Yankee', votes: 18, requester: 'Pablo M.' },
  { title: 'Dákiti', artist: 'Bad Bunny', votes: 14, requester: 'Ana L.' },
  { title: 'La Bicicleta', artist: 'Shakira & Carlos Vives', votes: 11, requester: 'Lucía F.' },
];

// ─── Pulsing Dot Component ──────────────────────────────────
const PulsingDot = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.8, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={[styles.pulseRing, { transform: [{ scale }], opacity }]} />
      <View style={styles.liveDot} />
    </View>
  );
};

// ─── Stat Card ──────────────────────────────────────────────
const StatCard = ({ icon, iconColor, value, label }: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string;
  label: string;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBg, { backgroundColor: iconColor + '18' }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Main Component ─────────────────────────────────────────
export default function DJPanelScreen() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(true);
  const [autoDJ, setAutoDJ] = useState(true);
  const [volume, setVolume] = useState(78);
  const progressAnim = useRef(new Animated.Value(CURRENT_SONG.progress)).current;

  // Simulate progress
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      progressAnim.setValue(Math.min(1, CURRENT_SONG.progress + Math.random() * 0.01));
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Panel DJ</Text>
          <View style={styles.liveBadge}>
            <PulsingDot />
            <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => {}} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Session Info ── */}
      <View style={styles.sessionBar}>
        <Text style={styles.sessionName}>Viernes Latino 🔥</Text>
        <Text style={styles.sessionGenre}>Reggaetón clásico</Text>
      </View>

      {/* ── Stats Grid ── */}
      <View style={styles.statsGrid}>
        <StatCard icon="people" iconColor={colors.primary} value="45" label="Listeners" />
        <StatCard icon="musical-notes" iconColor={colors.accent} value="12" label="Canciones" />
        <StatCard icon="cash" iconColor={colors.warning} value="€23.50" label="Tips" />
        <StatCard icon="time" iconColor="#A78BFA" value="1h 23m" label="Activo" />
      </View>

      {/* ── Now Playing ── */}
      <View style={styles.nowPlayingCard}>
        <Text style={styles.sectionLabel}>SONANDO AHORA</Text>
        <View style={styles.nowPlayingContent}>
          <Image source={{ uri: CURRENT_SONG.albumArt }} style={styles.albumArt} />
          <View style={styles.songDetails}>
            <Text style={styles.songTitle} numberOfLines={1}>{CURRENT_SONG.title}</Text>
            <Text style={styles.songArtist} numberOfLines={1}>{CURRENT_SONG.artist}</Text>
            <Text style={styles.songAlbum} numberOfLines={1}>{CURRENT_SONG.album}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{CURRENT_SONG.elapsed}</Text>
            <Text style={styles.timeText}>{CURRENT_SONG.duration}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="play-skip-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playPauseBtn}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color={colors.textOnPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="play-skip-forward" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Volume */}
        <View style={styles.volumeRow}>
          <Ionicons name="volume-low" size={16} color={colors.textMuted} />
          <View style={styles.volumeTrack}>
            <View style={[styles.volumeFill, { width: `${volume}%` }]} />
          </View>
          <Text style={styles.volumeText}>{volume}%</Text>
        </View>
      </View>

      {/* ── Next Up (mini queue) ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⏭️ Siguiente</Text>
        <TouchableOpacity onPress={() => router.push('/session/dj-queue' as any)}>
          <Text style={styles.seeAllText}>Ver cola →</Text>
        </TouchableOpacity>
      </View>
      {NEXT_SONGS.map((song, i) => (
        <View key={i} style={styles.nextSongRow}>
          <View style={[styles.nextRank, i === 0 && styles.nextRankFirst]}>
            <Text style={[styles.nextRankText, i === 0 && styles.nextRankTextFirst]}>{i + 1}</Text>
          </View>
          <View style={styles.nextSongInfo}>
            <Text style={styles.nextSongTitle} numberOfLines={1}>{song.title}</Text>
            <Text style={styles.nextSongArtist} numberOfLines={1}>{song.artist} · {song.requester}</Text>
          </View>
          <View style={styles.nextVotes}>
            <Text style={styles.nextVotesText}>🔥 {song.votes}</Text>
          </View>
        </View>
      ))}

      {/* ── Chat Preview ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>💬 Chat</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Abrir →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chatCard}>
        {CHAT_MESSAGES.map(msg => (
          <View key={msg.id} style={styles.chatMsg}>
            <Text style={styles.chatAvatar}>{msg.avatar}</Text>
            <View style={styles.chatBubble}>
              <Text style={styles.chatUser}>{msg.user}</Text>
              <Text style={styles.chatText}>{msg.text}</Text>
            </View>
            <Text style={styles.chatTime}>{msg.time}</Text>
          </View>
        ))}
      </View>

      {/* ── Connected Users ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>👥 Conectados ahora</Text>
        <Text style={[styles.seeAllText, {color: colors.primary}]}>45 online</Text>
      </View>
      <View style={styles.connectedCard}>
        {[
          {name:'María García', status:'Escuchando Pepas 🎵', online:true, avatar:'MG', color:'#ff6b9d'},
          {name:'Pablo Rodríguez', status:'Votando en la cola', online:true, avatar:'PR', color:'#c084fc'},
          {name:'Ana López ⭐', status:'Chateando', online:true, avatar:'AL', color:'#34d399'},
          {name:'Sofía Torres', status:'Acaba de unirse', online:true, avatar:'ST', color:'#fb923c'},
          {name:'Diego Fernández', status:'Escuchando', online:true, avatar:'DF', color:'#22d3ee'},
        ].map((u, i) => (
          <View key={i} style={styles.connUser}>
            <View style={[styles.connAvatar, {backgroundColor: u.color + '30'}]}>
              <Text style={{color: u.color, fontSize:12, fontWeight:'700'}}>{u.avatar}</Text>
              <View style={styles.connOnline}/>
            </View>
            <View style={{flex:1}}>
              <Text style={styles.connName}>{u.name}</Text>
              <Text style={styles.connStatus}>{u.status}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── AI Assistant ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🤖 Asistente IA</Text>
        <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
          <View style={{width:6,height:6,borderRadius:3,backgroundColor:colors.primary}}/>
          <Text style={{color:colors.primary,fontSize:12}}>Activo</Text>
        </View>
      </View>
      <View style={styles.aiCard}>
        <View style={styles.aiMsg}>
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={16} color={colors.primary}/>
          </View>
          <View style={styles.aiBubble}>
            <Text style={styles.aiText}>He detectado que el público pide mucho reggaetón clásico. Te sugiero poner "Gasolina" a continuación — tiene 18 votos y la gente está muy activa.</Text>
            <Text style={styles.aiTime}>hace 2m</Text>
          </View>
        </View>
        <View style={styles.aiMsg}>
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={16} color={colors.primary}/>
          </View>
          <View style={styles.aiBubble}>
            <Text style={styles.aiText}>📊 El engagement ha subido un 34% en los últimos 10 minutos. El pico fue con "Pepas" — 12 reacciones en 30 segundos.</Text>
            <Text style={styles.aiTime}>hace 5m</Text>
          </View>
        </View>
        <View style={styles.aiMsg}>
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={16} color={colors.primary}/>
          </View>
          <View style={styles.aiBubble}>
            <Text style={styles.aiText}>⚠️ Mensaje reportado de "Javi R." — contenido revisado, todo OK. No requiere acción.</Text>
            <Text style={styles.aiTime}>hace 8m</Text>
          </View>
        </View>
        <View style={styles.aiInputRow}>
          <TextInput style={styles.aiInput} placeholder="Pregunta a la IA..." placeholderTextColor={colors.textMuted}/>
          <TouchableOpacity style={styles.aiSendBtn}>
            <Ionicons name="send" size={18} color={colors.textOnPrimary}/>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Quick Actions ── */}
      <Text style={styles.sectionTitle}>⚡ Acciones rápidas</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard}>
          <View style={[styles.actionIconBg, { backgroundColor: colors.accent + '20' }]}>
            <Ionicons name="megaphone" size={22} color={colors.accent} />
          </View>
          <Text style={styles.actionLabel}>Anunciar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, autoDJ && styles.actionCardActive]}
          onPress={() => setAutoDJ(!autoDJ)}
        >
          <View style={[styles.actionIconBg, { backgroundColor: autoDJ ? colors.primary + '30' : colors.surfaceLight }]}>
            <Ionicons name="sparkles" size={22} color={autoDJ ? colors.primary : colors.textMuted} />
          </View>
          <Text style={[styles.actionLabel, autoDJ && styles.actionLabelActive]}>
            AutoDJ {autoDJ ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <View style={[styles.actionIconBg, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="gift" size={22} color={colors.warning} />
          </View>
          <Text style={styles.actionLabel}>Sorpresa</Text>
        </TouchableOpacity>
      </View>

      {/* ── Navigation Row ── */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/session/dj-queue' as any)}>
          <Ionicons name="list" size={20} color={colors.accent} />
          <Text style={styles.navBtnText}>Cola</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/session/dj-people' as any)}>
          <Ionicons name="people" size={20} color={colors.primary} />
          <Text style={styles.navBtnText}>Gente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/session/share-qr' as any)}>
          <Ionicons name="qr-code" size={20} color={colors.warning} />
          <Text style={styles.navBtnText}>QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/session/stats' as any)}>
          <Ionicons name="stats-chart" size={20} color="#A78BFA" />
          <Text style={styles.navBtnText}>Stats</Text>
        </TouchableOpacity>
      </View>

      {/* ── End Session ── */}
      <TouchableOpacity style={styles.endBtn}>
        <Ionicons name="stop-circle" size={18} color={colors.error} />
        <Text style={styles.endText}>Finalizar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.base, paddingBottom: spacing['4xl'] },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,59,48,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  pulseContainer: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff3b30',
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#ff3b30' },
  liveText: { ...typography.captionBold, color: '#ff3b30', fontSize: 10, letterSpacing: 0.5 },
  settingsBtn: { padding: spacing.xs },

  // Session
  sessionBar: { marginBottom: spacing.md },
  sessionName: { ...typography.h3, color: colors.primary, fontSize: 17 },
  sessionGenre: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 17 },
  statLabel: { ...typography.caption, color: colors.textMuted, fontSize: 10 },

  // Now Playing
  nowPlayingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    ...typography.captionBold,
    color: colors.textMuted,
    letterSpacing: 1,
    fontSize: 10,
    marginBottom: spacing.sm,
  },
  nowPlayingContent: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  albumArt: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
  },
  songDetails: { flex: 1, justifyContent: 'center' },
  songTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  songArtist: { ...typography.body, color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  songAlbum: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  // Progress
  progressContainer: { marginBottom: spacing.md },
  progressTrack: {
    height: 4,
    backgroundColor: colors.progressTrack,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: { ...typography.caption, color: colors.textMuted, fontSize: 11 },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xl'],
    marginBottom: spacing.md,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Volume
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  volumeTrack: {
    flex: 1,
    height: 3,
    backgroundColor: colors.progressTrack,
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: colors.textMuted,
    borderRadius: 2,
  },
  volumeText: { ...typography.caption, color: colors.textMuted, fontSize: 11, minWidth: 30 },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 15 },
  seeAllText: { ...typography.bodySmall, color: colors.primary, fontSize: 13 },

  // Next songs
  nextSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  nextRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextRankFirst: { backgroundColor: 'rgba(255,215,0,0.2)' },
  nextRankText: { ...typography.captionBold, color: colors.textMuted, fontSize: 12 },
  nextRankTextFirst: { color: '#FFD700' },
  nextSongInfo: { flex: 1 },
  nextSongTitle: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 13 },
  nextSongArtist: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  nextVotes: {
    backgroundColor: 'rgba(255,107,0,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  nextVotesText: { ...typography.captionBold, color: '#ff6b00', fontSize: 12 },

  // Chat
  chatCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatMsg: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  chatAvatar: { fontSize: 20 },
  chatBubble: { flex: 1 },
  chatUser: { ...typography.captionBold, color: colors.primary, fontSize: 12 },
  chatText: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 13 },
  chatTime: { ...typography.caption, color: colors.textMuted, fontSize: 10, marginTop: 2 },

  // Actions
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionCardActive: {
    borderColor: colors.primary + '50',
    backgroundColor: colors.primary + '08',
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { ...typography.captionBold, color: colors.textSecondary, fontSize: 11 },
  actionLabelActive: { color: colors.primary },

  // Nav
  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navBtnText: { ...typography.captionBold, color: colors.textSecondary, fontSize: 12 },

  // End
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error + '30',
    marginBottom: spacing.xl,
  },
  endText: { ...typography.bodyBold, color: colors.error, fontSize: 14 },

  // Connected Users
  connectedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  connUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  connAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  connOnline: {
    position: 'absolute', bottom: -1, right: -1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2, borderColor: colors.surface,
  },
  connName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 13 },
  connStatus: { ...typography.caption, color: colors.textMuted, fontSize: 11 },

  // AI Chat
  aiCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    gap: spacing.sm,
  },
  aiMsg: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  aiBubble: {
    flex: 1,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  aiText: { ...typography.bodySmall, color: colors.textPrimary, fontSize: 13, lineHeight: 18 },
  aiTime: { ...typography.caption, color: colors.textMuted, fontSize: 10, marginTop: 4 },
  aiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  aiInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiSendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
