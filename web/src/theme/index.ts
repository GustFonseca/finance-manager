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
  sm: 0,
  md: 0,
  lg: 0,
  pill: 0,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  lg: 15,
  xl: 17,
  xxl: 23,
} as const;

const PIXEL_STACK = '"Pixel Digits", "Pixelify Sans", "Trebuchet MS", Tahoma, sans-serif';

export const fonts = {
  body: PIXEL_STACK,
  title: PIXEL_STACK,
  pixel: PIXEL_STACK,
} as const;

export const pixelFilters = {
  small: 'pixelate',
  large: 'pixelate-lg',
  largeFrom: 28,
} as const;

function svgTile(size: number, cells: [number, number][], fill: string): string {
  const rects = cells.map(([x, y]) => `%3Crect x='${x}' y='${y}' width='2' height='2' fill='${fill}'/%3E`).join('');
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'%3E${rects}%3C/svg%3E")`;
}

function dither(fill: string): string {
  return svgTile(4, [[0, 0], [2, 2]], fill);
}

function flat(color: string): string {
  return `linear-gradient(${color}, ${color})`;
}

function dithered(color: string, fill: string): string {
  return `${dither(fill)}, ${flat(color)}`;
}

export const gradients = {
  titleBar: dithered(palette.teal, 'rgba(0,0,0,0.12)'),
  titleBarInactive: dithered('#7F8D88', 'rgba(0,0,0,0.10)'),
  taskbar: dithered(palette.stone, 'rgba(0,0,0,0.05)'),
  tray: flat('#C2B8A5'),
  startButton: dithered(palette.green, 'rgba(0,0,0,0.12)'),
  startButtonHover: dithered('#3F8070', 'rgba(0,0,0,0.10)'),
  taskButton: flat('#E6DECE'),
  taskButtonActive: dithered('#D3CAB8', 'rgba(255,255,255,0.55)'),
  startMenuHeader: dithered(palette.teal, 'rgba(0,0,0,0.12)'),
  startMenuFooter: dithered(palette.stone, 'rgba(0,0,0,0.06)'),
  button: flat('#E6DECE'),
  buttonPressed: dithered('#D6CDBA', 'rgba(0,0,0,0.06)'),
  progress: `repeating-linear-gradient(to right, ${palette.green} 0px, ${palette.green} 8px, transparent 8px, transparent 10px)`,
  overlay: dither('rgba(28,50,49,0.35)'),
  wallpaper: `${svgTile(8, [[0, 0], [4, 4]], 'rgba(255,255,255,0.05)')}, ${flat(palette.tealScreen)}`,
} as const;

function outline(color: string, step = 2): string {
  return `0 -${step}px 0 0 ${color}, 0 ${step}px 0 0 ${color}, -${step}px 0 0 0 ${color}, ${step}px 0 0 0 ${color}`;
}

function raised(light: string, shade: string): string {
  return `inset -2px -2px 0 0 ${shade}, inset 2px 2px 0 0 ${light}`;
}

function sunk(shade: string, light: string): string {
  return `inset 2px 2px 0 0 ${shade}, inset -2px -2px 0 0 ${light}`;
}

function drop(offset: number, color = 'rgba(28,50,49,0.4)'): string {
  return `${offset}px ${offset}px 0 0 ${color}`;
}

const INK = palette.tealDark;

export const bevels = {
  button: `${outline(INK)}, ${raised(palette.white, palette.stoneDark)}`,
  buttonHover: `${outline(INK)}, ${raised('#CFE3DC', palette.greenLight)}`,
  buttonDefault: `${outline(INK)}, inset -2px -2px 0 0 #5C6B66, inset 2px 2px 0 0 ${palette.white}, inset -4px -4px 0 0 #B8AF9E`,
  buttonPressed: `${outline(INK)}, ${sunk(palette.stoneDark, palette.sandLight)}`,
  buttonDisabled: outline(palette.stoneDark),
  caption: `${outline(INK)}, ${raised(palette.white, palette.stoneDark)}`,
  window: `${outline(INK)}, ${raised(palette.paper, palette.stoneDark)}, ${drop(4)}`,
  menu: `${outline(INK)}, ${drop(4)}`,
  sunken: sunk(palette.stoneDark, palette.white),
  field: `${outline('#4A5E58')}, inset 2px 2px 0 0 ${palette.sand}`,
  fieldFocus: `${outline(palette.teal)}, inset 2px 2px 0 0 ${palette.sand}`,
  card: `${outline(palette.stoneDark)}, ${drop(4, 'rgba(28,50,49,0.12)')}`,
  tile: `${outline(palette.stoneDark)}, inset 0 4px 0 0 ${palette.teal}, ${drop(4, 'rgba(28,50,49,0.12)')}`,
  iconTile: `${outline(INK)}, ${raised(palette.white, palette.stoneDark)}, ${drop(4, 'rgba(28,50,49,0.55)')}`,
  radio: `${outline(INK)}, inset 2px 2px 0 0 ${palette.stone}`,
  radioDot: outline(palette.teal, 1),
  progress: `${outline('#4A5E58')}, inset 2px 2px 0 0 ${palette.sand}`,
  startButton: `${outline(INK)}, ${raised('#8CC2B2', '#2A5F52')}`,
  startButtonPressed: `${outline(INK)}, ${sunk(INK, palette.greenLight)}`,
  taskbar: `0 -2px 0 0 ${INK}, inset 0 2px 0 0 #F3EEE4`,
} as const;

export const glyphs = {
  check: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' shape-rendering='crispEdges'%3E%3Cpath fill='%231C3231' d='M8 2h1v1h-1zM7 3h2v1h-2zM2 4h1v1h-1zM6 4h3v1h-3zM2 5h2v1h-2zM5 5h3v1h-3zM2 6h5v1h-5zM3 7h3v1h-3zM4 8h1v1h-1z'/%3E%3C/svg%3E")`,
} as const;

export function webStyle(style: Record<string, string | number>): ViewStyle & TextStyle {
  return style as ViewStyle & TextStyle;
}

export type PressState = { pressed: boolean; hovered?: boolean; focused?: boolean };
