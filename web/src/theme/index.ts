import type { TextStyle, ViewStyle } from 'react-native';

export const palette = {
  teal: '#315655',
  tealDark: '#1C3231',
  tealDeep: '#22423F',
  tealScreen: '#306666',
  green: '#357263',
  greenLight: '#5E9A8A',
  sand: '#D5CAB6',
  sandLight: '#E9E2D2',
  paper: '#F6F1E7',
  stone: '#CCC3B2',
  stoneDark: '#9F9A8C',
  navy: '#254760',
  amber: '#E0A526',
  coral: '#D9734E',
  sky: '#6FA8C7',
  plum: '#9A6A8E',
  white: '#FFFFFF',
} as const;

export const colors = {
  background: palette.sandLight,
  surface: palette.paper,
  surfaceLight: '#EFE8DA',
  border: palette.stoneDark,
  inputBorder: '#7D8F87',
  textPrimary: '#1E2523',
  textSecondary: '#4A524F',
  textMuted: '#7D847F',
  textOnAccent: '#FFFFFF',
  primary: palette.teal,
  selection: palette.green,
  hover: '#DDE8E3',
  link: '#1F6E5E',
  income: '#2E7D4F',
  expense: '#B03A2E',
  overlay: 'rgba(28,50,49,0.35)',
  windowFrame: palette.tealDeep,
  desktop: palette.tealScreen,
  divider: '#E2DACB',
  heading: palette.teal,
} as const;

export const chart = {
  essential: '#2a78d6',
  variable: '#1baf7a',
  superfluous: '#eb6834',
  grid: '#E6E3D6',
  surface: '#FFFFFF',
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
  sm: 3,
  md: 4,
  lg: 8,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  lg: 14,
  xl: 16,
  xxl: 22,
} as const;

export const fonts = {
  body: 'Tahoma, "Segoe UI", Verdana, sans-serif',
  title: '"Trebuchet MS", Tahoma, sans-serif',
  pixel: '"Pixelify Sans", "Trebuchet MS", Tahoma, sans-serif',
} as const;

export const gradients = {
  titleBar: 'linear-gradient(to bottom, #3E6B69 0%, #315655 45%, #284847 100%)',
  titleBarInactive: 'linear-gradient(to bottom, #8E9C97 0%, #7F8D88 50%, #74817C 100%)',
  taskbar: 'linear-gradient(to bottom, #D9CFBD 0%, #CCC3B2 8%, #C2B8A5 92%, #A99F8C 100%)',
  tray: 'linear-gradient(to bottom, #C2B8A5 0%, #B8AE9A 100%)',
  startButton: 'linear-gradient(to bottom, #3E7A6B 0%, #357263 45%, #2A5F52 100%)',
  startButtonHover: 'linear-gradient(to bottom, #4A8A7A 0%, #3F8070 45%, #326B5D 100%)',
  taskButton: 'linear-gradient(to bottom, #E9E2D2 0%, #DED5C3 100%)',
  taskButtonActive: 'linear-gradient(to bottom, #C9BFAC 0%, #D3CAB8 100%)',
  startMenuHeader: 'linear-gradient(to bottom, #3E6B69 0%, #315655 60%, #284847 100%)',
  startMenuFooter: 'linear-gradient(to bottom, #CCC3B2 0%, #BDB3A0 100%)',
  button: 'linear-gradient(to bottom, #F4EEE2 0%, #E6DECE 86%, #D6CDBA 100%)',
  buttonPressed: 'linear-gradient(to bottom, #CFC6B4 0%, #DED6C5 10%, #E2DACA 100%)',
  progress:
    'repeating-linear-gradient(to right, transparent 0px, transparent 9px, #E9E2D2 9px, #E9E2D2 11px), linear-gradient(to bottom, #4E8B7A 0%, #357263 50%, #2C6355 100%)',
  wallpaper: [
    'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)',
    'radial-gradient(ellipse 80% 60% at 50% 35%, #3A7473 0%, #306666 55%, #264F4F 100%)',
  ].join(', '),
} as const;

export const bevels = {
  button: 'inset -1px -1px #8F887A, inset 1px 1px #FFFFFF, inset -2px -2px #B8AF9E, inset 2px 2px #F3EEE4',
  buttonHover: 'inset -1px -1px #8F887A, inset 1px 1px #FFFFFF, inset -2px -2px #6E9C8F, inset 2px 2px #CFE3DC',
  buttonDefault: 'inset -1px -1px #1C3231, inset 1px 1px #FFFFFF, inset -2px -2px #8F887A, inset 2px 2px #F3EEE4',
  window: '3px 3px 0 rgba(28,50,49,0.35), 0 0 0 1px #1C3231',
  menu: '2px 2px 0 rgba(28,50,49,0.35)',
  sunken: 'inset 1px 1px #9F9A8C, inset -1px -1px #FFFFFF',
  startButton: 'inset -1px -1px #1C3231, inset 1px 1px #8CC2B2, inset -2px -2px #2A5F52',
  startButtonPressed: 'inset 1px 1px #1C3231, inset -1px -1px #8CC2B2, inset 2px 2px #2A5F52',
  taskbar: 'inset 0 1px #F3EEE4, inset 0 2px #E9E2D2',
} as const;

export function webStyle(style: Record<string, string | number>): ViewStyle & TextStyle {
  return style as ViewStyle & TextStyle;
}

export type PressState = { pressed: boolean; hovered?: boolean; focused?: boolean };
