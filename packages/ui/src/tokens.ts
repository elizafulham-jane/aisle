/**
 * Design tokens — the single source of truth for web and mobile.
 *
 * Direction ("letterpress and myrtle"): the product should feel like good wedding
 * stationery — bright paper, ink-dark text, hairline rules instead of shadows — with one
 * accent taken from myrtle, the evergreen traditionally carried in British bouquets.
 * Headings use a Caslon display face (the typeface of letterpress invitations); the
 * interface uses a quiet grotesque. Couples' own palettes theme guest-facing pages via
 * the `accent` slot only; the rest of the system stays neutral.
 */

export const palette = {
  paper: '#FBFBF8',
  card: '#FFFFFF',
  vellum: '#E6E4DC',
  vellumStrong: '#CFCCC1',
  graphite: '#5D625E',
  ink: '#1D2422',
  myrtle: '#2E5A4C',
  myrtleDeep: '#234639',
  myrtleWash: '#E8F0EC',
  // Dark mode
  evening: '#141816',
  eveningRaised: '#1C211F',
  eveningLine: '#2E3532',
  mist: '#A3ABA7',
  moon: '#ECEEEA',
  myrtleLight: '#8EC1AB',
  myrtleNight: '#21372F',
  // Functional
  successInk: '#2B6A3F',
  warningInk: '#8A5A00',
  dangerInk: '#A33A2C',
  dangerWash: '#FBECE9',
  warningWash: '#FBF2DE',
  successWash: '#E7F3EA',
} as const;

export interface ColorScheme {
  background: string;
  surface: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  accent: string;
  accentPressed: string;
  accentSubtle: string;
  onAccent: string;
  focus: string;
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  danger: string;
  dangerSubtle: string;
}

export const colors: Record<'light' | 'dark', ColorScheme> = {
  light: {
    background: palette.paper,
    surface: palette.card,
    border: palette.vellum,
    borderStrong: palette.vellumStrong,
    text: palette.ink,
    textMuted: palette.graphite,
    accent: palette.myrtle,
    accentPressed: palette.myrtleDeep,
    accentSubtle: palette.myrtleWash,
    onAccent: '#FFFFFF',
    focus: palette.myrtle,
    success: palette.successInk,
    successSubtle: palette.successWash,
    warning: palette.warningInk,
    warningSubtle: palette.warningWash,
    danger: palette.dangerInk,
    dangerSubtle: palette.dangerWash,
  },
  dark: {
    background: palette.evening,
    surface: palette.eveningRaised,
    border: palette.eveningLine,
    borderStrong: '#46504C',
    text: palette.moon,
    textMuted: palette.mist,
    accent: palette.myrtleLight,
    accentPressed: '#A9D2C0',
    accentSubtle: palette.myrtleNight,
    onAccent: palette.evening,
    focus: palette.myrtleLight,
    success: '#86C99A',
    successSubtle: '#1D3324',
    warning: '#E2B861',
    warningSubtle: '#3A2E14',
    danger: '#F09A8B',
    dangerSubtle: '#3D211C',
  },
};

export const fonts = {
  /** Headings only. Single weight (400); size and spacing carry hierarchy. */
  display: { family: 'Libre Caslon Display', fallback: 'Georgia, "Times New Roman", serif' },
  /** All interface text. */
  sans: { family: 'Hanken Grotesk', fallback: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
} as const;

/** Native font names registered with expo-font (see apps/mobile). */
export const nativeFonts = {
  display: 'LibreCaslonDisplay_400Regular',
  sans: 'HankenGrotesk_400Regular',
  sansMedium: 'HankenGrotesk_500Medium',
  sansSemibold: 'HankenGrotesk_600SemiBold',
} as const;

/**
 * Type scale (px): a perfect-fourth step above body for display sizes, tighter steps for
 * interface sizes. Line heights are unitless multipliers; serif display gets more air.
 */
export const typeScale = {
  caption: { size: 13, lineHeight: 1.4, tracking: 0.1 },
  small: { size: 14, lineHeight: 1.45, tracking: 0 },
  body: { size: 16, lineHeight: 1.55, tracking: 0 },
  lead: { size: 18, lineHeight: 1.55, tracking: 0 },
  h4: { size: 21, lineHeight: 1.3, tracking: 0 },
  h3: { size: 28, lineHeight: 1.2, tracking: -0.2 },
  h2: { size: 37, lineHeight: 1.15, tracking: -0.4 },
  h1: { size: 50, lineHeight: 1.08, tracking: -0.8 },
} as const;

export type TypeStep = keyof typeof typeScale;

/** 4-point spacing scale. */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

/** Radii follow hierarchy: controls are crisp, sheets are softer, pills only for tags. */
export const radius = {
  control: 6,
  sheet: 12,
  pill: 999,
} as const;

export const motion = {
  /** Feedback to a direct action (press, toggle). */
  quick: 120,
  /** Something opening or moving into place. */
  settle: 240,
  /** The rare celebratory moment (venue booked, all RSVPs in). */
  celebrate: 900,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

/** Minimum touch target (WCAG 2.2 target size, platform guidance). */
export const minTouchTarget = 44;

/** Maximum comfortable line length for reading text. */
export const measure = { sans: '68ch', serif: '72ch' } as const;
