import { useColorScheme } from 'react-native';
import { colors, nativeFonts, radius, space, typeScale, type ColorScheme } from '../tokens';

export interface NativeTheme {
  scheme: 'light' | 'dark';
  color: ColorScheme;
  space: typeof space;
  radius: typeof radius;
  fonts: typeof nativeFonts;
  type: typeof typeScale;
}

/** Current theme, following the OS light/dark setting. */
export function useTheme(): NativeTheme {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, color: colors[scheme], space, radius, fonts: nativeFonts, type: typeScale };
}

/** React Native wants absolute line heights. */
export function lineHeightOf(step: keyof typeof typeScale): number {
  const t = typeScale[step];
  return Math.round(t.size * t.lineHeight);
}
