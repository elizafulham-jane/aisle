import type { AisleClient } from '@aisle/db';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

/**
 * Request context. `supabase` is always a client scoped to the caller's own JWT (or anon),
 * so Row Level Security applies to every query made through it. Server code never uses the
 * service-role key for user requests.
 */
export interface Context {
  supabase: AisleClient;
  userId: string | null;
  /** Correlates logs for one request. */
  requestId: string;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Field-level validation messages for forms; never leak internals.
        zodError: error.cause instanceof ZodError ? error.cause.issues : null,
      },
    };
  },
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign in to continue.' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

/** Map a Postgres/PostgREST error to a tRPC error without exposing details. */
export function dbError(error: { code?: string; message: string }): TRPCError {
  if (error.code === '42501')
    return new TRPCError({ code: 'FORBIDDEN', message: 'You don’t have access to that.' });
  if (error.code === '23505')
    return new TRPCError({ code: 'CONFLICT', message: 'That already exists.' });
  if (error.code === '23514' || error.code === '22P02')
    return new TRPCError({ code: 'BAD_REQUEST', message: 'Some details aren’t valid.' });
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong.',
    cause: error,
  });
}
