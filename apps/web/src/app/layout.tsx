import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/libre-caslon-display/400.css';
import './globals.css';

import { directionOf } from '@aisle/i18n';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { getT } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: { default: t('app.name'), template: `%s · ${t('app.name')}` },
    description: t('app.tagline'),
    // App pages are private; public wedding sites opt in to indexing individually (Phase 1).
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBFBF8' },
    { media: '(prefers-color-scheme: dark)', color: '#141816' },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { locale } = await getT();
  return (
    <html lang={locale} dir={directionOf(locale)}>
      <body>{children}</body>
    </html>
  );
}
