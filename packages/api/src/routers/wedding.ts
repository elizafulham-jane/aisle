import { createWeddingSchema } from '@aisle/validation';
import { authedProcedure, dbError, router } from '../trpc';

export const weddingRouter = router({
  /** Weddings the caller is a member of, with their role. RLS limits the rows. */
  list: authedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('wedding_members')
      .select(
        'role, wedding:weddings(id, partner_a_name, partner_b_name, date_mode, date_start, currency, status)',
      )
      .eq('user_id', ctx.userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    if (error) throw dbError(error);
    return data.flatMap((row) => (row.wedding ? [{ role: row.role, ...row.wedding }] : []));
  }),

  create: authedProcedure.input(createWeddingSchema).mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase.rpc('create_wedding', {
      p_partner_a_name: input.partnerAName,
      ...(input.partnerBName ? { p_partner_b_name: input.partnerBName } : {}),
      p_currency: input.currency,
      p_timezone: input.timezone,
      p_locale: input.locale,
    });
    if (error) throw dbError(error);
    return { id: data };
  }),
});
