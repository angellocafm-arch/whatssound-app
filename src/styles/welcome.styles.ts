/**
 * WhatsSound — Welcome Page Styles
 * Estilos responsive para la landing page
 */

import { StyleSheet, Dimensions, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

const { width, height } = Dimensions.get('window');
const isSmall = width < 380;
const isMedium = width >= 380 && width < 768;
const isLarge = width >= 768;

export const welcomeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Hero Section
  hero: {
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logoBubble: {
    width: isSmall ? 80 : 100,
    height: isSmall ? 80 : 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: isSmall ? 32 : 40,
    fontWeight: '800',
    textAlign: 'center',
  },
  titleWhats: {
    color: colors.textPrimary,
  },
  titleSound: {
    color: colors.primary,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: isSmall ? 16 : 18,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
    fontSize: isSmall ? 20 : 24,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },

  // Section
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontSize: isSmall ? 22 : 26,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Decibel Section
  decibelSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
  },
  decibelExplainer: {
    marginTop: spacing.lg,
  },
  decibelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  decibelCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flex: 1,
    maxWidth: 120,
  },
  decibelCardIcon: {
    marginBottom: spacing.xs,
  },
  decibelCardTitle: {
    ...typography.captionBold,
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 12,
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  featureCard: {
    width: isLarge ? 200 : (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: 4,
    fontSize: 14,
  },
  featureDesc: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },

  // Plans Section
  plansSection: {
    paddingTop: spacing['2xl'],
  },
  plansScroll: {
    paddingHorizontal: spacing.lg,
  },
  plansRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  plansHint: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  // Testimonials
  testimonialCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testimonialQuote: {
    ...typography.body,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  testimonialAuthor: {
    ...typography.captionBold,
    color: colors.primary,
  },

  // Footer CTAs
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    ...typography.button,
    color: '#fff',
    fontSize: 16,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  secondaryBtnText: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 14,
  },
});

// CSS for web animations (inject in web build)
export const webStyles = `
  @keyframes glowMove {
    0% {
      transform: translate(0%, 0%);
      box-shadow: 0 0 10px var(--glow-color), 0 0 20px var(--glow-color);
    }
    25% {
      transform: translate(0%, calc(100% - 8px));
    }
    50% {
      transform: translate(calc(100% - 8px), calc(100% - 8px));
    }
    75% {
      transform: translate(calc(100% - 8px), 0%);
    }
    100% {
      transform: translate(0%, 0%);
      box-shadow: 0 0 10px var(--glow-color), 0 0 20px var(--glow-color);
    }
  }

  .glow-trail::before {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--glow-color, #1DB954);
    border-radius: 50%;
    animation: glowMove 3s linear infinite;
    box-shadow: 
      0 0 10px var(--glow-color),
      0 0 20px var(--glow-color),
      0 0 30px var(--glow-color);
  }

  .glow-trail::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--glow-color, #1DB954);
    border-radius: 50%;
    animation: glowMove 3s linear infinite;
    animation-delay: -0.3s;
    opacity: 0.5;
    filter: blur(2px);
  }
`;

export default welcomeStyles;
