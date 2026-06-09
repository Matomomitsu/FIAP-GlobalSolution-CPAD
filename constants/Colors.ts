const tintColor = '#6ee7ff';

export const Palette = {
  background: '#030712',
  backgroundAlt: '#07111f',
  panel: '#0a1424',
  panelRaised: '#0f1d31',
  card: '#101d31',
  cardMuted: '#0b1627',
  track: '#1a2a42',
  border: 'rgba(148, 163, 184, 0.22)',
  borderStrong: 'rgba(110, 231, 255, 0.44)',
  text: '#f8fafc',
  textSoft: '#dbeafe',
  muted: '#a8b3c4',
  subtle: '#718096',
  accent: tintColor,
  accentDeep: '#0891b2',
  green: '#53f7b2',
  cyan: '#6ee7ff',
  yellow: '#f6c85f',
  red: '#ff5876',
  purple: '#a78bfa',
  indigo: '#818cf8',
  ink: '#020617',
  copper: '#fb923c',
  surface: '#111827',
  surfaceRaised: '#17233a',
  overlay: 'rgba(3, 7, 18, 0.82)',
};

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  xxl: 38,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export default {
  light: {
    text: Palette.text,
    background: Palette.background,
    tint: tintColor,
    tabIconDefault: '#8a96a8',
    tabIconSelected: tintColor,
  },
  dark: {
    text: Palette.text,
    background: Palette.background,
    tint: tintColor,
    tabIconDefault: '#8a96a8',
    tabIconSelected: tintColor,
  },
};
