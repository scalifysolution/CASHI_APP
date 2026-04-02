import { useColorScheme } from 'react-native';
import {
  darkColors,
  darkColorsPressed,
  lightColors,
  lightColorsPressed,
  type ThemeColors,
} from './colors';

export * from './colors';
export { brand } from './brand';

/** Semantic radius: --radius 0.625rem → 10px at 16px root */
export const radii = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export { homeColors, homeFont, homeFontWeight } from './homeUi';

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

export function usePrimaryPressedColor(): string {
  const scheme = useColorScheme();
  return scheme === 'dark'
    ? darkColorsPressed.primary
    : lightColorsPressed.primary;
}
