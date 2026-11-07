-- Guests: households, guests, per-event invitations, meal options, custom questions, RSVPs.
-- Guests never log in. Their access (Phase 1) goes through server code that verifies a
-- household token and calls narrow security-definer functions.

create table public.households (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 200),
  address jsonb not null default '{}',
  invite_code text not null unique default upper(encode(extensions.gen_random_bytes(5), 'hex')),
  token_hash text unique,
  notes text,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index households_wedding_idx on public.households (wedding_id) where deleted_at is null;

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  first_name text not null check (length(first_name) between 1 and 100),
  last_name text check (length(last_name) <= 100),
  email extensions.citext,
  phone text,
  side text not null default 'both' check (side in ('a', 'b', 'both')),
  list text not null default 'A' check (list in ('A', 'B')),
  age_group text not null default 'adult' check (age_group in ('adult', 'child', 'infant')),
  tags text[] not null default '{}',
  dietary text[] not null default '{}',
  allergies text,
  accessibility text,
  plus_one_allowed boolean not null default false,
  plus_one_of uuid references public.guests (id) on delete cascade,
  is_unnamed_plus_one boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- Children: store only what is needed (no date of birth, no contact details).
  check (age_group = 'adult' or (email is null and phone is null)),
  check (plus_one_of is null or plus_one_of <> id)
);

create index guests_wedding_idx on public.guests (wedding_id) where deleted_at is null;
create index guests_household_idx on public.guests (household_id);
create unique index guests_one_plus_one_idx on public.guests (plus_one_of) where plus_one_of is not null and deleted_at is null;

create table public.invitations (
  household_id uuid not null references public.households (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (household_id, event_id)
);

create index invitations_event_idx on public.invitations (event_id);

create table public.meal_options (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  description text,
  for_children boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.rsvp_questions (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  prompt text not null check (length(prompt) between 1 and 300),
  kind text not null default 'text' check (kind in ('text', 'single_choice', 'multi_choice', 'yes_no')),
  options jsonb not null default '[]',
  per_guest boolean not null default true,
  required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.rsvps (
  guest_id uuid not null references public.guests (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  status text not null default 'awaiting' check (status in ('awaiting', 'attending', 'declined')),
  meal_option_id uuid references public.meal_options (id) on delete set null,
  dietary_notes text,
  song_request text check (length(song_request) <= 200),
  answers jsonb not null default '{}',
  responded_at timestamptz,
  source text not null default 'couple' check (source in ('guest', 'couple', 'import')),
  updated_at timestamptz not null default now(),
  primary key (guest_id, event_id)
);

create index rsvps_event_status_idx on public.rsvps (event_id, status);

-- Keep wedding_id on child rows consistent with their parents (RLS relies on it).
create or replace function app_private.check_guest_wedding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.households h where h.id = new.household_id and h.wedding_id = new.wedding_id
  ) then
    raise exception 'guest.wedding_id must match its household' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger guests_wedding_consistent before insert or update of household_id, wedding_id on public.guests
  for each row execute function app_private.check_guest_wedding();

create or replace function app_private.check_event_child_wedding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.events e where e.id = new.event_id and e.wedding_id = new.wedding_id
  ) then
    raise exception '%.wedding_id must match its event', tg_table_name using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger invitations_wedding_consistent before insert or update on public.invitations
  for each row execute function app_private.check_event_child_wedding();
create trigger meal_options_wedding_consistent before insert or update on public.meal_options
  for each row execute function app_private.check_event_child_wedding();
create trigger rsvps_wedding_consistent before insert or update on public.rsvps
  for each row execute function app_private.check_event_child_wedding();

create trigger households_updated_at before update on public.households
  for each row execute function app_private.set_updated_at();
create trigger guests_updated_at before update on public.guests
  for each row execute function app_private.set_updated_at();
create trigger rsvps_updated_at before update on public.rsvps
  for each row execute function app_private.set_updated_at();

alter table public.households enable row level security;
alter table public.guests enable row level security;
alter table public.invitations enable row level security;
alter table public.meal_options enable row level security;
alter table public.rsvp_questions enable row level security;
alter table public.rsvps enable row level security;

-- All guest tables are governed by the 'guests' module.
do $$
declare
  t text;
begin
  foreach t in array array['households', 'guests', 'invitations', 'meal_options', 'rsvp_questions', 'rsvps'] loop
    execute format(
      'create policy %1$s_select on public.%1$I for select to authenticated
         using ((select app_private.has_wedding_access(wedding_id, ''guests'', ''view'')))', t);
    execute format(
      'create policy %1$s_insert on public.%1$I for insert to authenticated
         with check ((select app_private.has_wedding_access(wedding_id, ''guests'', ''edit'')))', t);
    execute format(
      'create policy %1$s_update on public.%1$I for update to authenticated
         using ((select app_private.has_wedding_access(wedding_id, ''guests'', ''edit'')))
         with check ((select app_private.has_wedding_access(wedding_id, ''guests'', ''edit'')))', t);
    execute format(
      'create policy %1$s_delete on public.%1$I for delete to authenticated
         using ((select app_private.has_wedding_access(wedding_id, ''guests'', ''edit'')))', t);
  end loop;
end;
$$;

-- Meal options and RSVP questions are also needed by anyone who can see events.
create policy meal_options_select_events on public.meal_options
  for select to authenticated using ((select app_private.has_wedding_access(wedding_id, 'events', 'view')));

create trigger households_audit after insert or update or delete on public.households
  for each row execute function app_private.audit_row();
create trigger guests_audit after insert or update or delete on public.guests
  for each row execute function app_private.audit_row();
