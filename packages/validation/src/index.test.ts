import { describe, expect, it } from 'vitest';
import {
  createWeddingSchema,
  isValidTimeZone,
  safeRedirectPath,
  signInWithEmailSchema,
} from './index';

describe('validation', () => {
  it('accepts real IANA zones and rejects made-up ones', () => {
    expect(isValidTimeZone('Europe/London')).toBe(true);
    expect(isValidTimeZone('Australia/Sydney')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus_Mons')).toBe(false);
  });

  it('applies defaults when creating a wedding', () => {
    const parsed = createWeddingSchema.parse({ partnerAName: ' Sam ' });
    expect(parsed).toMatchObject({
      partnerAName: 'Sam',
      currency: 'GBP',
      timezone: 'Europe/London',
    });
  });

  it('validates sign-in email', () => {
    expect(signInWithEmailSchema.safeParse({ email: 'a@b.co' }).success).toBe(true);
    expect(signInWithEmailSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });

  it('blocks open redirects', () => {
    expect(safeRedirectPath('/app/guests')).toBe('/app/guests');
    expect(safeRedirectPath('//evil.example')).toBe('/app');
    expect(safeRedirectPath('https://evil.example')).toBe('/app');
    expect(safeRedirectPath(null)).toBe('/app');
  });
});
