export const COLORS = {
  // Backgrounds
  bg: '#F0EBFF',
  bgDeep: '#E4DBFF',

  // Cards & surfaces
  card: '#FFFFFF',
  cardBorder: '#E4D9FF',
  surface: '#F8F4FF',
  surfaceDark: '#E4DBFF',

  // Primary — rich purple (matches character outfit)
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  primaryBg: '#EDE9FE',

  // Accent — golden star
  accent: '#F59E0B',
  accentLight: '#FDE68A',
  accentDark: '#B45309',

  // Feedback
  error: '#DC2626',
  errorLight: '#FCA5A5',
  success: '#059669',
  successLight: '#6EE7B7',

  // Text
  text: '#1E1B4B',
  textSub: '#4C4693',
  textMuted: '#9D99CC',

  // Misc
  white: '#FFFFFF',
  gold: '#F59E0B',
};

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 999,
};

// Duolingo-style 3D depth — add to buttons/cards (purple theme preserved)
export const DEPTH = {
  button: {
    borderBottomWidth: 4,
    borderBottomColor: '#5B21B6',
  },
  buttonPressed: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  card: {
    borderBottomWidth: 3,
    borderBottomColor: '#C4B5FD',
  },
  cardPressed: {
    borderBottomWidth: 0,
    marginTop: 3,
  },
};

export const SHADOW = {
  card: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  strong: {
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  }),
};
