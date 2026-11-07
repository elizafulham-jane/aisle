import { describe, expect, it } from 'vitest';
import { isProtectedPath } from './proxy';

describe('isProtectedPath', () => {
  it('protects the couple, vendor and admin areas', () => {
    expect(isProtectedPath('/app')).toBe(true);
    expect(isProtectedPath('/app/guests')).toBe(true);
    expect(isProtectedPath('/vendor/abc')).toBe(true);
    expect(isProtectedPath('/admin')).toBe(true);
  });

  it('leaves public pages open', () => {
    expect(isProtectedPath('/sign-in')).toBe(false);
    expect(isProtectedPath('/application-form')).toBe(false);
    expect(isProtectedPath('/rsvp/ABC123')).toBe(false);
  });
});
