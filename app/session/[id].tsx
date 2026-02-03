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
import AudioPreview from '../../src/components/AudioPreview';

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
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [floats, setFloats] = useState<{id:string;emoji:string;anim:Animated.Value;x:number}[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [dbQueue, setDbQueue] = useState<any[]>([]);
  const [dbChat, setDbChat] = useState<ChatMsg[]>([]);
  const [dbPeople, setDbPeople] = useState<any[]>([]);
  const listRef = useRef<FlatList>(null);
  const pulse = useRef(new Animated.Value(1)).current;

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
          setDbChat(chatMsgs.map((m: any) => ({
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
          setDbPeople(members.map((m: any) => ({
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
  const activeQueue = dbQueue.length > 0 ? dbQueue.map((s: any) => ({
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
  const activeNow = dbQueue.find((s: any) => s.status === 'playing');
  const nowPlaying = activeNow ? {
    title: activeNow.title, 
    artist: activeNow.artist, 
    album: activeNow.album_name || '',
    art: activeNow.cover_url || '', 
    preview: activeNow.preview_url || '',
    duration: Math.round(activeNow.duration_ms / 1000), 
    currentTime: 0,
  } : NOW;

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
    const rid = `r${Date.now()}${Math.random()}`;
    const a = new Animated.Value(0);
    const x = Math.random()*(SCREEN_WIDTH-60)+20;
    setFloats(p => [...p, { id:rid, emoji, anim:a, x }]);
    Animated.timing(a, { toValue:1, duration:1500, useNativeDriver:true }).start(() =>
      setFloats(p => p.filter(r => r.id !== rid))
    );
  }, []);

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
          <AudioPreview 
            previewUrl={nowPlaying.preview}
            trackTitle={nowPlaying.title}
            artistName={nowPlaying.artist}
            size="large"
            showTitle={false}
          />
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
        <TouchableOpacity style={s.playBtn} onPress={()=>setPlaying(!playing)}>
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
            <View style={s.qItem}>
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
              
              {item.preview && (
                <AudioPreview 
                  previewUrl={item.preview}
                  size="small"
                  showTitle={false}
                />
              )}
              
              <TouchableOpacity style={s.qVote} onPress={()=>vote(item.id)}>
                <Ionicons name={v?'arrow-up-circle':'arrow-up-circle-outline'} size={26} color={v?colors.primary:colors.textMuted}/>
                <Text style={[s.qVoteN,v&&{color:colors.primary}]}>{item.votes+(v?1:0)}</Text>
              </TouchableOpacity>
            </View>
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
    </SafeAreaView>
  );
}

// ══════════ STYLES ══════════

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:colors.background },

  // Header
  header: { flexDirection:'row', alignItems:'center', paddingHorizontal:spacing.md, paddingVertical:spacing.sm, backgroundColor:colors.surface, gap:spacing.sm, borderBottomWidth:.5, borderBottomColor:colors.border },
  djAvatar: { width:40, height:40, borderRadius:20, backgroundColor:colors.primary+'22', justifyContent:'center', alignItems:'center' },
  djInit: { ...typography.captionBold, color:colors.primary, fontSize:14 },
  liveDot: { position:'absolute', bottom:0, right:0, width:12, height:12, borderRadius:6, backgroundColor:colors.primary, borderWidth:2, borderColor:colors.surface },
  hTitle: { ...typography.bodyBold, color:colors.textPrimary, fontSize:15 },
  hSub: { ...typography.caption, color:colors.textSecondary },
  liveBadge: { flexDirection:'row', alignItems:'center', backgroundColor:'#EF535020', paddingHorizontal:spacing.sm, paddingVertical:spacing.xs, borderRadius:borderRadius.full, gap:4 },
  liveRedDot: { width:6, height:6, borderRadius:3, backgroundColor:colors.error },
  liveText: { ...typography.captionBold, color:colors.error, fontSize:10 },

  // Tab Bar
  tabBar: { flexDirection:'row', backgroundColor:colors.surface, borderTopWidth:.5, borderTopColor:colors.border, paddingBottom:Platform.OS==='ios'?spacing.lg:spacing.sm, paddingTop:spacing.sm },
  tabItem: { flex:1, alignItems:'center', gap:2, position:'relative' },
  tabLabel: { ...typography.tab, color:colors.textMuted },
  tabBadge: { position:'absolute', top:-4, right:'20%', backgroundColor:colors.primary, borderRadius:8, minWidth:16, height:16, justifyContent:'center', alignItems:'center', paddingHorizontal:3 },
  tabBadgeT: { color:colors.background, fontSize:9, fontWeight:'700' },

  // Role badge
  roleBadge: { paddingHorizontal:6, paddingVertical:2, borderRadius:borderRadius.full },
  roleBadgeText: { fontSize:10, fontWeight:'700' },

  // Player
  artWrap: { width:200, height:200, borderRadius:borderRadius.xl, overflow:'hidden', marginBottom:spacing.md, shadowColor:colors.primary, shadowOffset:{width:0,height:8}, shadowOpacity:0.4, shadowRadius:24, elevation:16 },
  artImg: { width:'100%', height:'100%' },
  artGlow: { position:'absolute', bottom:0, left:0, right:0, height:60, backgroundColor:colors.background, opacity:0.3 },
  pTitle: { ...typography.h1, color:colors.textPrimary, textAlign:'center' },
  pArtist: { ...typography.h3, color:colors.primary, textAlign:'center', marginTop:4 },
  pAlbum: { ...typography.bodySmall, color:colors.textMuted, textAlign:'center', marginTop:2 },
  progWrap: { width:'85%', marginTop:spacing.xl },
  progTrack: { height:4, backgroundColor:colors.progressTrack, borderRadius:2, overflow:'visible' },
  progFill: { height:'100%', backgroundColor:colors.progressBar, borderRadius:2 },
  progThumb: { position:'absolute', top:-5, width:14, height:14, borderRadius:7, backgroundColor:colors.primary, marginLeft:-7 },
  progTimes: { flexDirection:'row', justifyContent:'space-between', marginTop:6 },
  progTime: { ...typography.caption, color:colors.textMuted, fontSize:12 },
  ctrlRow: { flexDirection:'row', alignItems:'center', gap:spacing['2xl'], marginTop:spacing.xl },
  playBtn: { width:64, height:64, borderRadius:32, backgroundColor:colors.primary, justifyContent:'center', alignItems:'center' },
  reactLabel: { ...typography.captionBold, color:colors.textMuted, marginTop:spacing['2xl'], letterSpacing:1 },
  reactRow: { flexDirection:'row', gap:spacing.md, marginTop:spacing.sm },
  reactBtn: { width:52, height:52, borderRadius:26, backgroundColor:colors.surface, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:colors.border },
  upNext: { width:'90%', marginTop:spacing['2xl'], backgroundColor:colors.surface, borderRadius:borderRadius.lg, padding:spacing.md },
  upNextLabel: { ...typography.captionBold, color:colors.textMuted, letterSpacing:.5, marginBottom:spacing.sm },
  upNextItem: { flexDirection:'row', alignItems:'center', gap:spacing.sm, paddingVertical:spacing.sm, borderBottomWidth:.5, borderBottomColor:colors.divider },
  upNextNum: { ...typography.caption, color:colors.textMuted, width:20, textAlign:'center' },
  upNextArt: { width:36, height:36, borderRadius:borderRadius.sm },
  upNextTitle: { ...typography.bodySmall, color:colors.textPrimary, fontWeight:'600' },
  upNextArtist: { ...typography.caption, color:colors.textSecondary },

  // Chat
  bRow: { flexDirection:'row', marginVertical:2 },
  bRowMine: { justifyContent:'flex-end' },
  bRowOther: { justifyContent:'flex-start' },
  bub: { borderRadius:12, paddingHorizontal:spacing.md, paddingVertical:spacing.sm, maxWidth:'80%' },
  bubMine: { backgroundColor:colors.bubbleOwn, borderTopRightRadius:4, borderRightWidth:3, borderRightColor:colors.primary },
  bubOther: { backgroundColor:colors.bubbleOther, borderTopLeftRadius:4, borderLeftWidth:3, borderLeftColor:colors.accent },
  bubHead: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:2 },
  bubUser: { ...typography.captionBold, fontSize:12 },
  bubText: { ...typography.body, color:'#e9edef', fontSize:15 },
  bubTime: { ...typography.caption, color:'rgba(255,255,255,0.5)', fontSize:10, alignSelf:'flex-end', marginTop:2 },
  chatBar: { flexDirection:'row', alignItems:'center', paddingHorizontal:spacing.sm, paddingVertical:spacing.sm, backgroundColor:colors.background, gap:spacing.xs, borderTopWidth:.5, borderTopColor:colors.border },
  chatInput: { flex:1, ...typography.body, color:colors.textPrimary, backgroundColor:colors.surface, borderRadius:borderRadius.xl, paddingHorizontal:spacing.base, paddingVertical:spacing.sm, fontSize:15, maxHeight:100 },
  chatSend: { width:40, height:40, borderRadius:20, backgroundColor:colors.primary, justifyContent:'center', alignItems:'center' },

  // Queue
  qNowRow: { flexDirection:'row', alignItems:'center', gap:spacing.xs, paddingHorizontal:spacing.base, paddingVertical:spacing.sm },
  qNowDot: { width:8, height:8, borderRadius:4, backgroundColor:colors.primary },
  qNowText: { ...typography.captionBold, color:colors.primary, letterSpacing:.5 },
  qCurrent: { flexDirection:'row', alignItems:'center', paddingHorizontal:spacing.base, paddingVertical:spacing.md, gap:spacing.md, backgroundColor:colors.primary+'10' },
  qCurArt: { width:48, height:48, borderRadius:borderRadius.md },
  qCurTitle: { ...typography.bodyBold, color:colors.primary, fontSize:15 },
  qCurArtist: { ...typography.bodySmall, color:colors.textSecondary },
  qBars: { flexDirection:'row', alignItems:'flex-end', gap:2, height:24 },
  qBar: { width:3, backgroundColor:colors.primary, borderRadius:1.5 },
  qDivRow: { flexDirection:'row', alignItems:'center', gap:spacing.xs, paddingHorizontal:spacing.base, paddingVertical:spacing.sm },
  qDivText: { ...typography.captionBold, color:colors.textMuted, letterSpacing:.5 },
  qItem: { flexDirection:'row', alignItems:'center', paddingHorizontal:spacing.base, paddingVertical:spacing.md, gap:spacing.md, borderBottomWidth:.5, borderBottomColor:colors.divider },
  qNum: { ...typography.caption, color:colors.textMuted, width:32, textAlign:'center', fontSize:14 },
  qArt: { width:44, height:44, borderRadius:borderRadius.md },
  qTitle: { ...typography.bodyBold, color:colors.textPrimary, fontSize:15 },
  qArtist: { ...typography.bodySmall, color:colors.textSecondary },
  qMeta: { ...typography.caption, color:colors.textMuted },
  qVote: { alignItems:'center', minWidth:40 },
  qVoteN: { ...typography.captionBold, color:colors.textMuted, marginTop:2 },
  fab: { position:'absolute', bottom:spacing.base, right:spacing.base, flexDirection:'row', alignItems:'center', gap:spacing.sm, backgroundColor:colors.primary, paddingHorizontal:spacing.lg, paddingVertical:spacing.md, borderRadius:borderRadius.full, shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8, elevation:8 },
  fabText: { ...typography.buttonSmall, color:colors.background },

  // People
  pStats: { flexDirection:'row', justifyContent:'space-around', paddingVertical:spacing.xl, paddingHorizontal:spacing.base, backgroundColor:colors.surface, marginBottom:spacing.sm },
  pStat: { alignItems:'center' },
  pStatN: { ...typography.h2, color:colors.primary },
  pStatL: { ...typography.caption, color:colors.textMuted, marginTop:2 },
  pStatDiv: { width:1, backgroundColor:colors.border },
  person: { flexDirection:'row', alignItems:'center', paddingHorizontal:spacing.base, paddingVertical:spacing.md, gap:spacing.md, borderBottomWidth:.5, borderBottomColor:colors.divider },
  pAvatar: { width:44, height:44, borderRadius:22, backgroundColor:colors.surfaceLight, justifyContent:'center', alignItems:'center' },
  pAvatarT: { ...typography.captionBold, color:colors.primary, fontSize:14 },
  pOnline: { position:'absolute', bottom:0, right:0, width:12, height:12, borderRadius:6, borderWidth:2, borderColor:colors.background },
  pName: { ...typography.bodyBold, color:colors.textPrimary, fontSize:15 },
  pStatus: { ...typography.caption, color:colors.textMuted },
});