-- Identity: profiles (1:1 with auth.users), internal staff roles, audit log.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_path text,
  locale text not null default 'en-GB',
  timezone public.iana_timezone,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function app_private.set_updated_at();

-- Create a profile whenever an auth user is created.
create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app_private.handle_new_user();

-- Internal staff (admin console). Separate from wedding/vendor memberships.
create table public.staff_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('super_admin', 'support', 'moderator', 'finance')),
  granted_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function app_private.is_staff(p_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_roles s
    where s.user_id = auth.uid()
      and (p_roles is null or s.role = any (p_roles) or s.role = 'super_admin')
  );
$$;

-- Append-only audit log for sensitive tables. Written only by triggers / server code.
create table public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  actor_role text,
  action text not null,
  table_name text not null,
  row_id text,
  wedding_id uuid,
  vendor_id uuid,
  old_data jsonb,
  new_data jsonb,
  via_view_as boolean not null default false
);

create index audit_log_wedding_idx on public.audit_log (wedding_id, occurred_at desc);
create index audit_log_vendor_idx on public.audit_log (vendor_id, occurred_at desc);
create index audit_log_table_row_idx on public.audit_log (table_name, row_id);

create or replace function app_private.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
begin
  insert into public.audit_log (actor_id, actor_role, action, table_name, row_id, wedding_id, vendor_id, old_data, new_data, via_view_as)
  values (
    auth.uid(),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    lower(tg_op),
    tg_table_name,
    v_row ->> 'id',
    nullif(v_row ->> 'wedding_id', '')::uuid,
    nullif(v_row ->> 'vendor_id', '')::uuid,
    v_old,
    v_new,
    coalesce(current_setting('app.view_as', true), '') = 'on'
  );
  return coalesce(new, old);
end;
$$;

alter table public.profiles enable row level security;
alter table public.staff_roles enable row level security;
alter table public.audit_log enable row level security;

-- Profiles: everyone reads their own; co-members read each other (policy added after
-- memberships exist, see weddings migration). Users update only their own row.
create policy profiles_select_self on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_select_staff on public.profiles
  for select to authenticated using ((select app_private.is_staff(array['support'])));

create policy staff_roles_select_self on public.staff_roles
  for select to authenticated using (user_id = (select auth.uid()) or (select app_private.is_staff(array['super_admin'])));
create policy staff_roles_write_super on public.staff_roles
  for all to authenticated
  using ((select app_private.is_staff(array['super_admin'])))
  with check ((select app_private.is_staff(array['super_admin'])));

-- Audit log: readable by super admins and support only; never writable through the API.
create policy audit_log_select_staff on public.audit_log
  for select to authenticated using ((select app_private.is_staff(array['support'])));

revoke insert, update, delete on public.audit_log from anon, authenticated;

create trigger staff_roles_audit after insert or update or delete on public.staff_roles
  for each row execute function app_private.audit_row();
