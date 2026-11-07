import { appRouter, createContextFromRequest } from '@aisle/api';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { env } from '@/env';
import { createClient } from '@/lib/supabase/server';

/**
 * Typed API used by the mobile app (Bearer token) and by web client components (cookies).
 * Business logic lives in @aisle/api; RLS still applies to every query.
 */
async function handler(req: Request) {
  const usesBearer = req.headers.get('authorization')?.startsWith('Bearer ') ?? false;
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () =>
      createContextFromRequest(req, {
        supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
        supabasePublishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        ...(usesBearer ? {} : { cookieClient: await createClient() }),
      }),
    onError({ error, path }) {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error(
          JSON.stringify({ level: 'error', msg: 'trpc_error', path, cause: String(error.cause) }),
        );
      }
    },
  });
}

export { handler as GET, handler as POST };
