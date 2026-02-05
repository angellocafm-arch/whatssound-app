/**
 * WhatsSound — Database Types
 * Tipos para las entidades de Supabase
 */

// ============ PROFILES ============
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string | null;
  is_dj: boolean;
  is_verified: boolean;
  dj_name?: string | null;
  genres?: string[];
  role?: string;
  golden_boosts_received?: number;
  created_at?: string;
  updated_at?: string;
}

// ============ SESSIONS ============
export interface Session {
  id: string;
  name: string;
  dj_id: string;
  is_active: boolean;
  join_code?: string;
  genres?: string[];
  listener_count?: number;
  status?: 'active' | 'paused' | 'ended';
  created_at?: string;
  ended_at?: string;
  // Relations
  dj?: Profile;
  songs?: Song[];
  members?: SessionMember[];
}

export interface SessionMember {
  id: string;
  session_id: string;
  user_id: string;
  role: 'dj' | 'listener' | 'vip';
  joined_at: string;
  left_at?: string | null;
  // Relations
  profile?: Profile;
}

// ============ SONGS ============
export interface Song {
  id: string;
  session_id: string;
  title: string;
  artist: string;
  album?: string;
  album_art?: string;
  deezer_id?: string;
  spotify_id?: string;
  requested_by?: string;
  votes: number;
  status: 'pending' | 'approved' | 'rejected' | 'playing' | 'played';
  created_at?: string;
  played_at?: string;
  // Relations
  requester?: Profile;
}

export interface Vote {
  id: string;
  song_id: string;
  user_id: string;
  created_at?: string;
}

// ============ TIPS ============
export interface Tip {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  currency?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  session_id?: string;
  message?: string;
  created_at?: string;
  // Relations
  from_user?: Profile;
  to_user?: Profile;
}

export interface GoldenBoost {
  id: string;
  from_user_id: string;
  to_user_id: string;
  session_id?: string;
  created_at?: string;
  // Relations
  from_user?: Profile;
  to_user?: Profile;
}

// ============ CHATS ============
export interface Conversation {
  id: string;
  name?: string;
  is_group: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  members?: ConversationMember[];
  messages?: Message[];
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  // Relations
  profile?: Profile;
  user?: Profile; // Alias for profile
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type?: 'text' | 'image' | 'song' | 'system';
  metadata?: Record<string, unknown>;
  created_at: string;
  // Relations
  sender?: Profile;
}

// ============ API RESPONSES ============
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

// ============ SUPABASE HELPERS ============
export type Tables = {
  ws_profiles: Profile;
  ws_sessions: Session;
  ws_session_members: SessionMember;
  ws_songs: Song;
  ws_votes: Vote;
  ws_tips: Tip;
  ws_golden_boosts: GoldenBoost;
  ws_conversations: Conversation;
  ws_conversation_members: ConversationMember;
  ws_messages: Message;
};

// ============ COMPONENT PROPS ============
export interface ProfileCardProps {
  profile: Profile;
  onPress?: () => void;
  showFollowButton?: boolean;
}

export interface SessionCardProps {
  session: Session;
  onPress?: () => void;
  showJoinButton?: boolean;
}

export interface SongCardProps {
  song: Song;
  onVote?: () => void;
  onPlay?: () => void;
  isPlaying?: boolean;
  userVoted?: boolean;
}
