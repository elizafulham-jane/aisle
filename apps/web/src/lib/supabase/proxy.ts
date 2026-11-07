import type { Database } from '@aisle/db';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/env';

/** Paths that require a signed-in user. Everything else is public (sites, RSVP, marketing). */
export const PROTECTED_PREFIXES = ['/app', '/vendor', '/admin'] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refresh the auth session on every matched request and redirect signed-out users away
 * from protected areas. The refreshed cookies (and no-cache headers) must travel on the
 * response we return.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Do not run other code between creating the client and this call.
  const { data } = await supabase.auth.getClaims();
  const signedIn = typeof data?.claims.sub === 'string';

  if (!signedIn && isProtectedPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    ['cache-control', 'expires', 'pragma'].forEach((h) => {
      const v = response.headers.get(h);
      if (v) redirect.headers.set(h, v);
    });
    return redirect;
  }

  return response;
}
