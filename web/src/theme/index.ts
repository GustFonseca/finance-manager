import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Design tokens. Components and screens consume these instead of hard-coded
 * values so the look & feel can evolve from one place.
 *
 * The palette follows the Windows XP "Luna" (blue) theme.
 */

export const colors = {
  background: '#ECE9D8',
  surface: '#FFFFFF',
  surfaceLight: '#F1EFE2',
  border: '#ACA899',
  inputBorder: '#7F9DB9',
  textPrimary: '#000000',
  textSecondary: '#444444',
  textMuted: '#808080',
  textOnAccent: '#FFFFFF',
  primary: '#316AC5',
  selection: '#316AC5',
  hover: '#E8F0FC',
  link: '#0033CC',
  income: '#1E7E1E',
  expense: '#C62828',
  overlay: 'rgba(0,0,0,0.25)',
  windowFrame: '#0831D9',
  desktop: '#3A6EA5',
} as const;

/**
 * Chart colors. The three spending classes use the first slots of a palette
 * validated for color-blind separation on the white window surface
 * (dataviz validate_palette: all checks pass; the aqua is below 3:1 contrast,
 * so charts always carry visible labels or a table).
 */
export const chart = {
  essential: '#2a78d6',
  variable: '#1baf7a',
  superfluous: '#eb6834',
  /** Hairline gridlines, one step off the surface. */
  grid: '#E6E3D6',
  /** Gaps between touching marks are drawn in the surface color. */
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
  /** Body text: Tahoma was the XP system font. */
  body: 'Tahoma, "Segoe UI", Verdana, sans-serif',
  /** Window titles and the Start button used Trebuchet MS. */
  title: '"Trebuchet MS", Tahoma, sans-serif',
} as const;

/** Luna gradients (values taken from the original theme bitmaps). */
export const gradients = {
  titleBar:
    'linear-gradient(to bottom, #0997FF 0%, #0053EE 8%, #0050EE 40%, #0066FF 88%, #0066FF 93%, #005BFF 95%, #003DD7 96%, #003DD7 100%)',
  titleBarInactive:
    'linear-gradient(to bottom, #7596E8 0%, #7B9CF0 10%, #7A9CF0 90%, #6884D8 100%)',
  taskbar:
    'linear-gradient(to bottom, #1F2F86 0%, #3165C4 3%, #3682E5 6%, #4490E6 10%, #3883E5 12%, #2B71E0 15%, #2663DA 18%, #235BD6 20%, #2258D5 23%, #2157D6 38%, #245DDB 54%, #2562DF 86%, #245FDC 89%, #2158D4 92%, #1D4EC0 95%, #1941A5 98%)',
  tray:
    'linear-gradient(to bottom, #0C59B9 1%, #139EE9 6%, #18B5F2 10%, #139BEB 14%, #1290E8 19%, #0D8DEA 63%, #0D9FF1 81%, #0F9EED 88%, #119BE9 91%, #1392E2 94%, #137ED7 97%, #095BC9 100%)',
  startButton:
    'linear-gradient(to bottom, #3C9A3C 0%, #50B450 10%, #46A846 50%, #3A953A 80%, #2F7F2F 100%)',
  startButtonHover:
    'linear-gradient(to bottom, #4FB44F 0%, #63C863 10%, #58BC58 50%, #4AA84A 80%, #3B8F3B 100%)',
  taskButton: 'linear-gradient(to bottom, #3C81F3 0%, #3A7EF0 50%, #2E6FE0 100%)',
  taskButtonActive: 'linear-gradient(to bottom, #1E52B7 0%, #1F4FAF 50%, #1C49A4 100%)',
  startMenuHeader:
    'linear-gradient(to bottom, #1868CE 0%, #0E60CB 12%, #0E60CB 20%, #1164CF 32%, #1667CF 33%, #1B6CD3 47%, #1E70D9 54%, #2476DC 60%, #297AE0 65%, #3482E3 77%, #3786E5 79%, #428EE9 90%, #4791EB 100%)',
  startMenuFooter:
    'linear-gradient(to bottom, #4282D6 0%, #3B85E0 3%, #418AE3 5%, #418AE3 17%, #3C87E2 21%, #3786E4 26%, #3482E3 29%, #2E7EE1 39%, #2374DF 49%, #2072DB 57%, #196EDB 62%, #176BD8 72%, #1468D5 75%, #1165D2 83%, #0F61CB 88%)',
  button: 'linear-gradient(to bottom, #FFFFFF 0%, #ECEBE6 86%, #D6D0C5 100%)',
  buttonPressed: 'linear-gradient(to bottom, #CDCAC3 0%, #E3E3DB 8%, #E5E5DE 94%, #F2F2F1 100%)',
  progress:
    'repeating-linear-gradient(to right, transparent 0px, transparent 8px, #FFFFFF 8px, #FFFFFF 10px), linear-gradient(to bottom, #ACEDAD 0%, #7BE47D 14%, #4CDA50 28%, #2ED330 42%, #42D845 57%, #76E275 71%, #8FE791 85%, #FFFFFF 100%)',
  /** CSS approximation of "Bliss", shown until the wallpaper photo loads. */
  wallpaper: [
    'radial-gradient(ellipse 18% 6% at 22% 22%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)',
    'radial-gradient(ellipse 14% 4% at 30% 26%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)',
    'radial-gradient(ellipse 22% 7% at 72% 16%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)',
    'radial-gradient(ellipse 12% 4% at 60% 32%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)',
    'radial-gradient(ellipse 95% 48% at 30% 100%, #7CC242 0%, #5AA82C 45%, #3F8D1E 85%, rgba(63,141,30,0) 86%)',
    'radial-gradient(ellipse 85% 40% at 90% 100%, #6DB838 0%, #4E9C24 60%, #3B7F19 85%, rgba(59,127,25,0) 86%)',
    'linear-gradient(to bottom, #2C6BD4 0%, #4A8BE0 30%, #8FBDEE 55%, #C5DDF5 70%, #9CC877 71%)',
  ].join(', '),
} as const;

/** Bevels and window shadows. */
export const bevels = {
  button: '0 0 0 0 transparent',
  buttonHover:
    'inset -1px 1px #FFF0CF, inset 1px 2px #FDD889, inset -2px 2px #FBC761, inset 2px -2px #E5A01A',
  buttonDefault:
    'inset -1px 1px #CEE7FF, inset 1px 2px #98B8EA, inset -2px 2px #BCD4F6, inset 1px -1px #89ADE4, inset 2px -2px #89ADE4',
  window: '2px 2px 8px rgba(0,0,0,0.45)',
  menu: '2px 2px 4px rgba(0,0,0,0.4)',
  sunken: 'inset 1px 1px #ACA899, inset -1px -1px #FFFFFF',
} as const;

/**
 * react-native-web forwards CSS such as `backgroundImage` and string
 * `boxShadow` straight to the DOM, but React Native's types don't know them.
 * This keeps the cast in one place.
 */
export function webStyle(style: Record<string, string | number>): ViewStyle & TextStyle {
  return style as ViewStyle & TextStyle;
}

/**
 * `Pressable` on web also reports `hovered` (react-native-web), which React
 * Native's types omit.
 */
export type PressState = { pressed: boolean; hovered?: boolean; focused?: boolean };
