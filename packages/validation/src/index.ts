import { z } from 'zod';

/** Currencies supported at launch (Australia and the UK). Others can be enabled by setting. */
export const LAUNCH_CURRENCIES = ['GBP', 'AUD'] as const;
export const LAUNCH_LOCALES = ['en-GB', 'en-AU'] as const;

export const currencyCode = z.string().regex(/^[A-Z]{3}$/, 'Use a 3-letter currency code');

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const ianaTimeZone = z.string().refine(isValidTimeZone, 'Unknown time zone');

export const email = z.email('Enter a valid email address').max(254);

export const signInWithEmailSchema = z.object({
  email,
  /** Where to send the user after the magic link is opened (path only, never a full URL). */
  next: z
    .string()
    .regex(/^\/(?!\/)[\w\-/?=&%.]*$/, 'Invalid redirect path')
    .optional(),
});
export type SignInWithEmailInput = z.infer<typeof signInWithEmailSchema>;

export const createWeddingSchema = z.object({
  partnerAName: z.string().trim().min(1, 'Required').max(100),
  partnerBName: z.string().trim().min(1).max(100).optional(),
  currency: currencyCode.default('GBP'),
  timezone: ianaTimeZone.default('Europe/London'),
  locale: z.enum(LAUNCH_LOCALES).default('en-GB'),
});
export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;

/**
 * Only same-site relative paths are allowed as post-auth redirects (prevents open redirects).
 */
export function safeRedirectPath(path: string | null | undefined, fallback = '/app'): string {
  if (!path) return fallback;
  return signInWithEmailSchema.shape.next.safeParse(path).success ? path : fallback;
}
