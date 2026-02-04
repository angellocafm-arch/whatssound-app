/**
 * WhatsSound — Componentes
 * Índice de exportaciones para imports más limpios
 */

// UI Components
export { Avatar } from './ui/Avatar';
export { Button } from './ui/Button';
export { Skeleton, SessionCardSkeleton, SongItemSkeleton, ChatMessageSkeleton, ChatListItemSkeleton, ProfileSkeleton, SkeletonList } from './ui/Skeleton';
export { AvatarStack } from './ui/AvatarStack';
export { LiveBadge, LiveCount, LiveTag } from './ui/LiveBadge';

// Session Components
export { PresenceBar } from './session/PresenceBar';
export { FloatingReaction } from './session/FloatingReaction';
export { FloatingReactionsContainer, sendReaction, floatingReactionsRef } from './session/FloatingReactionsContainer';
export { ShareButton, ShareButtonFilled } from './session/ShareButton';
export { SessionPulse, useSessionActivity } from './session/SessionPulse';
export { TipButton } from './session/TipButton';
export { TipNotificationContainer, TipMessage } from './session/TipNotification';
export { SongRequestButton, SongRequestModal } from './session/SongRequest';
export { SongQueue, MiniQueue, type QueuedSong } from './session/SongQueue';

// Profile Components
export { StreakCard, StreakBadge } from './profile/StreakCard';

// Discover Components
export { DJRanking } from './discover/DJRanking';
export { UpcomingSessions } from './discover/UpcomingSessions';

// Other Components
export { AudioPreview } from './AudioPreview';
export { SongCard } from './SongCard';
export { SongSearch } from './SongSearch';
