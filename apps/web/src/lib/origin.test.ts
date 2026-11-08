import { describe, expect, it } from 'vitest';
import { siteOrigin } from './origin';

const h = (values: Record<string, string>) => new Headers(values);

describe('siteOrigin', () => {
  it('uses the address the visitor is on', () => {
    expect(siteOrigin(h({ host: 'aisle-murex.vercel.app', 'x-forwarded-proto': 'https' }))).toBe(
      'https://aisle-murex.vercel.app',
    );
  });

  it('prefers the forwarded host from the proxy', () => {
    expect(siteOrigin(h({ host: 'internal', 'x-forwarded-host': 'aisle-murex.vercel.app' }))).toBe(
      'https://aisle-murex.vercel.app',
    );
  });

  it('uses http for localhost', () => {
    expect(siteOrigin(h({ host: 'localhost:3000' }))).toBe('http://localhost:3000');
  });

  it('falls back to the configured site URL for junk hosts', () => {
    expect(siteOrigin(h({ host: 'evil.example/path?x' }))).toBe('http://localhost:3000');
  });
});
