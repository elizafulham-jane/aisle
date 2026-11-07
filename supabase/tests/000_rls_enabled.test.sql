-- Every table in the public schema must have Row Level Security enabled.
begin;
\ir _helpers/helpers.psql

select plan(2);

select is(
  (select array_agg(c.relname order by c.relname)
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity),
  null::name[],
  'all public tables have RLS enabled'
);

-- Helper functions must not be reachable through the API schema.
select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('has_wedding_access', 'module_access', 'is_staff')),
  0,
  'permission helpers live outside the public schema'
);

select * from finish();
rollback;
