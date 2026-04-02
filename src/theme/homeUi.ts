import { brand } from './brand';

/** Home tab layout tokens (built on brand). */
export const homeColors = {
  bg: brand.background,
  textPrimary: brand.cardHeading,
  textSecondary: brand.cardBody,
  borderLight: brand.inputBorder,
  blue: brand.blue,
  blueSubtle: 'rgba(59, 158, 232, 0.15)',
  pink: '#E879A8',
  purple: '#9B7BDE',
  gold: '#D4A853',
  loyaltyBg: brand.darkCard,
  bgCard: brand.surface,
  bgElevated: '#F0F2F9',
} as const;

export const homeFont = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
} as const;

export const homeFontWeight = {
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;
