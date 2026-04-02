/**
 * Cashi brand palette — use across the app (auth, home, marketing, product UI).
 */
export const brand = {
  blue: '#3B9EE8',
  blueDeep: '#1E7DC8',
  blueLight: '#EBF5FD',

  dark: '#1A1A1F',
  darkCard: '#252530',
  surface: '#FFFFFF',
  background: '#F7F8FA',

  heroHeading: '#FFFFFF',
  heroBody: 'rgba(255,255,255,0.65)',
  badgeFg: 'rgba(255,255,255,0.85)',
  badgeBg: 'rgba(255,255,255,0.10)',
  badgeDotColor: '#3B9EE8',

  cardHeading: '#111118',
  cardBody: '#64667A',
  fieldLabelColor: '#3A3B4A',
  placeholder: '#B0B3C6',
  helperColor: '#9295A8',

  inputBorder: '#E2E4EE',
  inputBorderFocus: '#3B9EE8',
  inputBg: '#F7F8FA',
  inputFocusBg: '#FFFFFF',

  dialBg: '#F0F2F9',
  dialText: '#3A3B4A',

  dividerColor: '#E6E8F0',
  dividerTextColor: '#A0A3B5',

  emailBorder: '#DDE0EE',
  emailText: '#3A3B4A',

  termsText: '#A0A3B5',
  termsLinkColor: '#3B9EE8',

  ctaDisabledBg: '#E8EDF5',
  ctaDisabledText: '#B0B3C6',

  statValueColor: '#FFFFFF',
  statLabelColor: 'rgba(255,255,255,0.5)',
  statDividerColor: 'rgba(255,255,255,0.12)',

  handleColor: '#DDE0EE',
} as const;

export type BrandColors = typeof brand;
