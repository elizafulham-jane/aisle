'use server';

import { TRPCError } from '@trpc/server';
import { revalidatePath } from 'next/cache';
import { serverApi } from '@/lib/api';

export type CreateWeddingState =
  | { status: 'idle' }
  | { status: 'created' }
  | { status: 'error'; message: string; field?: 'partnerAName' | 'partnerBName' };

export async function createWedding(
  _prev: CreateWeddingState,
  formData: FormData,
): Promise<CreateWeddingState> {
  const partnerAName = String(formData.get('partnerAName') ?? '').trim();
  const partnerBName = String(formData.get('partnerBName') ?? '').trim();
  const currency = String(formData.get('currency') ?? 'GBP');
  if (!partnerAName) {
    return { status: 'error', field: 'partnerAName', message: 'Enter your name' };
  }

  try {
    const api = await serverApi();
    await api.wedding.create({
      partnerAName,
      ...(partnerBName ? { partnerBName } : {}),
      currency,
      timezone: currency === 'AUD' ? 'Australia/Sydney' : 'Europe/London',
      locale: currency === 'AUD' ? 'en-AU' : 'en-GB',
    });
  } catch (err) {
    const message = err instanceof TRPCError ? err.message : 'Something went wrong.';
    return { status: 'error', message };
  }
  revalidatePath('/app');
  return { status: 'created' };
}
