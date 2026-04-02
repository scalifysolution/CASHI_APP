/**
 * Mirrors :root / .dark from your Tailwind + shadcn theme.
 * OKLCH values are approximated to hex — React Native does not resolve CSS variables.
 */

export const lightColors = {
  background: '#FFFFFF',
  foreground: '#252525',
  card: '#FFFFFF',
  cardForeground: '#252525',
  popover: '#FFFFFF',
  popoverForeground: '#252525',
  primary: '#343434',
  primaryForeground: '#FAFAFA',
  secondary: '#F5F5F5',
  secondaryForeground: '#343434',
  muted: '#F5F5F5',
  mutedForeground: '#787878',
  accent: '#F5F5F5',
  accentForeground: '#343434',
  destructive: '#E5484D',
  destructiveForeground: '#FAFAFA',
  border: '#E8E8E8',
  input: '#E8E8E8',
  ring: '#A3A3A3',
  chart1: '#E67E22',
  chart2: '#2D9D8C',
  chart3: '#5C6FA3',
  chart4: '#D4A574',
  chart5: '#C49A6C',
  sidebar: '#FAFAFA',
  sidebarForeground: '#252525',
  sidebarPrimary: '#343434',
  sidebarPrimaryForeground: '#FAFAFA',
  sidebarAccent: '#F5F5F5',
  sidebarAccentForeground: '#343434',
  sidebarBorder: '#E8E8E8',
  sidebarRing: '#A3A3A3',
} as const;

export const darkColors = {
  background: '#252525',
  foreground: '#FAFAFA',
  card: '#252525',
  cardForeground: '#FAFAFA',
  popover: '#252525',
  popoverForeground: '#FAFAFA',
  primary: '#FAFAFA',
  primaryForeground: '#343434',
  secondary: '#444444',
  secondaryForeground: '#FAFAFA',
  muted: '#444444',
  mutedForeground: '#A3A3A3',
  accent: '#444444',
  accentForeground: '#FAFAFA',
  destructive: '#B54A4A',
  destructiveForeground: '#D67373',
  border: '#444444',
  input: '#444444',
  ring: '#6B6B6B',
  chart1: '#6B5FD8',
  chart2: '#4EC4A8',
  chart3: '#C49A6C',
  chart4: '#9B7AE8',
  chart5: '#D67B8A',
  sidebar: '#343434',
  sidebarForeground: '#FAFAFA',
  sidebarPrimary: '#6B5FD8',
  sidebarPrimaryForeground: '#FAFAFA',
  sidebarAccent: '#444444',
  sidebarAccentForeground: '#FAFAFA',
  sidebarBorder: '#444444',
  sidebarRing: '#6B6B6B',
} as const;

export type ThemeColors = typeof lightColors;

/** Slightly darker primary for pressed states (light: darken, dark: darken light gray). */
export const lightColorsPressed = {
  primary: '#2A2A2A',
} as const;

export const darkColorsPressed = {
  primary: '#E5E5E5',
} as const;
