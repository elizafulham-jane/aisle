'use client';

import { Button, Notice, TextField } from '@aisle/ui/web';
import { useActionState } from 'react';
import { createWedding, type CreateWeddingState } from './actions';

export interface CreateWeddingCopy {
  partnerA: string;
  partnerB: string;
  partnerBHint: string;
  currency: string;
  submit: string;
  created: string;
}

export function CreateWeddingForm({
  copy,
  defaultCurrency,
}: {
  copy: CreateWeddingCopy;
  defaultCurrency: 'GBP' | 'AUD';
}) {
  const [state, action, pending] = useActionState<CreateWeddingState, FormData>(createWedding, {
    status: 'idle',
  });

  return (
    <form action={action} className="flex max-w-md flex-col gap-5" noValidate>
      <TextField
        label={copy.partnerA}
        name="partnerAName"
        autoComplete="given-name"
        required
        maxLength={100}
        {...(state.status === 'error' && state.field === 'partnerAName'
          ? { error: state.message }
          : {})}
      />
      <TextField
        label={copy.partnerB}
        hint={copy.partnerBHint}
        name="partnerBName"
        maxLength={100}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="currency" className="text-small font-medium">
          {copy.currency}
        </label>
        <select
          id="currency"
          name="currency"
          defaultValue={defaultCurrency}
          className="min-h-11 rounded-control border border-border-strong bg-surface px-3 text-body"
        >
          <option value="GBP">£ GBP</option>
          <option value="AUD">$ AUD</option>
        </select>
      </div>
      {state.status === 'error' && !state.field ? (
        <Notice tone="danger">{state.message}</Notice>
      ) : null}
      {state.status === 'created' ? <Notice tone="success">{copy.created}</Notice> : null}
      <Button type="submit" size="lg" loading={pending} className="self-start">
        {copy.submit}
      </Button>
    </form>
  );
}
