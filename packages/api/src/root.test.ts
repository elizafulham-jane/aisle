import type { AisleClient } from '@aisle/db';
import { describe, expect, it } from 'vitest';
import { createCaller } from './root';

const unusedClient = new Proxy(
  {},
  {
    get() {
      throw new Error('database should not be touched');
    },
  },
) as unknown as AisleClient;

describe('appRouter', () => {
  it('answers health checks without auth', async () => {
    const caller = createCaller({ supabase: unusedClient, userId: null, requestId: 't' });
    await expect(caller.health()).resolves.toEqual({ ok: true });
  });

  it('rejects signed-out callers before touching the database', async () => {
    const caller = createCaller({ supabase: unusedClient, userId: null, requestId: 't' });
    await expect(caller.me()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(caller.wedding.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('validates input before calling the database', async () => {
    const caller = createCaller({ supabase: unusedClient, userId: 'u1', requestId: 't' });
    await expect(caller.wedding.create({ partnerAName: '' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });
});
