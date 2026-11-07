import { createTranslator, resolveLocale } from '@aisle/i18n';

/** Device locale → supported locale. Intl is available in Hermes. */
const deviceLocale = Intl.DateTimeFormat().resolvedOptions().locale;

export const locale = resolveLocale(deviceLocale);
export const t = createTranslator(locale);
