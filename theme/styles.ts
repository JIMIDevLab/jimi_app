import { Platform, ViewStyle } from 'react-native';

// Brand palette extended around the original JIMI orange (#f8711e).
// Brand hex values stay identical so the visual identity is preserved.
export const colors = {
  // Brand
  accent: '#f8711e',
  accentLight: '#f88f4e',
  accentSoft: '#FDE7D6',
  accentDeep: '#D65A0A',

  // Neutrals (warmer than the original flat #e3e2e2 — gives a cleaner backdrop)
  background: '#F6F4F2',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EDEA',
  border: '#E7E2DE',
  text: '#1A1A1A',
  textMuted: '#6B6B6B',
  hint: '#9B9591',

  // Chat-specific
  bubbleUser: '#f8711e',
  bubbleUserText: '#FFFFFF',
  bubbleBot: '#FFFFFF',
  bubbleBotText: '#1A1A1A',

  // Status
  online: '#22C55E',
  offline: '#EF4444',
  offlineSoft: '#FEE2E2',
  checking: '#F59E0B',

  // Legacy aliases — kept so any older import keeps compiling.
  pale: '#FFFFFF',
  middle: '#F6F4F2',
  primaryLogin: '#FF0000',
  cardBackground: '#f8711e',
  chatSurface: '#F1EDEA',
  receivedBubble: '#FFFFFF',
  inputBackground: '#F1EDEA',
};

// Two type families: keep Georgia for the brand (logo wordmark, headings),
// switch to a system sans-serif for chat content — much more readable in
// dense conversation UIs and aligns with modern messaging apps.
const brandFamily = Platform.select({
  web: 'Georgia, "Times New Roman", serif',
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
}) as string;

const bodyFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  default: 'System',
}) as string;

export const typography = {
  brandFamily,
  bodyFamily,
  // Backwards-compatible alias used by older code paths.
  fontFamily: bodyFamily,
  // Sizes
  display: 28,
  headline: 22,
  title: 18,
  body: 16,
  caption: 13,
  micro: 11,
  // Legacy aliases
  headlineLarge: 35,
  titleLarge: 35,
  titleMedium: 20,
  titleSmall: 18,
  bodyMedium: 16,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const shadow: Record<'sm' | 'md' | 'lg', ViewStyle> = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
};

export const layout = {
  toolbarHeight: 60,
  iconPadding: 10,
  maxContentWidth: 720,
};
