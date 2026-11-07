import 'server-only';

import { createCaller } from '@aisle/api';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

/** Call the typed API from Server Components and Server Actions with the caller's session. */
export async function serverApi() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims.sub;
  const requestId = (await headers()).get('x-request-id') ?? crypto.randomUUID();
  return createCaller({ supabase, userId: typeof sub === 'string' ? sub : null, requestId });
}
