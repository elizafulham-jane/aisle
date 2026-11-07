import { z } from 'zod';

/**
 * Public config bundled into the app. Expo inlines EXPO_PUBLIC_* at build time, so each
 * variable must be referenced literally here (no dynamic process.env access).
 */
const schema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.url(),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  EXPO_PUBLIC_API_URL: z.url(),
});

const parsed = schema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});

if (!parsed.success) {
  throw new Error(
    `Missing or invalid app config: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}. ` +
      'Copy apps/mobile/.env.example to .env.local.',
  );
}

export const env = parsed.data;
