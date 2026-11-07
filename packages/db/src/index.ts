import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type { Database, Json } from './database.types';

/** Supabase client typed against our schema. */
export type AisleClient = SupabaseClient<Database>;

type PublicSchema = Database['public'];

/** Row type of a public table, e.g. `Tables<'guests'>`. */
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
/** Insert shape of a public table. */
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];
/** Update shape of a public table. */
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];
