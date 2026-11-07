import { safeRedirectPath } from '@aisle/validation';
import { Heading, Text } from '@aisle/ui/web';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getT } from '@/lib/i18n';
import { getUserId } from '@/lib/supabase/server';
import { SignInForm } from './SignInForm';

export const metadata: Metadata = { title: 'Sign in' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);
  if (await getUserId()) redirect(next);

  const { t } = await getT();

  return (
    <main className="mx-auto grid min-h-dvh max-w-6xl grid-cols-1 gap-12 px-6 py-12 md:grid-cols-[1.15fr_1fr] md:items-center md:gap-20 md:px-12">
      <section aria-labelledby="promise" className="md:self-center">
        <p className="mb-8 font-display text-h4 text-accent">{t('app.name')}</p>
        <p
          id="promise"
          className="max-w-[12ch] font-display text-h2 leading-[1.08] text-balance text-text hyphens-none md:text-h1"
        >
          {t('auth.signIn.promise')}
        </p>
      </section>

      <section
        aria-labelledby="sign-in-title"
        className="w-full max-w-md rounded-sheet border border-border bg-surface p-6 sm:p-10"
      >
        <div className="mb-8 flex flex-col gap-2">
          <Heading level={1} size={3} id="sign-in-title">
            {t('auth.signIn.title')}
          </Heading>
          <Text tone="muted">{t('auth.signIn.subtitle')}</Text>
        </div>
        <SignInForm
          next={next}
          initialError={!!params.error}
          copy={{
            emailLabel: t('auth.signIn.emailLabel'),
            emailPlaceholder: t('auth.signIn.emailPlaceholder'),
            sendLink: t('auth.signIn.sendLink'),
            sending: t('auth.signIn.sending'),
            linkSent: t('auth.signIn.linkSent', { email: '{email}' }),
            or: t('auth.signIn.or'),
            withApple: t('auth.signIn.withApple'),
            withGoogle: t('auth.signIn.withGoogle'),
            callbackError: t('auth.signIn.error'),
          }}
        />
        <Text size="caption" tone="muted" className="mt-8">
          {t('auth.signIn.legal')}
        </Text>
      </section>
    </main>
  );
}
