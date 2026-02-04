/**
 * WhatsSound — Hooks
 * Índice de exportaciones para imports más limpios
 */

export { useDebounce } from './useDebounce';
export { useDeepLinking, createShareUrl, createNativeUrl } from './useDeepLinking';
export { usePresence, type PresenceUser } from './usePresence';
export { useRealtimeChat } from './useRealtimeChat';
export { useRealtimeVotes } from './useRealtimeVotes';
export { useSessions, useProfiles, useSessionStats, type SessionData, type ProfileData } from './useSupabaseQuery';
export { useBackgroundAudio, type Song as BackgroundAudioSong } from './useBackgroundAudio';
export { usePayments } from './usePayments';
export { usePushNotifications, useNotificationBadge } from './usePushNotifications';
export { useListeningStreak, getStreakEmoji, getStreakLabel } from './useListeningStreak';
