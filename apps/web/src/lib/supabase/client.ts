'use client';

import type { Database } from '@aisle/db';
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/env';

/** Supabase client for Client Components. Auth state lives in cookies shared with the server. */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
