export const colors = {
  bg: '#052e16',
  surface: '#0f172a',
  card: '#14532d',
  primary: '#22c55e',
  primaryDark: '#15803d',
  accent: '#f59e0b',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  danger: '#ef4444',
  border: 'rgba(148,163,184,0.2)',
} as const;

export type AppColors = typeof colors;
