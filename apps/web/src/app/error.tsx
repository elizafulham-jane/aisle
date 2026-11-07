'use client';

import { createTranslator } from '@aisle/i18n';
import { Button, Heading, Text } from '@aisle/ui/web';
import { useEffect } from 'react';

const t = createTranslator('en-GB');

/** Error boundary for every route. Errors are logged (Sentry is wired up in Phase 1). */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6">
      <Heading level={1} size={3}>
        {t('common.error.title')}
      </Heading>
      <Text tone="muted">{t('common.error.body')}</Text>
      <Button onClick={reset} className="self-start">
        {t('common.retry')}
      </Button>
    </main>
  );
}
