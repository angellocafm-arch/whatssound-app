/**
 * WhatsSound — Pantalla de Sesión (Demo Inversores)
 * Tabs: Reproductor | Chat | Cola | Gente
 * Datos mock — "DJ Carlos Madrid — Viernes Latino"
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Image,
  Animated, Dimensions, ScrollView, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/lib/supabase';
import { PresenceBar } from '../../src/components/session/PresenceBar';
import { FloatingReactionsContainer, sendReaction } from '../../src/components/session/FloatingReactionsContainer';
import { GoldenBoostButton } from '../../src/components/session/GoldenBoostButton';
import { GoldenBoostAnimation } from '../../src/components/session/GoldenBoostAnimation';
import { useGoldenBoostNotifications } from '../../src/hooks/useGoldenBoostRealtime';
import { useAudioSync, useDecibels } from '../../src/hooks';
import { DecibelModal } from '../../src/components/DecibelModal';
import { useAuthStore } from '../../src/stores/authStore';
import { styles as s } from '../../src/styles/sessionDetail.styles';
// AudioPreview temporarily disabled — will re-enable after fixing
// import AudioPreview from '../../src/components/AudioPreview';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ══════════ MOCK DATA ══════════

const SESSION = {
  djName: 'DJ Carlos Madrid',
  genre: 'Reggaetón / Latin',
  listeners: 45,
  queueCount: 12,
};

const NOW = {
  title: 'Pepas', artist: 'Farruko', album: 'La 167',
  art: 'https://e-cdns-images.dzcdn.net/images/cover/6ebe38518b35b9fab21e9a1e21b0d400/500x500-000000-80-0-0.jpg',
  duration: 204, currentTime: 107,
};

const QUEUE = [
  { id: 'q1', title: 'Gasolina', artist: 'Daddy Yankee', art: 'https://e-cdns-images.dzcdn.net/images/cover/ed4fed49e1447e63e4e8d0e0e3a20ca3/500x500-000000-80-0-0.jpg', by: 'María G.', votes: 8, dur: '3:12' },
  { id: 'q2', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', art: 'https://e-cdns-images.dzcdn.net/images/cover/11be4e951f2e7467b255f4e2a4c37ae8/500x500-000000-80-0-0.jpg', by: 'Pablo R.', votes: 6, dur: '3:47' },
  { id: 'q3', title: 'Dákiti', artist: 'Bad Bunny & Jhay Cortez', art: 'https://e-cdns-images.dzcdn.net/images/cover/59e41ee07b3a9af3e1a8a6ce79b5a7bb/500x500-000000-80-0-0.jpg', by: 'Ana L.', votes: 5, dur: '3:25' },
  { id: 'q4', title: 'La Bicicleta', artist: 'Shakira & Carlos Vives', art: 'https://e-cdns-images.dzcdn.net/images/cover/a61aec4942e11c528e0dda3a39978af3/500x500-000000-80-0-0.jpg', by: 'Carlos M.', votes: 4, dur: '3:40' },
  { id: 'q5', title: 'Vivir Mi Vida', artist: 'Marc Anthony', art: 'https://e-cdns-images.dzcdn.net/images/cover/cf1ef4ff2daa7e6fde7a171f8e934b33/500x500-000000-80-0-0.jpg', by: 'Sofía T.', votes: 3, dur: '4:11' },
  { id: 'q6', title: 'Baila Conmigo', artist: 'Selena Gomez & Rauw Alejandro', art: 'https://e-cdns-images.dzcdn.net/images/cover/13e56cd62c1804214ef3e8b1c01c6f67/500x500-000000-80-0-0.jpg', by: 'Diego F.', votes: 2, dur: '3:08' },
];

interface ChatMsg { id: string; user: string; text: string; time: string; isMine: boolean; role?: 'dj'|'vip'|'mod'; }

const CHAT: ChatMsg[] = [
  { id:'c1', user:'DJ Carlos', text:'¡Bienvenidos al Viernes Latino! 🎉🔥 Vamos a darle caña toda la noche', time:'22:15', isMine:false, role:'dj' },
  { id:'c2', user:'María G.', text:'🔥🔥🔥 Vamos!!!', time:'22:16', isMine:false },
  { id:'c3', user:'Pablo R.', text:'Ponme reggaetón viejo porfa!!', time:'22:17', isMine:false },
  { id:'c4', user:'Tú', text:'Esta sesión está brutal 🙌', time:'22:18', isMine:true },
  { id:'c5', user:'Ana L.', text:'DJ Carlos el mejor de Madrid!! ❤️', time:'22:19', isMine:false, role:'vip' },
  { id:'c6', user:'DJ Carlos', text:'Pepas para arrancar! A mover esas caderas 💃', time:'22:20', isMine:false, role:'dj' },
  { id:'c7', user:'Sofía T.', text:'TEMAZOOO 🎵🔥🔥', time:'22:21', isMine:false },
  { id:'c8', user:'Diego F.', text:'Quién más está en la pista? 🕺', time:'22:22', isMine:false },
  { id:'c9', user:'ModLaura', text:'Recordad que podéis pedir canciones 🎶', time:'22:22', isMine:false, role:'mod' },
  { id:'c10', user:'Tú', text:'La siguiente tiene que ser Gasolina!! 🔥', time:'22:23', isMine:true },
  { id:'c11', user:'Carlos M.', text:'Jajaja todos pidiendo reggaetón 😂😂', time:'22:24', isMine:false },
  { id:'c12', user:'María G.', text:'¿Alguien más bailando en casa? 💃🕺', time:'22:25', isMine:false },
];

const PEOPLE = [
  { id:'p1', name:'DJ Carlos Madrid', role:'dj' as const, on:true },
  { id:'p2', name:'ModLaura', role:'mod' as const, on:true },
  { id:'p3', name:'Ana López', role:'vip' as const, on:true },
  { id:'p4', name:'María García', role:undefined, on:true },
  { id:'p5', name:'Pablo Rodríguez', role:undefined, on:true },
  { id:'p6', name:'Sofía Torres', role:undefined, on:true },
  { id:'p7', name:'Diego Fernández', role:undefined, on:true },
  { id:'p8', name:'Carlos Martín', role:undefined, on:true },
  { id:'p9', name:'Lucía Vega', role:undefined, on:true },
  { id:'p10', name:'Javier Hernández', role:undefined, on:false },
];

const REACTIONS = ['🔥','❤️','👏','😂','🎵'];

type TabKey = 'player'|'chat'|'queue'|'people';
const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key:'player', label:'Reproductor', icon:'musical-note' },
  { key:'chat', label:'Chat', icon:'chatbubbles' },
  { key:'queue', label:'Cola', icon:'list' },
  { key:'people', label:'Gente', icon:'people' },
];

// ══════════ HELPERS ══════════

const UCOLORS = ['#ff6b9d','#c084fc','#fb923c','#34d399','#f472b6','#a78bfa','#fbbf24','#22d3ee'];
const uColor = (n: string) => UCOLORS[n.length % UCOLORS.length];
const fmtTime = (s: number) => `${Math.floor(s/60)}:${(Math.floor(s%60)).toString().padStart(2,'0')}`;
const initials = (n: string) => n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

// ══════════ SUB-COMPONENTS ══════════

const RoleBadge = ({ role }: { role: 'dj'|'vip'|'mod' }) => {
  const c = { dj: { l:'🎧 DJ', bg:colors.primary+'30', c:colors.primary }, vip: { l:'⭐ VIP', bg:'#FFA72630', c:'#FFA726' }, mod: { l:'🛡️ MOD', bg:colors.accent+'30', c:colors.accent } }[role];
  return <View style={[s.roleBadge,{backgroundColor:c.bg}]}><Text style={[s.roleBadgeText,{color:c.c}]}>{c.l}</Text></View>;
};

// ══════════ MAIN SCREEN ══════════

const USER_PROFILES: Record<string, {name:string, msgs: {text:string,time:string}[]}> = {
  maria: { name: 'María García', msgs: [
    {text:'🔥🔥🔥 Vamos!!!', time:'22:16'},
    {text:'¿Alguien más bailando en casa? 💃🕺', time:'22:25'},
  ]},
  pablo: { name: 'Pablo Rodríguez', msgs: [
    {text:'Ponme reggaetón viejo porfa!!', time:'22:17'},
    {text:'Gasolina next pls 🙏', time:'22:26'},
  ]},
};

export default function SessionScreen() {
  const { id, user } = useLocalSearchParams<{ id: string; user?: string }>();
  const router = useRouter();
  const userProfile = user ? USER_PROFILES[user] : null;
  const userName = userProfile?.name || 'Tú';
  const [tab, setTab] = useState<TabKey>('player');
  const [msg, setMsg] = useState('');
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => {
    if (!userProfile) return CHAT;
    return CHAT.map(m => {
      if (userProfile.msgs.some(um => um.text === m.text)) return {...m, user: userName, isMine: true};
      if (m.isMine) return {...m, user: 'Invitado', isMine: false};
      return m;
    });
  });
  const [progress, setProgress] = useState(NOW.currentTime / NOW.duration);
  const [playing, setPlaying] = useState(true);
  const audioRef = useRef<any>(null);
  useEffect(() => () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }, []);

  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [floats, setFloats] = useState<{id:string;emoji:string;anim:Animated.Value;x:number}[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [dbQueue, setDbQueue] = useState<any[]>([]);
  const [dbChat, setDbChat] = useState<ChatMsg[]>([]);
  const [dbPeople, setDbPeople] = useState<any[]>([]);
  const [showDecibelModal, setShowDecibelModal] = useState(false);
  const listRef = useRef<FlatList>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  
  // Golden Boost realtime notifications
  const { showAnimation: showGoldenBoost, currentBoost, hideAnimation: hideGoldenBoost } = 
    useGoldenBoostNotifications(id as string || '');

  // Audio sync between DJ and listeners
  const { user: authUser } = useAuthStore();
  const isDJ = sessionData?.dj_id === authUser?.id;
  const syncSong = sessionData?.songs?.find((s: { status: string }) => s.status === 'playing') || NOW;
  const currentTimeMs = progress * (syncSong.duration || NOW.duration) * 1000;
  
  const { isSynced, isSyncing } = useAudioSync({
    sessionId: id as string || '',
    isDJ,
    songId: syncSong.id || 'demo',
    currentTimeMs,
    isPlaying: playing,
    onSeekTo: (timeMs) => {
      if (audioRef.current) {
        audioRef.current.currentTime = timeMs / 1000;
        setProgress(timeMs / 1000 / (syncSong.duration || NOW.duration));
      }
    },
    enabled: !!(id && !id.startsWith('mock-')),
  });

  // Decibels system
  const { state: decibelState, earnDecibels } = useDecibels();
  const [earnedThisSession, setEarnedThisSession] = useState(0);

  // Track listening time - earn 1 dB per minute
  useEffect(() => {
    if (!playing || !id) return;
    
    const interval = setInterval(() => {
      if (playing && id && !id.startsWith('mock-')) {
        earnDecibels(id, 1);
        setEarnedThisSession(prev => prev + 1);
      }
    }, 60000); // Every 60 seconds

    return () => clearInterval(interval);
  }, [playing, id, earnDecibels]);

  // Load from Supabase if real UUID
  useEffect(() => {
    if (!id || id.startsWith('mock-')) return;
    (async () => {
      try {
        // Session info
        const { data: sess } = await supabase
          .from('ws_sessions').select('*, dj:ws_profiles!dj_id(dj_name, display_name)')
          .eq('id', id).single();
        if (sess) setSessionData(sess);

        // Queue
        const { data: songs } = await supabase
          .from('ws_songs').select('*, requester:ws_profiles!user_id(display_name)')
          .eq('session_id', id).in('status', ['queued', 'playing'])
          .order('vote_count', { ascending: false });
        if (songs) setDbQueue(songs);

        // Chat
        const { data: chatMsgs } = await supabase
          .from('ws_messages').select('*, author:ws_profiles!author_id(display_name)')
          .eq('session_id', id).order('created_at', { ascending: true }).limit(50);
        if (chatMsgs) {
          setDbChat(chatMsgs.map((m: { id: string; sender_id: string; content: string; created_at: string; sender?: { display_name?: string } }) => ({
            id: m.id, user: m.author?.display_name || 'Anónimo',
            text: m.content, time: new Date(m.created_at).toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'}),
            isMine: false, role: m.type === 'dj_announce' ? 'dj' as const : undefined,
          })));
        }

        // People
        const { data: members } = await supabase
          .from('ws_session_members').select('*, profile:ws_profiles!user_id(display_name)')
          .eq('session_id', id).is('left_at', null);
        if (members) {
          setDbPeople(members.map((m: { id: string; sender_id: string; content: string; created_at: string; sender?: { display_name?: string } }) => ({
            id: m.id, name: m.profile?.display_name || 'Anónimo',
            role: m.role === 'dj' ? 'dj' : m.role === 'vip' ? 'vip' : m.role === 'moderator' ? 'mod' : undefined,
            on: true,
          })));
        }
      } catch (e) { /* fallback to mocks */ }
    })();
  }, [id]);

  // Use DB data if available
  const activeSession = sessionData || SESSION;
  const activeQueue = dbQueue.length > 0 ? dbQueue.map((s: { id: string; title: string; artist: string; album_art?: string; votes?: number }) => ({
    id: s.id, 
    title: s.title, 
    artist: s.artist, 
    art: s.cover_url || '', 
    preview: s.preview_url || '',
    album: s.album_name || '',
    by: s.requester?.display_name || '??',
    votes: s.vote_count, 
    dur: fmtTime(Math.round(s.duration_ms / 1000)),
  })) : QUEUE;
  const activeChat = dbChat.length > 0 ? dbChat : msgs;
  const activePeople = dbPeople.length > 0 ? dbPeople : PEOPLE;
  const activeNow = dbQueue.find((s: { status: string }) => s.status === 'playing');
  const nowPlaying = activeNow ? {
    title: activeNow.title, 
    artist: activeNow.artist, 
    album: activeNow.album_name || '',
    art: activeNow.cover_url || '', 
    preview: activeNow.preview_url || '',
    duration: Math.round(activeNow.duration_ms / 1000), 
    currentTime: 0,
  } : NOW;

  // Play/pause: fetch fresh Deezer preview and play via HTML5 Audio
  const toggleAudio = async () => {
    if (typeof window === 'undefined') return;
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause(); setPlaying(false); return;
    }
    if (audioRef.current?.src) {
      audioRef.current.play().catch(() => {}); setPlaying(true); return;
    }
    const q = encodeURIComponent(`${nowPlaying.artist} ${nowPlaying.title}`);
    try {
      const res = await fetch(`/api/deezer?q=${q}&type=track`);
      const data = await res.json();
      const url = data?.data?.[0]?.preview;
      if (!url) return;
      const Aud = (globalThis as any).Audio || (window as any).Audio;
      if (!Aud) return;
      const a = new Aud(url); a.volume = 0.8;
      a.addEventListener('ended', () => setPlaying(false));
      audioRef.current = a;
      await a.play(); setPlaying(true);
    } catch (e) { console.error('Audio:', e); }
  };

  useEffect(() => {
    if (!playing) return;
    const i = setInterval(() => setProgress(p => p + 1/nowPlaying.duration >= 1 ? 0 : p + 1/nowPlaying.duration), 1000);
    return () => clearInterval(i);
  }, [playing]);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue:1.3, duration:800, useNativeDriver:true }),
      Animated.timing(pulse, { toValue:1, duration:800, useNativeDriver:true }),
    ])).start();
  }, []);

  const react = useCallback((emoji: string) => {
    // Animación local legacy
    const rid = `r${Date.now()}${Math.random()}`;
    const a = new Animated.Value(0);
    const x = Math.random()*(SCREEN_WIDTH-60)+20;
    setFloats(p => [...p, { id:rid, emoji, anim:a, x }]);
    Animated.timing(a, { toValue:1, duration:1500, useNativeDriver:true }).start(() =>
      setFloats(p => p.filter(r => r.id !== rid))
    );
    // Nuevo: Broadcast a otros usuarios via Supabase
    if (id) sendReaction(id as string, emoji, user);
  }, [id, user]);

  const send = () => {
    if (!msg.trim()) return;
    setMsgs(p => [...p, { id:`c${Date.now()}`, user:userName, text:msg.trim(), time: new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}), isMine:true }]);
    setMsg('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated:true }), 100);
  };

  const vote = (sid: string) => setVoted(p => { const n=new Set(p); n.has(sid)?n.delete(sid):n.add(sid); return n; });

  // ── HEADER ──
  const Header = () => (
    <View style={s.header}>
      <TouchableOpacity onPress={() => router.back()} style={{padding:spacing.xs}}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <View style={s.djAvatar}>
        <Text style={s.djInit}>DC</Text>
        <Animated.View style={[s.liveDot,{transform:[{scale:pulse}]}]} />
      </View>
      <View style={{flex:1}}>
        <Text style={s.hTitle} numberOfLines={1}>{activeSession.djName || activeSession.dj?.dj_name || "DJ"}</Text>
        <Text style={s.hSub}>{activeSession.genre || activeSession.genres?.join(", ") || "Mix"} · <Text style={{color:colors.primary}}>{activeSession.listeners || activePeople.length} oyentes</Text></Text>
      </View>
      <View style={s.liveBadge}><View style={s.liveRedDot}/><Text style={s.liveText}>EN VIVO</Text></View>
      {!isDJ && isSynced && <View style={s.syncBadge}><Text style={s.syncText}>✓ Sync</Text></View>}
      {!isDJ && isSyncing && <View style={s.syncingBadge}><Text style={s.syncingText}>⟳</Text></View>}
      {earnedThisSession > 0 && (
        <View style={s.dbEarnedBadge}>
          <Text style={s.dbEarnedText}>+{earnedThisSession} dB</Text>
        </View>
      )}
      {isDJ && (
        <TouchableOpacity onPress={() => router.push(`/session/dj-panel?sid=${id}`)} style={{padding:spacing.xs, marginLeft:spacing.xs}}>
          <Ionicons name="settings-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => router.push(`/session/invite?sid=${id}`)} style={{padding:spacing.xs, marginLeft: isDJ ? 0 : spacing.xs}}>
        <Ionicons name="person-add-outline" size={22} color={colors.textPrimary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push(`/session/share-qr?sid=${id}`)} style={{padding:spacing.xs}}>
        <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push(`/session/stats?sid=${id}`)} style={{padding:spacing.xs}}>
        <Ionicons name="stats-chart-outline" size={22} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  // ── PLAYER ──
  const Player = () => (
    <ScrollView style={{flex:1}} contentContainerStyle={{alignItems:'center',paddingBottom:spacing['3xl'],paddingTop:spacing.sm}}>
      {/* Art */}
      <View style={s.artWrap}>
        {nowPlaying.art ? (
          <Image source={{ uri: nowPlaying.art }} style={s.artImg} />
        ) : (
          <View style={[s.artImg, {backgroundColor: colors.primary + '33', justifyContent:'center', alignItems:'center'}]}>
            <Ionicons name="musical-notes" size={80} color={colors.primary} />
          </View>
        )}
        <View style={s.artGlow} />
      </View>
      {/* Info */}
      <Text style={s.pTitle}>{nowPlaying.title}</Text>
      <Text style={s.pArtist}>{nowPlaying.artist}</Text>
      <Text style={s.pAlbum}>{nowPlaying.album}</Text>
      
      {/* Audio Preview */}
      {nowPlaying.preview && (
        <View style={{marginTop: spacing.lg, alignItems: 'center'}}>
          {/* AudioPreview disabled temporarily */}
        </View>
      )}
      {/* Progress */}
      <View style={s.progWrap}>
        <View style={s.progTrack}>
          <View style={[s.progFill,{width:`${progress*100}%`}]} />
          <View style={[s.progThumb,{left:`${progress*100}%`}]} />
        </View>
        <View style={s.progTimes}>
          <Text style={s.progTime}>{fmtTime(progress*nowPlaying.duration)}</Text>
          <Text style={s.progTime}>{fmtTime(nowPlaying.duration)}</Text>
        </View>
      </View>
      {/* Controls */}
      <View style={s.ctrlRow}>
        <TouchableOpacity><Ionicons name="shuffle" size={24} color={colors.textMuted}/></TouchableOpacity>
        <TouchableOpacity><Ionicons name="play-skip-back" size={28} color={colors.textPrimary}/></TouchableOpacity>
        <TouchableOpacity style={s.playBtn} onPress={toggleAudio}>
          <Ionicons name={playing?'pause':'play'} size={32} color={colors.background}/>
        </TouchableOpacity>
        <TouchableOpacity><Ionicons name="play-skip-forward" size={28} color={colors.textPrimary}/></TouchableOpacity>
        <TouchableOpacity><Ionicons name="repeat" size={24} color={colors.textMuted}/></TouchableOpacity>
      </View>
      {/* Reactions */}
      <Text style={s.reactLabel}>Reacciona</Text>
      <View style={s.reactRow}>
        {REACTIONS.map(e => (
          <TouchableOpacity key={e} style={s.reactBtn} onPress={()=>react(e)} activeOpacity={0.6}>
            <Text style={{fontSize:28}}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Action Buttons: Tip + Golden Boost */}
      <View style={{marginTop: spacing.xl, flexDirection: 'row', justifyContent: 'center', gap: spacing.md}}>
        <TouchableOpacity 
          style={s.tipButton}
          onPress={() => setShowDecibelModal(true)}
          activeOpacity={0.7}
        >
          <Text style={{fontSize: 24}}>🔊</Text>
          <Text style={s.tipButtonText}>Volumen</Text>
        </TouchableOpacity>
        <GoldenBoostButton
          djId={activeSession.dj_id || 'mock-dj'}
          djName={activeSession.djName || activeSession.dj?.dj_name || 'DJ Carlos'}
          sessionId={id as string}
          size="large"
        />
      </View>

      {/* Decibel Modal */}
      <DecibelModal
        visible={showDecibelModal}
        onClose={() => setShowDecibelModal(false)}
        djId={activeSession.dj_id || 'mock-dj'}
        djName={activeSession.djName || activeSession.dj?.dj_name || 'DJ Carlos'}
        sessionId={id as string}
      />
      {/* Up Next */}
      <View style={s.upNext}>
        <Text style={s.upNextLabel}>A continuación</Text>
        {activeQueue.slice(0,3).map((q,i) => (
          <View key={q.id} style={s.upNextItem}>
            <Text style={s.upNextNum}>{i+1}</Text>
            {q.art ? (
              <Image source={{ uri: q.art }} style={s.upNextArt} />
            ) : (
              <View style={[s.upNextArt, {backgroundColor: colors.primary+"22", justifyContent:"center", alignItems:"center"}]}><Ionicons name="musical-note" size={16} color={colors.primary} /></View>
            )}
            <View style={{flex:1}}><Text style={s.upNextTitle} numberOfLines={1}>{q.title}</Text><Text style={s.upNextArtist} numberOfLines={1}>{q.artist}</Text></View>
            <Text style={{fontSize:12}}>🔥 {q.votes}</Text>
          </View>
        ))}
      </View>
      {/* Floating reactions */}
      {floats.map(r => (
        <Animated.Text key={r.id} style={{
          position:'absolute', bottom:80, left:r.x, fontSize:28,
          opacity: r.anim.interpolate({inputRange:[0,.3,1],outputRange:[1,1,0]}),
          transform: [
            {translateY: r.anim.interpolate({inputRange:[0,1],outputRange:[0,-200]})},
            {scale: r.anim.interpolate({inputRange:[0,.2,1],outputRange:[.5,1.3,.8]})},
          ],
        }}>{r.emoji}</Animated.Text>
      ))}
    </ScrollView>
  );

  // ── CHAT ──
  const Chat = () => (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={120}>
      <FlatList
        ref={listRef} data={activeChat} keyExtractor={i=>i.id}
        renderItem={({item}) => (
          <View style={[s.bRow, item.isMine?s.bRowMine:s.bRowOther]}>
            <View style={[s.bub, item.isMine?s.bubMine:s.bubOther, !item.isMine&&{borderLeftColor:uColor(item.user)}]}>
              {!item.isMine && <View style={s.bubHead}><Text style={[s.bubUser,{color:uColor(item.user)}]}>{item.user}</Text>{item.role&&<RoleBadge role={item.role}/>}</View>}
              <Text style={s.bubText}>{item.text}</Text>
              <Text style={[s.bubTime, item.isMine&&{color:'rgba(255,255,255,0.6)'}]}>{item.time}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{paddingHorizontal:spacing.md,paddingVertical:spacing.sm,gap:spacing.xs}}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={()=>listRef.current?.scrollToEnd({animated:true})}
      />
      <View style={s.chatBar}>
        <TextInput
          style={s.chatInput}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colors.textMuted}
          value={msg} onChangeText={setMsg}
          onSubmitEditing={send} returnKeyType="send"
          selectionColor={colors.primary}
        />
        <TouchableOpacity style={s.chatSend} onPress={send}>
          <Ionicons name="send" size={20} color={colors.textOnPrimary}/>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // ── QUEUE ──
  const Queue = () => (
    <View style={{flex:1}}>
      <View style={s.qNowRow}><View style={s.qNowDot}/><Text style={s.qNowText}>SONANDO AHORA</Text></View>
      <View style={s.qCurrent}>
        {nowPlaying.art ? (
          <Image source={{ uri: nowPlaying.art }} style={s.qCurArt} />
        ) : (
          <View style={[s.qCurArt, {backgroundColor: colors.primary+"22", justifyContent:"center", alignItems:"center"}]}><Ionicons name="musical-notes" size={20} color={colors.primary} /></View>
        )}
        <View style={{flex:1}}><Text style={s.qCurTitle}>{nowPlaying.title}</Text><Text style={s.qCurArtist}>{nowPlaying.artist}</Text></View>
        <View style={s.qBars}><View style={[s.qBar,{height:14}]}/><View style={[s.qBar,{height:20}]}/><View style={[s.qBar,{height:10}]}/><View style={[s.qBar,{height:16}]}/></View>
      </View>
      <View style={s.qDivRow}><Ionicons name="list" size={14} color={colors.textMuted}/><Text style={s.qDivText}>SIGUIENTES ({activeQueue.length})</Text></View>
      <FlatList data={activeQueue} keyExtractor={i=>i.id} contentContainerStyle={{paddingBottom:80}} showsVerticalScrollIndicator={false}
        renderItem={({item,index:i}) => {
          const v = voted.has(item.id);
          const medal = i<3 ? ['🥇','🥈','🥉'][i] : null;
          return (
            <TouchableOpacity style={s.qItem} onPress={() => router.push(`/session/song-detail?sid=${id}&songId=${item.id}`)} activeOpacity={0.7}>
              {medal ? <Text style={{fontSize:20,width:32,textAlign:'center'}}>{medal}</Text> : <Text style={s.qNum}>{i+1}</Text>}
              {item.art ? (
                <Image source={{ uri: item.art }} style={s.qArt} />
              ) : (
                <View style={[s.qArt, {backgroundColor: colors.primary+"22", justifyContent:"center", alignItems:"center"}]}><Ionicons name="musical-note" size={16} color={colors.primary} /></View>
              )}
              <View style={{flex:1}}>
                <Text style={s.qTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.qArtist} numberOfLines={1}>{item.artist}</Text>
                <Text style={s.qMeta}>Pedida por {item.by} · {item.dur}</Text>
              </View>
              
              <TouchableOpacity style={s.qVote} onPress={()=>vote(item.id)}>
                <Ionicons name={v?'arrow-up-circle':'arrow-up-circle-outline'} size={26} color={v?colors.primary:colors.textMuted}/>
                <Text style={[s.qVoteN,v&&{color:colors.primary}]}>{item.votes+(v?1:0)}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
      <TouchableOpacity style={s.fab} onPress={()=>router.push(`/session/request-song?sid=${id||'demo'}`)} activeOpacity={0.85}>
        <Ionicons name="add" size={24} color={colors.background}/><Text style={s.fabText}>Pedir canción</Text>
      </TouchableOpacity>
    </View>
  );

  // ── PEOPLE ──
  const People = () => (
    <ScrollView contentContainerStyle={{paddingBottom:spacing['3xl']}}>
      <View style={s.pStats}>
        <View style={s.pStat}><Text style={s.pStatN}>{activeSession.listeners || activePeople.length}</Text><Text style={s.pStatL}>Oyentes</Text></View>
        <View style={s.pStatDiv}/>
        <View style={s.pStat}><Text style={s.pStatN}>{activeSession.queueCount || activeQueue.length}</Text><Text style={s.pStatL}>En cola</Text></View>
        <View style={s.pStatDiv}/>
        <View style={s.pStat}><Text style={s.pStatN}>{msgs.length}</Text><Text style={s.pStatL}>Mensajes</Text></View>
      </View>
      {activePeople.map(p => (
        <View key={p.id} style={s.person}>
          <View style={s.pAvatar}><Text style={s.pAvatarT}>{initials(p.name)}</Text><View style={[s.pOnline,{backgroundColor:p.on?colors.online:colors.offline}]}/></View>
          <View style={{flex:1}}><Text style={s.pName}>{p.name}</Text><Text style={s.pStatus}>{p.on?'En línea':'Desconectado'}</Text></View>
          {p.role && <RoleBadge role={p.role}/>}
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.container}>
      <Header />
      <PresenceBar sessionId={id as string} />
      <FloatingReactionsContainer sessionId={id as string} />
      <View style={{flex:1}}>
        {tab === 'player' && <Player />}
        {tab === 'chat' && <Chat />}
        {tab === 'queue' && <Queue />}
        {tab === 'people' && <People />}
      </View>
      {/* Tab Bar */}
      <View style={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={s.tabItem} onPress={()=>setTab(t.key)} activeOpacity={0.7}>
            <Ionicons name={t.icon as any} size={22} color={tab===t.key?colors.primary:colors.textMuted}/>
            <Text style={[s.tabLabel,tab===t.key&&{color:colors.primary}]}>{t.label}</Text>
            {t.key==='chat' && <View style={s.tabBadge}><Text style={s.tabBadgeT}>{msgs.length}</Text></View>}
          </TouchableOpacity>
        ))}
      </View>
      {/* Golden Boost Animation - se muestra para toda la sala */}
      {showGoldenBoost && currentBoost && (
        <GoldenBoostAnimation
          djName={currentBoost.toDjName}
          giverName={currentBoost.fromUserName}
          onComplete={hideGoldenBoost}
        />
      )}
    </SafeAreaView>
  );
}

// ══════════ STYLES ══════════
