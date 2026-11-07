import { safeRedirectPath } from '@aisle/validation';
import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const OTP_TYPES: readonly EmailOtpType[] = [
  'email',
  'magiclink',
  'signup',
  'invite',
  'recovery',
  'email_change',
];

/**
 * Completes sign-in for:
 *   - OAuth (Apple, Google) and same-browser magic links:  ?code=...
 *   - Magic links opened on another device:                 ?token_hash=...&type=email
 *     (requires the email template change described in README.md)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeRedirectPath(searchParams.get('next'));
  const supabase = await createClient();

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  return NextResponse.redirect(ok ? `${origin}${next}` : `${origin}/sign-in?error=callback`);
}
