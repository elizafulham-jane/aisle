'use client';

import { Button, Notice, TextField } from '@aisle/ui/web';
import { useActionState } from 'react';
import { sendMagicLink, signInWithProvider, type SignInState } from './actions';

export interface SignInCopy {
  emailLabel: string;
  emailPlaceholder: string;
  sendLink: string;
  sending: string;
  linkSent: string;
  or: string;
  withApple: string;
  withGoogle: string;
  callbackError: string;
}

export function SignInForm({
  next,
  copy,
  initialError,
}: {
  next: string;
  copy: SignInCopy;
  initialError: boolean;
}) {
  const [state, action, pending] = useActionState<SignInState, FormData>(sendMagicLink, {
    status: 'idle',
  });

  return (
    <div className="flex flex-col gap-6">
      {initialError && state.status === 'idle' ? (
        <Notice tone="danger">{copy.callbackError}</Notice>
      ) : null}

      {state.status === 'sent' ? (
        <Notice tone="success">{copy.linkSent.replace('{email}', state.email)}</Notice>
      ) : (
        <form action={action} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="next" value={next} />
          <TextField
            label={copy.emailLabel}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder={copy.emailPlaceholder}
            {...(state.status === 'error' && state.field === 'email'
              ? { error: state.message }
              : {})}
          />
          {state.status === 'error' && !state.field ? (
            <Notice tone="danger">{state.message}</Notice>
          ) : null}
          <Button type="submit" size="lg" loading={pending} className="w-full">
            {pending ? copy.sending : copy.sendLink}
          </Button>
        </form>
      )}

      <div className="flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-caption text-text-muted">{copy.or}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithProvider} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        <Button
          type="submit"
          name="provider"
          value="apple"
          variant="secondary"
          size="lg"
          className="w-full"
        >
          {copy.withApple}
        </Button>
        <Button
          type="submit"
          name="provider"
          value="google"
          variant="secondary"
          size="lg"
          className="w-full"
        >
          {copy.withGoogle}
        </Button>
      </form>
    </div>
  );
}
