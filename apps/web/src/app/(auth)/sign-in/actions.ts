'use server';

import { safeRedirectPath, signInWithEmailSchema } from '@aisle/validation';
import { redirect } from 'next/navigation';
import { env } from '@/env';
import { createClient } from '@/lib/supabase/server';

export type SignInState =
  | { status: 'idle' }
  | { status: 'sent'; email: string }
  | { status: 'error'; field?: 'email'; message: string };

function callbackUrl(next: string): string {
  return `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Send a magic link. Always responds the same way whether or not the account exists. */
export async function sendMagicLink(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInWithEmailSchema.safeParse({
    email: formData.get('email'),
    next: formData.get('next') || undefined,
  });
  if (!parsed.success) {
    return { status: 'error', field: 'email', message: 'Enter a valid email address' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: callbackUrl(safeRedirectPath(parsed.data.next)),
      shouldCreateUser: true,
    },
  });

  if (error && error.status === 429) {
    return { status: 'error', message: 'Too many attempts. Wait a minute and try again.' };
  }
  if (error) {
    console.error(JSON.stringify({ level: 'error', msg: 'magic_link_failed', code: error.code }));
    return { status: 'error', message: 'We couldn’t send the link. Please try again.' };
  }
  return { status: 'sent', email: parsed.data.email };
}

/** Start an OAuth sign-in (Apple or Google) and hand the browser to the provider. */
export async function signInWithProvider(formData: FormData): Promise<void> {
  const provider = formData.get('provider');
  if (provider !== 'apple' && provider !== 'google') {
    redirect('/sign-in?error=provider');
  }
  const next = safeRedirectPath(formData.get('next')?.toString());
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callbackUrl(next) },
  });
  if (error || !data.url) {
    redirect('/sign-in?error=provider');
  }
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/sign-in');
}
