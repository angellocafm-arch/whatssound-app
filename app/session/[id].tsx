/**
 * WhatsSound — Pantalla de Sesión
 * Vista completa: header DJ, chat, player mini, pedir canción
 * Conectada a Supabase para mensajes en tiempo real
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { supabase } from '../../src/lib/supabase';
import { useSessionStore } from '../../src/stores/sessionStore';
import { searchTracks, type MusicTrack } from '../../src/lib/deezer';
import { SessionHeader } from '../../src/components/SessionHeader';
import { SessionChat, type ChatMessage } from '../../src/components/SessionChat';
import { SessionNowPlaying } from '../../src/components/SessionNowPlaying';
import { SessionInput } from '../../src/components/SessionInput';

interface PlaylistTrack {
  id: string; title: string; artist: string; album: string;
  albumArt?: string | null; duration?: string;
  status: 'pending' | 'playing' | 'played'; votes: number; userVote?: 'up' | 'down' | null;
}

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { currentSession, fetchSession } = useSessionStore();
  const [nowPlaying, setNowPlaying] = useState<MusicTrack | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch real session data
  useEffect(() => { if (id) fetchSession(id); }, [id]);

  // Build playlist from song messages
  useEffect(() => {
    const tracks: PlaylistTrack[] = messages
      .filter(m => { if (!m.isSystem) return false; try { return JSON.parse(m.text)?.type === 'song'; } catch { return false; } })
      .map(m => {
        const data = JSON.parse(m.text);
        return { id: m.id, title: data.title, artist: data.artist, album: data.album, albumArt: data.albumArt, duration: data.duration, status: 'pending' as const, votes: 0, userVote: null };
      });
    setPlaylistTracks(tracks);
  }, [messages]);

  // Fetch now playing
  useEffect(() => {
    if (!currentSession?.current_song || currentSession.current_song.startsWith('{')) return;
    searchTracks(`${currentSession.current_song} ${currentSession.current_artist || ''}`, 1)
      .then(tracks => { if (tracks.length > 0) setNowPlaying(tracks[0]); });
  }, [currentSession?.current_song, currentSession?.current_artist]);

  // Derive header info
  const isDM = currentSession?.genre === 'Chat';
  const isGroup = currentSession?.genre === 'Group';
  const isChatMode = isDM || isGroup;
  const sessionName = currentSession?.name || 'Sesión';
  const djName = currentSession?.dj_display_name || 'DJ';
  const listenerCount = currentSession?.listener_count ?? 0;
  const displayName = isDM ? sessionName.replace('DM: ', '').replace('Chat ', '') : sessionName;

  // Get current user
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token');
      if (stored) { const parsed = JSON.parse(stored); if (parsed.user?.id) setCurrentUserId(parsed.user.id); }
    } catch {}
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    }).catch(() => {});
  }, []);

  // Fetch messages + realtime subscription
  useEffect(() => {
    if (!id) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      setFetchError(false);
      let myId = '';
      try { const stored = localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token'); if (stored) myId = JSON.parse(stored).user?.id || ''; } catch {}
      if (!myId) {
        try {
          const { data: { session: sess } } = await Promise.race([
            supabase.auth.getSession(),
            new Promise<never>((_, rej) => setTimeout(() => rej('timeout'), 3000)),
          ]);
          myId = sess?.user?.id || '';
        } catch {}
      }

      let data: any[] | null = null;
      let error: any = null;
      try {
        let token = '';
        try { token = JSON.parse(localStorage.getItem('sb-xyehncvvvprrqwnsefcr-auth-token') || '{}').access_token || ''; } catch {}
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTA4OTgsImV4cCI6MjA4NTIyNjg5OH0.VEaTmqpMA7XdUa-tZ7mXib1ciweD7y5UU4dFGZq3EtQ';
        const url = `https://xyehncvvvprrqwnsefcr.supabase.co/rest/v1/messages?session_id=eq.${id}&select=id,content,created_at,user_id,is_system,profiles!messages_user_id_fkey(display_name,username)&order=created_at.asc&limit=100`;
        const res = await fetch(url, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${token || apiKey}` } });
        data = await res.json();
        if (!Array.isArray(data)) { error = data; data = null; }
      } catch (e) { error = e; }

      if (error) {
        setFetchError(true);
      } else if (data && data.length > 0) {
        setMessages(data.map((m: any) => ({
          id: m.id, user: m.profiles?.display_name || m.profiles?.username || 'Anónimo',
          userId: m.user_id || '', text: m.content, isSystem: m.is_system || false,
          isDJ: false, isMine: m.user_id === myId,
          time: new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          fromDB: true,
        })));
      } else {
        setMessages([]);
      }
      setLoadingMessages(false);
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`session-chat-${id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${id}`,
      }, async (payload: any) => {
        const m = payload.new;
        const { data: profile } = await supabase.from('profiles').select('display_name, username').eq('id', m.user_id).single();
        const { data: { session: _s } } = await supabase.auth.getSession();
        const me = _s?.user;
        const newMsg: ChatMessage = {
          id: m.id, user: profile?.display_name || profile?.username || 'Anónimo',
          userId: m.user_id || '', text: m.content, isSystem: m.is_system || false,
          isDJ: false, isMine: m.user_id === me?.id,
          time: new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          fromDB: true,
        };
        setMessages(prev => prev.find(p => p.id === m.id) ? prev : [...prev, newMsg]);
      })
      .subscribe();

    // Polling fallback
    let lastPollTime = new Date().toISOString();
    const pollInterval = setInterval(async () => {
      const { data: newMsgs } = await supabase
        .from('messages')
        .select('id, content, created_at, user_id, is_system, profiles!messages_user_id_fkey(display_name, username)')
        .eq('session_id', id).gt('created_at', lastPollTime).order('created_at', { ascending: true });

      if (newMsgs && newMsgs.length > 0) {
        lastPollTime = newMsgs[newMsgs.length - 1].created_at;
        const { data: { session: _s } } = await supabase.auth.getSession();
        const me = _s?.user;
        const polledMsgs: ChatMessage[] = newMsgs.map((m: any) => ({
          id: m.id, user: m.profiles?.display_name || m.profiles?.username || 'Anónimo',
          userId: m.user_id || '', text: m.content, isSystem: m.is_system || false,
          isDJ: false, isMine: m.user_id === me?.id,
          time: new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          fromDB: true,
        }));
        setMessages(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newOnly = polledMsgs.filter(m => !existingIds.has(m.id));
          if (newOnly.length === 0) return prev;
          const cleaned = prev.filter(p => !p.id.startsWith('local-') || !newOnly.find(n => n.text === p.text));
          return [...cleaned, ...newOnly];
        });
      }
    }, 3000);

    return () => { supabase.removeChannel(channel); clearInterval(pollInterval); };
  }, [id]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const text = message.trim();
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const tempId = `local-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, user: 'Tú', userId: currentUserId || '', text, isSystem: false, isDJ: false, isMine: true, time, fromDB: true }]);
    setMessage('');

    if (id) {
      const { data: { session: _sess } } = await supabase.auth.getSession();
      const user = _sess?.user;
      if (user) {
        const { data, error } = await supabase.from('messages').insert({ session_id: id, user_id: user.id, content: text }).select('id').single();
        if (!error && data) setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m));
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SessionHeader
        sessionName={sessionName} djName={djName} displayName={displayName}
        listenerCount={listenerCount} isDM={isDM} isGroup={isGroup} isChatMode={isChatMode}
        onBack={() => router.back()}
        onQueuePress={() => router.push('/session/queue')}
        onDJPanelPress={() => router.push('/session/dj-panel')}
      />

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <SessionChat
          messages={messages}
          loading={loadingMessages}
          error={fetchError}
          flatListRef={flatListRef}
        />

        {!isChatMode && (
          <SessionNowPlaying
            playlistTracks={playlistTracks}
            showPlaylist={showPlaylist}
            onTogglePlaylist={() => setShowPlaylist(!showPlaylist)}
            onCommentTrack={(title) => { setMessage(`🎵 Sobre "${title}": `); setShowPlaylist(false); }}
          />
        )}

        <SessionInput
          value={message}
          onChangeText={setMessage}
          onSend={sendMessage}
          isChatMode={isChatMode}
          onSearchPress={() => router.push(`/session/request-song?sid=${id}`)}
          onQueuePress={() => router.push('/session/queue')}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  chatContainer: { flex: 1 },
});
