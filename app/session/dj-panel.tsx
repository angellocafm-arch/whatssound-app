/**
 * WhatsSound — Panel DJ (Dashboard Principal)
 * Vista profesional para inversores — datos mock para demo
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';
import { useLocalSearchParams } from 'expo-router';
import { getSessionTips } from '../../src/lib/tips';
import { styles } from '../../src/styles/djPanel.styles';

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
  const params = useLocalSearchParams<{ sessionId?: string; id?: string }>();
  const sessionId = params.sessionId || params.id;
  const [isPlaying, setIsPlaying] = useState(true);
  const [autoDJ, setAutoDJ] = useState(true);
  const [volume, setVolume] = useState(78);
  const progressAnim = useRef(new Animated.Value(CURRENT_SONG.progress)).current;
  const [stats, setStats] = useState({ listeners: 45, songs: 12, tips: 23.50, duration: '1h 23m' });
  const [sessionInfo, setSessionInfo] = useState({ name: 'Viernes Latino 🔥', genre: 'Reggaetón clásico' });

  // Cargar datos reales desde Supabase
  useEffect(() => {
    if (!sessionId) return;

    const loadData = async () => {
      // Cargar sesión
      const { data: session } = await supabase
        .from('ws_sessions')
        .select('name, genres, started_at')
        .eq('id', sessionId)
        .single();

      if (session) {
        const duration = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 60000);
        const hours = Math.floor(duration / 60);
        const mins = duration % 60;
        setSessionInfo({
          name: session.name,
          genre: session.genres?.[0] || 'Mix',
        });

        // Contar miembros, canciones, propinas
        const [{ count: memberCount }, { count: songCount }, tipsData] = await Promise.all([
          supabase.from('ws_session_members').select('*', { count: 'exact', head: true }).eq('session_id', sessionId).is('left_at', null),
          supabase.from('ws_songs').select('*', { count: 'exact', head: true }).eq('session_id', sessionId),
          getSessionTips(sessionId),
        ]);

        setStats({
          listeners: memberCount || 0,
          songs: songCount || 0,
          tips: tipsData.total,
          duration: `${hours}h ${mins}m`,
        });
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Actualizar cada 30s

    return () => clearInterval(interval);
  }, [sessionId]);

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
        <TouchableOpacity onPress={() => {
          if (Platform.OS === 'web') {
            window.alert('Configuración de sesión\n\n• Cerrar solicitudes\n• Terminar sesión\n• Editar información');
          } else {
            Alert.alert('Configuración', 'Opciones de sesión', [
              { text: 'Cerrar solicitudes', onPress: () => {} },
              { text: 'Terminar sesión', style: 'destructive', onPress: () => {} },
              { text: 'Cancelar', style: 'cancel' },
            ]);
          }
        }} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Session Info ── */}
      <View style={styles.sessionBar}>
        <Text style={styles.sessionName}>{sessionInfo.name}</Text>
        <Text style={styles.sessionGenre}>{sessionInfo.genre}</Text>
      </View>

      {/* ── Stats Grid ── */}
      <View style={styles.statsGrid}>
        <StatCard icon="people" iconColor={colors.primary} value={String(stats.listeners)} label="Listeners" />
        <StatCard icon="musical-notes" iconColor={colors.accent} value={String(stats.songs)} label="Canciones" />
        <StatCard icon="cash" iconColor={colors.warning} value={`€${stats.tips.toFixed(2)}`} label="Tips" />
        <StatCard icon="time" iconColor="#A78BFA" value={stats.duration} label="Activo" />
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
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/session/announce')}>
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
      <TouchableOpacity style={styles.endBtn} onPress={() => router.push('/session/rate')}>
        <Ionicons name="stop-circle" size={18} color={colors.error} />
        <Text style={styles.endText}>Finalizar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
