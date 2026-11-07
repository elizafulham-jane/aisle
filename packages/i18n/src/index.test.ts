import { describe, expect, it } from 'vitest';
import { createTranslator, directionOf, formatInZone, resolveLocale } from './index';

describe('i18n', () => {
  it('interpolates ICU values', () => {
    const t = createTranslator('en-GB');
    expect(t('home.welcome', { name: 'Sam' })).toBe('Welcome, Sam');
  });

  it('falls back from en-AU to en-GB', () => {
    expect(createTranslator('en-AU')('auth.signIn.title')).toBe('Sign in');
  });

  it('resolves locales from preferences', () => {
    expect(resolveLocale(['fr-FR', 'en-AU'])).toBe('en-AU');
    expect(resolveLocale('en-US')).toBe('en-GB');
    expect(resolveLocale(null)).toBe('en-GB');
  });

  it('formats an instant in the event time zone, not the server zone', () => {
    // 2027-09-18 05:00 UTC is 15:00 in Sydney (AEST, UTC+10) and 06:00 in London (BST).
    const iso = '2027-09-18T05:00:00Z';
    expect(formatInZone(iso, 'Australia/Sydney', 'en-AU', { hour: 'numeric', hour12: false })).toBe(
      '15',
    );
    expect(formatInZone(iso, 'Europe/London', 'en-GB', { hour: 'numeric', hour12: false })).toBe(
      '06',
    );
  });

  it('knows text direction', () => {
    expect(directionOf('en-GB')).toBe('ltr');
    expect(directionOf('ar-AE')).toBe('rtl');
  });
});
