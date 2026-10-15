/**
 * Design tokens. Components and screens consume these instead of hard-coded
 * values so the look & feel can evolve from one place.
 */

export const colors = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceLight: '#2A2A2A',
  border: '#333',
  textPrimary: '#E0E0E0',
  textSecondary: '#888',
  textMuted: '#666',
  textOnAccent: '#FFFFFF',
  primary: '#2196F3',
  income: '#4CAF50',
  expense: '#F44336',
  overlay: 'rgba(0,0,0,0.7)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export const shadow = {
  card: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  floating: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
} as const;
