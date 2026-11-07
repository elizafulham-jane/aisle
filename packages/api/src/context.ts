import type { AisleClient, Database } from '@aisle/db';
import { createClient } from '@supabase/supabase-js';
import type { Context } from './trpc';

export interface CreateContextOptions {
  supabaseUrl: string;
  supabasePublishableKey: string;
  /**
   * A Supabase client already bound to the caller's cookies (web). When absent, the
   * request's `Authorization: Bearer <jwt>` header is used (mobile).
   */
  cookieClient?: AisleClient;
}

/**
 * Build the per-request context. The JWT is verified by Supabase (getClaims checks the
 * signature); RLS then enforces access on every query.
 */
export async function createContextFromRequest(
  req: Request,
  opts: CreateContextOptions,
): Promise<Context> {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  let supabase = opts.cookieClient;

  if (!supabase) {
    const auth = req.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    supabase = createClient<Database>(opts.supabaseUrl, opts.supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    });
    if (token) {
      const { data } = await supabase.auth.getClaims(token);
      return {
        supabase,
        userId: typeof data?.claims.sub === 'string' ? data.claims.sub : null,
        requestId,
      };
    }
    return { supabase, userId: null, requestId };
  }

  const { data } = await supabase.auth.getClaims();
  return {
    supabase,
    userId: typeof data?.claims.sub === 'string' ? data.claims.sub : null,
    requestId,
  };
}
