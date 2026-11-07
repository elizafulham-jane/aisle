import 'server-only';

import type { Database } from '@aisle/db';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/env';

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Create one per request; it carries the caller's session so RLS applies.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, where cookies are read-only. The proxy
            // refreshes sessions, so this is safe to ignore.
          }
        },
      },
    },
  );
}

/** The verified user id for this request, or null. Uses getClaims (signature-checked). */
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims.sub;
  return typeof sub === 'string' ? sub : null;
}
