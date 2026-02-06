/**
 * WhatsSound — Discover Styles
 */
import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.42;

export 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['3xl'] },
  title: {
    ...typography.h1, color: colors.textPrimary,
    paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.base, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: {
    flex: 1, ...typography.body, color: colors.textPrimary, padding: 0,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  seeAll: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },

  horizontalScroll: { paddingHorizontal: spacing.base, gap: spacing.md },

  // Popular session cards
  popularCard: {
    width: CARD_WIDTH, backgroundColor: colors.surface,
    borderRadius: borderRadius.xl, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  popularCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  popularEmoji: { fontSize: 28 },
  popularCover: { 
    width: 40, 
    height: 40, 
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  liveTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EF535020', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  liveTagText: { ...typography.caption, color: '#EF5350', fontWeight: '700', fontSize: 9 },
  popularName: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: 2 },
  popularDj: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  popularFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popularGenreTag: {
    backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  popularGenreText: { ...typography.caption, color: colors.primary, fontWeight: '600', fontSize: 10 },
  popularListeners: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  popularListenersText: { ...typography.caption, color: colors.textMuted },

  // DJ Avatars
  djAvatarContainer: { alignItems: 'center', width: 76, gap: 4 },
  djAvatarRing: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  djAvatarLiveRing: { borderColor: colors.primary },
  djAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  djAvatarInitials: { ...typography.h3, fontWeight: '700' },
  djLiveBadge: {
    position: 'absolute', top: 48, backgroundColor: colors.primary,
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: borderRadius.sm,
    borderWidth: 2, borderColor: colors.background,
  },
  djLiveBadgeText: { fontSize: 8, fontWeight: '800', color: colors.textOnPrimary },
  djAvatarName: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  djAvatarFollowers: { ...typography.caption, color: colors.textMuted, fontSize: 10 },

  // Live dot
  liveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF5350',
  },

  // Genre grid
  genreGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.base, gap: spacing.sm,
  },
  genreCard: {
    width: (SCREEN_WIDTH - spacing.base * 2 - spacing.sm * 3) / 4,
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    alignItems: 'center', paddingVertical: spacing.md, gap: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  genreIconBg: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  genreIcon: { fontSize: 20 },
  genreName: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  genreSessions: { ...typography.caption, color: colors.textMuted, fontSize: 10 },

  // Location tag
  locationTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  locationText: { ...typography.caption, color: colors.primary, fontWeight: '600', fontSize: 11 },

  // Nearby sessions
  nearbyItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: colors.divider,
  },
  nearbyLeft: { width: 24, alignItems: 'center' },
  nearbyDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textMuted,
  },
  nearbyDotLive: { backgroundColor: colors.primary },
  nearbyInfo: { flex: 1, marginLeft: spacing.sm, gap: 3 },
  nearbyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nearbyName: { ...typography.bodyBold, color: colors.textPrimary, flex: 1 },
  nearbyLiveTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EF535015', paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  nearbyLiveText: { fontSize: 9, fontWeight: '700', color: '#EF5350' },
  nearbyDj: { ...typography.caption, color: colors.textSecondary },
  nearbyMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  nearbyMetaText: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  nearbyRight: { alignItems: 'center', gap: 2, marginLeft: spacing.sm },
  nearbyListeners: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },

  // Hall of Fame Banner
  hallOfFameBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    marginHorizontal: spacing.base,
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: '#FFD70040',
  },
  hofContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hofIcon: {
    fontSize: 32,
  },
  hofText: {
    gap: 2,
  },
  hofTitle: {
    ...typography.bodyBold,
    color: '#FFD700',
    fontSize: 16,
  },
  hofSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
});

export default styles;
