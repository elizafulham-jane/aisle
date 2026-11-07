-- Weddings, memberships with per-module permissions, collaborator invites, places, events.

create table public.places (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique,
  name text not null,
  formatted_address text,
  country_code text check (country_code ~ '^[A-Z]{2}$'),
  location extensions.geography(Point, 4326),
  timezone public.iana_timezone,
  created_at timestamptz not null default now()
);

create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  slug text unique check (slug ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$'),
  partner_a_name text not null check (length(partner_a_name) between 1 and 100),
  partner_b_name text check (length(partner_b_name) between 1 and 100),
  date_mode text not null default 'unset' check (date_mode in ('exact', 'range', 'unset')),
  date_start date,
  date_end date,
  timezone public.iana_timezone not null default 'UTC',
  place_id uuid references public.places (id),
  location_label text,
  est_guest_count integer check (est_guest_count between 0 and 5000),
  total_budget_minor public.money_minor,
  currency public.currency_code not null default 'GBP',
  locale text not null default 'en-GB',
  style_tags text[] not null default '{}',
  priorities text[] not null default '{}',
  palette jsonb not null default '{}',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weddings_date_mode_consistent check (
    (date_mode = 'unset' and date_start is null and date_end is null)
    or (date_mode = 'exact' and date_start is not null and date_end is null)
    or (date_mode = 'range' and date_start is not null and date_end is not null and date_end >= date_start)
  )
);

create trigger weddings_updated_at before update on public.weddings
  for each row execute function app_private.set_updated_at();

create table public.wedding_members (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'contributor', 'viewer')),
  relation text not null default 'other'
    check (relation in ('partner', 'planner', 'family', 'wedding_party', 'friend', 'other')),
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (wedding_id, user_id)
);

create index wedding_members_user_idx on public.wedding_members (user_id) where deleted_at is null;

create trigger wedding_members_updated_at before update on public.wedding_members
  for each row execute function app_private.set_updated_at();

-- Modules that can be shown or hidden per member.
create table public.member_module_access (
  member_id uuid not null references public.wedding_members (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  module text not null check (module in (
    'wedding', 'events', 'guests', 'tasks', 'budget', 'vendors',
    'website', 'documents', 'seating', 'messages', 'timeline'
  )),
  access text not null check (access in ('none', 'view', 'edit')),
  primary key (member_id, module)
);

create table public.member_invites (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  token_hash text not null unique,
  email extensions.citext,
  phone text,
  role text not null check (role in ('owner', 'editor', 'contributor', 'viewer')),
  relation text not null default 'other'
    check (relation in ('partner', 'planner', 'family', 'wedding_party', 'friend', 'other')),
  module_access jsonb not null default '{}',
  invited_by uuid not null references auth.users (id) default auth.uid(),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_by uuid references auth.users (id),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  kind text not null check (kind in (
    'ceremony', 'reception', 'rehearsal_dinner', 'welcome_drinks',
    'after_party', 'farewell_brunch', 'custom'
  )),
  name text not null check (length(name) between 1 and 120),
  starts_at timestamptz,
  ends_at timestamptz,
  timezone public.iana_timezone not null,
  place_id uuid references public.places (id),
  venue_label text,
  dress_code text,
  is_private boolean not null default false,
  rsvp_deadline timestamptz,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create index events_wedding_idx on public.events (wedding_id, starts_at);

create trigger events_updated_at before update on public.events
  for each row execute function app_private.set_updated_at();

------------------------------------------------------------------------------
-- Permission helpers (security definer so policies can call them without recursion).
------------------------------------------------------------------------------

-- Access level as an integer: none=0, view=1, edit=2. NULL in, NULL out (no override).
create or replace function app_private.access_rank(p_access text)
returns integer
language sql
immutable
strict
as $$
  select case p_access when 'edit' then 2 when 'view' then 1 else 0 end;
$$;

-- Effective access the current user has to one module of one wedding.
--   owner        -> edit everywhere (overrides ignored)
--   editor       -> edit unless an override lowers it
--   viewer       -> view unless an override lowers it (overrides cannot raise above view)
--   contributor  -> none unless an override grants it; assigned tasks handled in task policies
--   'members'    -> only owners may manage memberships and invites
create or replace function app_private.module_access(p_wedding_id uuid, p_module text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case
      when m.role = 'owner' then 2
      when p_module = 'members' then 1
      when m.role = 'editor' then least(2, coalesce(app_private.access_rank(a.access), 2))
      when m.role = 'viewer' then least(1, coalesce(app_private.access_rank(a.access), 1))
      when m.role = 'contributor' then coalesce(app_private.access_rank(a.access), 0)
      else 0
    end
    from public.wedding_members m
    left join public.member_module_access a
      on a.member_id = m.id and a.module = p_module
    where m.wedding_id = p_wedding_id
      and m.user_id = auth.uid()
      and m.deleted_at is null
    limit 1
  ), 0);
$$;

create or replace function app_private.has_wedding_access(
  p_wedding_id uuid,
  p_module text,
  p_min text default 'view'
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.module_access(p_wedding_id, p_module) >= app_private.access_rank(p_min);
$$;

create or replace function app_private.is_wedding_member(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.wedding_members m
    where m.wedding_id = p_wedding_id and m.user_id = auth.uid() and m.deleted_at is null
  );
$$;

create or replace function app_private.member_id_for(p_wedding_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.id from public.wedding_members m
  where m.wedding_id = p_wedding_id and m.user_id = auth.uid() and m.deleted_at is null
  limit 1;
$$;

-- Two people share at least one active wedding (used to show co-member profiles).
create or replace function app_private.shares_wedding_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_members me
    join public.wedding_members them on them.wedding_id = me.wedding_id
    where me.user_id = auth.uid() and me.deleted_at is null
      and them.user_id = p_user_id and them.deleted_at is null
  );
$$;

------------------------------------------------------------------------------
-- Integrity rules for memberships.
------------------------------------------------------------------------------

-- At most two owners per wedding, and never zero once created.
create or replace function app_private.enforce_owner_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wedding uuid := coalesce(new.wedding_id, old.wedding_id);
  v_owners integer;
begin
  select count(*) into v_owners
  from public.wedding_members
  where wedding_id = v_wedding and role = 'owner' and deleted_at is null;

  if v_owners > 2 then
    raise exception 'A wedding can have at most two owners' using errcode = 'check_violation';
  end if;
  if v_owners = 0 and exists (select 1 from public.weddings where id = v_wedding) then
    raise exception 'A wedding must keep at least one owner' using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create constraint trigger wedding_members_owner_rules
  after insert or update or delete on public.wedding_members
  deferrable initially deferred
  for each row execute function app_private.enforce_owner_rules();

------------------------------------------------------------------------------
-- RPCs
------------------------------------------------------------------------------

-- Create a wedding and make the caller its first owner in one transaction.
create or replace function public.create_wedding(
  p_partner_a_name text,
  p_partner_b_name text default null,
  p_currency text default 'GBP',
  p_timezone text default 'UTC',
  p_locale text default 'en-GB'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  insert into public.weddings (partner_a_name, partner_b_name, currency, timezone, locale, created_by)
  values (p_partner_a_name, p_partner_b_name, p_currency, p_timezone, p_locale, v_user)
  returning id into v_id;

  insert into public.wedding_members (wedding_id, user_id, role, relation)
  values (v_id, v_user, 'owner', 'partner');

  return v_id;
end;
$$;

revoke all on function public.create_wedding(text, text, text, text, text) from public, anon;
grant execute on function public.create_wedding(text, text, text, text, text) to authenticated;

-- Accept a collaborator invite using the raw token from the invite link.
create or replace function public.accept_member_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_invite public.member_invites;
  v_member_id uuid;
  v_module text;
  v_access text;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select * into v_invite
  from public.member_invites
  where token_hash = app_private.hash_token(p_token)
  for update;

  if v_invite.id is null
     or v_invite.revoked_at is not null
     or v_invite.accepted_at is not null
     or v_invite.expires_at < now() then
    raise exception 'Invite is invalid or has expired' using errcode = 'P0002';
  end if;

  insert into public.wedding_members (wedding_id, user_id, role, relation, invited_by)
  values (v_invite.wedding_id, v_user, v_invite.role, v_invite.relation, v_invite.invited_by)
  on conflict (wedding_id, user_id) do update
    set role = excluded.role, relation = excluded.relation, deleted_at = null
  returning id into v_member_id;

  for v_module, v_access in select key, value #>> '{}' from jsonb_each(v_invite.module_access) loop
    insert into public.member_module_access (member_id, wedding_id, module, access)
    values (v_member_id, v_invite.wedding_id, v_module, v_access)
    on conflict (member_id, module) do update set access = excluded.access;
  end loop;

  update public.member_invites
  set accepted_by = v_user, accepted_at = now()
  where id = v_invite.id;

  return v_invite.wedding_id;
end;
$$;

revoke all on function public.accept_member_invite(text) from public, anon;
grant execute on function public.accept_member_invite(text) to authenticated;

------------------------------------------------------------------------------
-- Row Level Security
------------------------------------------------------------------------------

alter table public.places enable row level security;
alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;
alter table public.member_module_access enable row level security;
alter table public.member_invites enable row level security;
alter table public.events enable row level security;

-- Places are a shared cache of public venue data.
create policy places_select on public.places for select to authenticated using (true);
create policy places_insert on public.places for insert to authenticated with check (true);

-- Weddings: created only through create_wedding(); members read; 'wedding' editors update.
create policy weddings_select_member on public.weddings
  for select to authenticated using ((select app_private.is_wedding_member(id)));
create policy weddings_select_staff on public.weddings
  for select to authenticated using ((select app_private.is_staff(array['support'])));
create policy weddings_update on public.weddings
  for update to authenticated
  using ((select app_private.has_wedding_access(id, 'wedding', 'edit')))
  with check ((select app_private.has_wedding_access(id, 'wedding', 'edit')));

-- Memberships: co-members can see who is on the wedding; only owners manage them;
-- non-owners may remove themselves.
create policy members_select on public.wedding_members
  for select to authenticated using ((select app_private.is_wedding_member(wedding_id)));
create policy members_insert_owner on public.wedding_members
  for insert to authenticated
  with check ((select app_private.has_wedding_access(wedding_id, 'members', 'edit')));
create policy members_update_owner on public.wedding_members
  for update to authenticated
  using ((select app_private.has_wedding_access(wedding_id, 'members', 'edit')))
  with check ((select app_private.has_wedding_access(wedding_id, 'members', 'edit')));
create policy members_delete_owner_or_self on public.wedding_members
  for delete to authenticated
  using (
    (select app_private.has_wedding_access(wedding_id, 'members', 'edit'))
    or (user_id = (select auth.uid()) and role <> 'owner')
  );

create policy module_access_select on public.member_module_access
  for select to authenticated using ((select app_private.is_wedding_member(wedding_id)));
create policy module_access_write_owner on public.member_module_access
  for all to authenticated
  using ((select app_private.has_wedding_access(wedding_id, 'members', 'edit')))
  with check ((select app_private.has_wedding_access(wedding_id, 'members', 'edit')));

create policy invites_owner on public.member_invites
  for all to authenticated
  using ((select app_private.has_wedding_access(wedding_id, 'members', 'edit')))
  with check ((select app_private.has_wedding_access(wedding_id, 'members', 'edit')));

create policy events_select on public.events
  for select to authenticated using ((select app_private.has_wedding_access(wedding_id, 'events', 'view')));
create policy events_write on public.events
  for all to authenticated
  using ((select app_private.has_wedding_access(wedding_id, 'events', 'edit')))
  with check ((select app_private.has_wedding_access(wedding_id, 'events', 'edit')));

-- Co-members can see each other's display names.
create policy profiles_select_comember on public.profiles
  for select to authenticated using ((select app_private.shares_wedding_with(id)));

-- Audit sensitive tables.
create trigger wedding_members_audit after insert or update or delete on public.wedding_members
  for each row execute function app_private.audit_row();
create trigger member_module_access_audit after insert or update or delete on public.member_module_access
  for each row execute function app_private.audit_row();
create trigger member_invites_audit after insert or update or delete on public.member_invites
  for each row execute function app_private.audit_row();
