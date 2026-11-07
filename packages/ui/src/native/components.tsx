import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text as RNText,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type TextProps as RNTextProps,
  type ViewProps,
} from 'react-native';
import { minTouchTarget } from '../tokens';
import { lineHeightOf, useTheme } from './theme';

export interface HeadingProps extends RNTextProps {
  level: 1 | 2 | 3 | 4;
  children: ReactNode;
}

const headingStep = { 1: 'h2', 2: 'h3', 3: 'h4', 4: 'lead' } as const; // mobile sizes one step down

export function Heading({ level, style, ...rest }: HeadingProps) {
  const t = useTheme();
  const step = headingStep[level];
  return (
    <RNText
      accessibilityRole="header"
      maxFontSizeMultiplier={1.6}
      style={[
        {
          fontFamily: t.fonts.display,
          fontSize: t.type[step].size,
          lineHeight: lineHeightOf(step),
          letterSpacing: t.type[step].tracking,
          color: t.color.text,
        },
        style,
      ]}
      {...rest}
    />
  );
}

export interface TextProps extends RNTextProps {
  size?: 'caption' | 'small' | 'body' | 'lead';
  tone?: 'default' | 'muted' | 'danger' | 'success' | 'accent';
  weight?: 'regular' | 'medium' | 'semibold';
}

export function Text({
  size = 'body',
  tone = 'default',
  weight = 'regular',
  style,
  ...rest
}: TextProps) {
  const t = useTheme();
  const color = {
    default: t.color.text,
    muted: t.color.textMuted,
    danger: t.color.danger,
    success: t.color.success,
    accent: t.color.accent,
  }[tone];
  const fontFamily = {
    regular: t.fonts.sans,
    medium: t.fonts.sansMedium,
    semibold: t.fonts.sansSemibold,
  }[weight];
  return (
    <RNText
      style={[
        { fontFamily, fontSize: t.type[size].size, lineHeight: lineHeightOf(size), color },
        style,
      ]}
      {...rest}
    />
  );
}

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'quiet';
  loading?: boolean;
  leading?: ReactNode;
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  leading,
  style,
  ...rest
}: ButtonProps) {
  const t = useTheme();
  const isDisabled = disabled || loading;
  const fg =
    variant === 'primary' ? t.color.onAccent : variant === 'quiet' ? t.color.accent : t.color.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={4}
      style={(state) => [
        {
          minHeight: minTouchTarget + 4,
          paddingHorizontal: t.space[5],
          borderRadius: t.radius.control,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.space[2],
          opacity: isDisabled ? 0.55 : 1,
          backgroundColor:
            variant === 'primary'
              ? state.pressed
                ? t.color.accentPressed
                : t.color.accent
              : variant === 'secondary'
                ? t.color.surface
                : state.pressed
                  ? t.color.accentSubtle
                  : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: t.color.borderStrong,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={fg} /> : leading}
      <Text weight="medium" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

export interface TextFieldProps extends TextInputProps {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({ label, hint, error, style, ...rest }: TextFieldProps) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space[1] + 2 }}>
      <Text size="small" weight="medium">
        {label}
      </Text>
      {hint ? (
        <Text size="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={t.color.textMuted}
        style={[
          {
            minHeight: minTouchTarget + 4,
            borderWidth: 1,
            borderColor: error ? t.color.danger : t.color.borderStrong,
            borderRadius: t.radius.control,
            paddingHorizontal: t.space[3],
            backgroundColor: t.color.surface,
            color: t.color.text,
            fontFamily: t.fonts.sans,
            fontSize: t.type.body.size,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text
          size="caption"
          tone="danger"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Full-height page background with comfortable gutters. */
export function Screen({ style, ...rest }: ViewProps) {
  const t = useTheme();
  return (
    <View
      style={[
        { flex: 1, backgroundColor: t.color.background, paddingHorizontal: t.space[6] },
        style,
      ]}
      {...rest}
    />
  );
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'danger';
  children: ReactNode;
}) {
  const t = useTheme();
  const map = {
    info: [t.color.accentSubtle, 'accent'],
    success: [t.color.successSubtle, 'success'],
    danger: [t.color.dangerSubtle, 'danger'],
  } as const;
  const [bg, textTone] = map[tone];
  return (
    <View
      accessibilityRole={tone === 'danger' ? 'alert' : 'summary'}
      style={{ backgroundColor: bg, borderRadius: t.radius.control, padding: t.space[3] }}
    >
      <Text size="small" tone={textTone}>
        {children}
      </Text>
    </View>
  );
}
