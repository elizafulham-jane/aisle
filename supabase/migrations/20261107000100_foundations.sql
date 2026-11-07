-- Foundations: extensions, private helper schema, shared domains and triggers.
-- Conventions (see docs/DECISIONS.md):
--   * Money: bigint minor units + currency_code. Never numeric/float.
--   * Time: timestamptz (UTC). Wall-clock display uses an IANA zone stored per wedding/event.
--   * Status-like columns are text + CHECK (easier to evolve than Postgres enums).
--   * Every table in public has RLS enabled (asserted by supabase/tests/000_rls_enabled.test.sql).

create extension if not exists postgis with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- Helper functions live in a schema PostgREST does not expose.
create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated, service_role;

-- ISO 4217 currency code.
create domain public.currency_code as text
  check (value ~ '^[A-Z]{3}$');

-- IANA time zone name (format check; values validated against Intl in the app layer).
create domain public.iana_timezone as text
  check (value ~ '^[A-Za-z_]+(/[A-Za-z0-9_+\-]+){0,2}$' or value = 'UTC');

-- Non-negative integer money amount in minor units.
create domain public.money_minor as bigint
  check (value >= 0);

-- updated_at maintenance.
create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- created_by defaulting from the JWT subject.
create or replace function app_private.set_created_by()
returns trigger
language plpgsql
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

-- Hash helper for invite tokens and household access tokens (tokens are never stored raw).
create or replace function app_private.hash_token(p_token text)
returns text
language sql
immutable
strict
as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;
