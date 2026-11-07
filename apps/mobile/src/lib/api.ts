import type { AppRouter } from '@aisle/api';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { env } from '@/env';
import { supabase } from './supabase';

/** Typed client for the shared API hosted by the web app. Sends the user's JWT. */
export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.EXPO_PUBLIC_API_URL}/api/trpc`,
      transformer: superjson,
      async headers() {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
