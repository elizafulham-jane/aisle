import { weddingRouter } from './routers/wedding';
import { authedProcedure, createCallerFactory, dbError, publicProcedure, router } from './trpc';

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true as const })),

  me: authedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('profiles')
      .select('id, display_name, locale, timezone')
      .eq('id', ctx.userId)
      .single();
    if (error) throw dbError(error);
    return data;
  }),

  wedding: weddingRouter,
});

export type AppRouter = typeof appRouter;

/** Call procedures directly from server code (Server Components, actions, jobs). */
export const createCaller = createCallerFactory(appRouter);
