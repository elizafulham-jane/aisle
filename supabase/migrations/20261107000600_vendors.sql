-- Vendors v1: categories, businesses, team members, listings (basic), and the couple's
-- "My vendors" list (on-platform or manually added). Packages, media, availability,
-- enquiries, quotes and bookings arrive in Phase 2.

create table public.vendor_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9_]+$'),
  name text not null,
  parent_id uuid references public.vendor_categories (id),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 150),
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{0,78}[a-z0-9])?$'),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  currency public.currency_code not null,
  email extensions.citext,
  phone text,
  website_url text,
  -- VAT / GST registration shown on invoices; no tax rules are hard-coded.
  tax_label text,
  tax_number text,
  tax_rate_bps integer check (tax_rate_bps between 0 and 10000),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendor_members (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (vendor_id, user_id)
);

create index vendor_members_user_idx on public.vendor_members (user_id) where deleted_at is null;

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  category_id uuid not null references public.vendor_categories (id),
  title text not null check (length(title) between 1 and 150),
  summary text check (length(summary) <= 300),
  description text,
  status text not null default 'draft' check (status in ('draft', 'pending', 'published', 'suspended')),
  base_place_id uuid references public.places (id),
  base_location extensions.geography(Point, 4326),
  service_radius_km integer check (service_radius_km between 0 and 20000),
  currency public.currency_code not null,
  price_from_minor public.money_minor,
  price_to_minor public.money_minor,
  capacity_min integer check (capacity_min >= 0),
  capacity_max integer check (capacity_max >= 0),
  style_tags text[] not null default '{}',
  is_sponsored boolean not null default false,
  published_at timestamptz,
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(summary, '')), 'B')
    || setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (price_to_minor is null or price_from_minor is null or price_to_minor >= price_from_minor)
);

create index listings_search_idx on public.listings using gin (search);
create index listings_location_idx on public.listings using gist (base_location);
create index listings_category_status_idx on public.listings (category_id, status);

-- The couple's vendor list (Module 9). listing_id is null for vendors added manually.
create table public.wedding_vendors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  category_id uuid references public.vendor_categories (id),
  name text not null check (length(name) between 1 and 150),
  stage text not null default 'researching'
    check (stage in ('researching', 'contacted', 'quote_received', 'quote_accepted', 'booked', 'paid_in_full', 'dropped')),
  contact_name text,
  email extensions.citext,
  phone text,
  website_url text,
  agreed_total_minor public.money_minor,
  currency public.currency_code,
  notes text,
  is_shortlisted boolean not null default false,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (agreed_total_minor is null or currency is not null)
);

create index wedding_vendors_wedding_idx on public.wedding_vendors (wedding_id, stage) where deleted_at is null;

alter table public.tasks
  add constraint tasks_wedding_vendor_fk foreign key (wedding_vendor_id)
  references public.wedding_vendors (id) on delete set null;
alter table public.budget_items
  add constraint budget_items_wedding_vendor_fk foreign key (wedding_vendor_id)
  references public.wedding_vendors (id) on delete set null;

create trigger vendors_updated_at before update on public.vendors
  for each row execute function app_private.set_updated_at();
create trigger listings_updated_at before update on public.listings
  for each row execute function app_private.set_updated_at();
create trigger wedding_vendors_updated_at before update on public.wedding_vendors
  for each row execute function app_private.set_updated_at();

------------------------------------------------------------------------------
-- Helpers
------------------------------------------------------------------------------

create or replace function app_private.vendor_role_rank(p_vendor_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case vm.role when 'owner' then 3 when 'manager' then 2 when 'staff' then 1 else 0 end
    from public.vendor_members vm
    where vm.vendor_id = p_vendor_id and vm.user_id = auth.uid() and vm.deleted_at is null
  ), 0);
$$;

create or replace function app_private.has_vendor_role(p_vendor_id uuid, p_min text default 'staff')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.vendor_role_rank(p_vendor_id)
    >= case p_min when 'owner' then 3 when 'manager' then 2 else 1 end;
$$;

create or replace function app_private.vendor_is_public(p_vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.vendors v
    join public.listings l on l.vendor_id = v.id
    where v.id = p_vendor_id and v.status = 'active' and l.status = 'published'
  );
$$;

-- Only staff may publish or suspend a listing, or change a vendor's verification/status.
-- Security invoker on purpose: current_user must be the API role, not the owner.
create or replace function app_private.guard_listing_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' or new.status is distinct from old.status)
     and new.status in ('published', 'suspended')
     and not app_private.is_staff(array['moderator'])
     and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'Only the moderation team can publish or suspend listings' using errcode = '42501';
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger listings_guard_status before insert or update on public.listings
  for each row execute function app_private.guard_listing_status();

-- Security invoker on purpose: current_user must be the API role, not the owner.
create or replace function app_private.guard_vendor_admin_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or app_private.is_staff(array['moderator']) then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.verification_status := 'unverified';
    new.status := 'active';
  elsif new.status is distinct from old.status
     or (new.verification_status is distinct from old.verification_status
         and not (old.verification_status in ('unverified', 'rejected') and new.verification_status = 'pending')) then
    raise exception 'Only the moderation team can change vendor status or verification' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger vendors_guard_admin_fields before insert or update on public.vendors
  for each row execute function app_private.guard_vendor_admin_fields();

-- Create a vendor business and make the caller its owner.
create or replace function public.create_vendor(
  p_name text,
  p_slug text,
  p_country_code text,
  p_currency text
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
  insert into public.vendors (name, slug, country_code, currency, created_by)
  values (p_name, p_slug, p_country_code, p_currency, v_user)
  returning id into v_id;
  insert into public.vendor_members (vendor_id, user_id, role) values (v_id, v_user, 'owner');
  return v_id;
end;
$$;

revoke all on function public.create_vendor(text, text, text, text) from public, anon;
grant execute on function public.create_vendor(text, text, text, text) to authenticated;

------------------------------------------------------------------------------
-- RLS
------------------------------------------------------------------------------

alter table public.vendor_categories enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_members enable row level security;
alter table public.listings enable row level security;
alter table public.wedding_vendors enable row level security;

create policy vendor_categories_select on public.vendor_categories
  for select to anon, authenticated using (is_active or (select app_private.is_staff(array['support'])));
create policy vendor_categories_write_staff on public.vendor_categories
  for all to authenticated
  using ((select app_private.is_staff(array['support'])))
  with check ((select app_private.is_staff(array['support'])));

create policy vendors_select_public on public.vendors
  for select to anon, authenticated using ((select app_private.vendor_is_public(id)));
create policy vendors_select_member on public.vendors
  for select to authenticated
  using ((select app_private.has_vendor_role(id, 'staff')) or (select app_private.is_staff(array['support'])));
create policy vendors_update on public.vendors
  for update to authenticated
  using ((select app_private.has_vendor_role(id, 'manager')) or (select app_private.is_staff(array['moderator'])))
  with check ((select app_private.has_vendor_role(id, 'manager')) or (select app_private.is_staff(array['moderator'])));

create policy vendor_members_select on public.vendor_members
  for select to authenticated using ((select app_private.has_vendor_role(vendor_id, 'staff')));
create policy vendor_members_write_owner on public.vendor_members
  for all to authenticated
  using ((select app_private.has_vendor_role(vendor_id, 'owner')))
  with check ((select app_private.has_vendor_role(vendor_id, 'owner')));

create policy listings_select_public on public.listings
  for select to anon, authenticated using (status = 'published');
create policy listings_select_member on public.listings
  for select to authenticated
  using ((select app_private.has_vendor_role(vendor_id, 'staff')) or (select app_private.is_staff(array['moderator'])));
create policy listings_write_manager on public.listings
  for all to authenticated
  using ((select app_private.has_vendor_role(vendor_id, 'manager')) or (select app_private.is_staff(array['moderator'])))
  with check ((select app_private.has_vendor_role(vendor_id, 'manager')) or (select app_private.is_staff(array['moderator'])));

create policy wedding_vendors_select on public.wedding_vendors
  for select to authenticated using ((select app_private.has_wedding_access(wedding_id, 'vendors', 'view')));
create policy wedding_vendors_write on public.wedding_vendors
  for all to authenticated
  using ((select app_private.has_wedding_access(wedding_id, 'vendors', 'edit')))
  with check ((select app_private.has_wedding_access(wedding_id, 'vendors', 'edit')));

create trigger vendor_members_audit after insert or update or delete on public.vendor_members
  for each row execute function app_private.audit_row();
create trigger vendors_audit after update on public.vendors
  for each row execute function app_private.audit_row();
