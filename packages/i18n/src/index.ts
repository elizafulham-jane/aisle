import { IntlMessageFormat } from 'intl-messageformat';
import { enAU } from './messages/en-AU';
import { enGB, type MessageKey, type Messages } from './messages/en-GB';

export type { MessageKey, Messages };

export const SUPPORTED_LOCALES = ['en-GB', 'en-AU'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en-GB';

const catalogues: Record<Locale, Messages> = {
  'en-GB': enGB,
  'en-AU': { ...enGB, ...enAU },
};

/** Pick the best supported locale from a list of preferences (e.g. Accept-Language). */
export function resolveLocale(preferred: readonly string[] | string | null | undefined): Locale {
  const list = Array.isArray(preferred) ? preferred : preferred ? [preferred] : [];
  for (const tag of list) {
    const exact = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === tag.toLowerCase());
    if (exact) return exact;
    if (tag.toLowerCase().endsWith('-au')) return 'en-AU';
  }
  return DEFAULT_LOCALE;
}

/** Text direction for a locale; ready for right-to-left languages later. */
export function directionOf(locale: string): 'ltr' | 'rtl' {
  return /^(ar|he|fa|ur)(-|$)/i.test(locale) ? 'rtl' : 'ltr';
}

export type Translate = (
  key: MessageKey,
  values?: Record<string, string | number | Date>,
) => string;

/** Create a translate function for a locale. Works on server, web and React Native. */
export function createTranslator(locale: Locale): Translate {
  const messages = catalogues[locale];
  const cache = new Map<MessageKey, IntlMessageFormat>();
  return (key, values) => {
    let fmt = cache.get(key);
    if (!fmt) {
      fmt = new IntlMessageFormat(messages[key], locale);
      cache.set(key, fmt);
    }
    return String(fmt.format(values));
  };
}

/** Format a UTC instant in a wedding/event's own time zone. */
export function formatInZone(
  instant: Date | string,
  timeZone: string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(new Date(instant));
}
