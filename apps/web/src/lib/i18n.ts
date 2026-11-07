import 'server-only';

import { createTranslator, resolveLocale, type Locale, type Translate } from '@aisle/i18n';
import { headers } from 'next/headers';

/** Locale for this request from Accept-Language (user preference wins once signed in, later). */
export async function getLocale(): Promise<Locale> {
  const accept = (await headers()).get('accept-language') ?? '';
  const prefs = accept
    .split(',')
    .map((part) => part.split(';')[0]?.trim())
    .filter((tag): tag is string => !!tag);
  return resolveLocale(prefs);
}

export async function getT(): Promise<{ t: Translate; locale: Locale }> {
  const locale = await getLocale();
  return { t: createTranslator(locale), locale };
}
