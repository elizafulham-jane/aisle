import { env } from '@/env';

/**
 * The origin (scheme + host) the visitor is using, from the request headers. Falls back to
 * NEXT_PUBLIC_SITE_URL when the host is missing or not a plausible hostname.
 */
export function siteOrigin(h: Pick<Headers, 'get'>): string {
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(',')[0]?.trim() ?? '';
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) return env.NEXT_PUBLIC_SITE_URL;
  const forwardedProto = h.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const proto =
    forwardedProto === 'http' || forwardedProto === 'https'
      ? forwardedProto
      : isLocal
        ? 'http'
        : 'https';
  return `${proto}://${host}`;
}
