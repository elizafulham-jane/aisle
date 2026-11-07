import { formatInZone } from '@aisle/i18n';
import { Button, Heading, Rule, Text } from '@aisle/ui/web';
import type { Metadata } from 'next';
import { signOut } from '@/app/(auth)/sign-in/actions';
import { serverApi } from '@/lib/api';
import { getT } from '@/lib/i18n';
import { CreateWeddingForm } from './CreateWeddingForm';

export const metadata: Metadata = { title: 'Home' };

export default async function CoupleHome() {
  const { t, locale } = await getT();
  const api = await serverApi();
  const [me, weddings] = await Promise.all([api.me(), api.wedding.list()]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col px-6 py-10 md:px-12">
      <header className="flex items-center justify-between gap-4">
        <p className="font-display text-h4 text-accent">{t('app.name')}</p>
        <form action={signOut}>
          <Button type="submit" variant="quiet">
            {t('auth.signOut')}
          </Button>
        </form>
      </header>

      <main className="mt-16 flex flex-col gap-12">
        <Heading level={1}>{t('home.welcome', { name: me.display_name ?? '' })}</Heading>

        {weddings.length > 0 ? (
          <section aria-labelledby="weddings-title" className="flex flex-col gap-4">
            <Heading level={2} size={4} id="weddings-title">
              {t('home.weddings.title')}
            </Heading>
            <ul className="flex flex-col">
              {weddings.map((w) => (
                <li
                  key={w.id}
                  className="flex items-baseline justify-between gap-4 border-t border-border py-5 last:border-b"
                >
                  <span className="font-display text-h4">
                    {[w.partner_a_name, w.partner_b_name].filter(Boolean).join(' & ')}
                  </span>
                  <span className="text-small text-text-muted">
                    {w.date_start
                      ? formatInZone(`${w.date_start}T12:00:00Z`, 'UTC', locale, {
                          dateStyle: 'long',
                        })
                      : t('home.weddings.dateUnset')}
                    {' — '}
                    {t(
                      `home.weddings.role.${w.role as 'owner' | 'editor' | 'contributor' | 'viewer'}`,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section aria-labelledby="start-title" className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Heading level={2} size={3} id="start-title">
                {t('home.noWedding.title')}
              </Heading>
              <Text tone="muted">{t('home.noWedding.body')}</Text>
            </div>
            <Rule />
            <CreateWeddingForm
              defaultCurrency={locale === 'en-AU' ? 'AUD' : 'GBP'}
              copy={{
                partnerA: t('wedding.create.partnerA'),
                partnerB: t('wedding.create.partnerB'),
                partnerBHint: t('wedding.create.partnerBHint'),
                currency: t('wedding.create.currency'),
                submit: t('wedding.create.submit'),
                created: t('wedding.create.created'),
              }}
            />
          </section>
        )}
      </main>
    </div>
  );
}
