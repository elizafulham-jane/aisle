-- Plans, entitlements and feature flags (pricing and gating without code changes),
-- consent records, privacy requests.

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9_]+$'),
  audience text not null check (audience in ('vendor', 'couple')),
  name text not null,
  description text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index plans_one_default_per_audience on public.plans (audience) where is_default;

-- One row per entitlement a plan grants. value is JSON so limits and booleans share a table:
--   {"enabled": true} or {"limit": 5}
create table public.plan_entitlements (
  plan_id uuid not null references public.plans (id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9_.]+$'),
  value jsonb not null,
  primary key (plan_id, key)
);

-- Per-account overrides (e.g. a vendor given an extra feature by support).
create table public.entitlement_overrides (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors (id) on delete cascade,
  wedding_id uuid references public.weddings (id) on delete cascade,
  key text not null,
  value jsonb not null,
  expires_at timestamptz,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  check ((vendor_id is null) <> (wedding_id is null))
);

-- Kill switches and rollouts that server code (and RLS, where needed) can read.
create table public.feature_flags (
  key text primary key check (key ~ '^[a-z0-9_.]+$'),
  description text,
  enabled boolean not null default false,
  rules jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  subject_ref text,
  kind text not null check (kind in ('terms', 'privacy', 'marketing', 'cookies_analytics', 'autocharge', 'ai_features')),
  granted boolean not null,
  version text not null,
  source text,
  created_at timestamptz not null default now(),
  check (user_id is not null or subject_ref is not null)
);

create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email extensions.citext,
  kind text not null check (kind in ('export', 'delete', 'guest_removal')),
  wedding_id uuid references public.weddings (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'rejected')),
  notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create trigger feature_flags_updated_at before update on public.feature_flags
  for each row execute function app_private.set_updated_at();

alter table public.plans enable row level security;
alter table public.plan_entitlements enable row level security;
alter table public.entitlement_overrides enable row level security;
alter table public.feature_flags enable row level security;
alter table public.consents enable row level security;
alter table public.privacy_requests enable row level security;

create policy plans_select on public.plans for select to anon, authenticated using (is_active);
create policy plan_entitlements_select on public.plan_entitlements for select to anon, authenticated using (true);
create policy plans_write_finance on public.plans for all to authenticated
  using ((select app_private.is_staff(array['finance'])))
  with check ((select app_private.is_staff(array['finance'])));
create policy plan_entitlements_write_finance on public.plan_entitlements for all to authenticated
  using ((select app_private.is_staff(array['finance'])))
  with check ((select app_private.is_staff(array['finance'])));

create policy entitlement_overrides_select on public.entitlement_overrides for select to authenticated
  using (
    (vendor_id is not null and (select app_private.has_vendor_role(vendor_id, 'staff')))
    or (wedding_id is not null and (select app_private.is_wedding_member(wedding_id)))
    or (select app_private.is_staff(array['support']))
  );
create policy entitlement_overrides_write_staff on public.entitlement_overrides for all to authenticated
  using ((select app_private.is_staff(array['support'])))
  with check ((select app_private.is_staff(array['support'])));

create policy feature_flags_select on public.feature_flags for select to anon, authenticated using (true);
create policy feature_flags_write_super on public.feature_flags for all to authenticated
  using ((select app_private.is_staff(array['super_admin'])))
  with check ((select app_private.is_staff(array['super_admin'])));

create policy consents_select_own on public.consents for select to authenticated
  using (user_id = (select auth.uid()) or (select app_private.is_staff(array['support'])));
create policy consents_insert_own on public.consents for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy privacy_requests_select on public.privacy_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select app_private.is_staff(array['support'])));
create policy privacy_requests_insert_own on public.privacy_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'open');
create policy privacy_requests_update_staff on public.privacy_requests for update to authenticated
  using ((select app_private.is_staff(array['support'])))
  with check ((select app_private.is_staff(array['support'])));

create trigger plan_entitlements_audit after insert or update or delete on public.plan_entitlements
  for each row execute function app_private.audit_row();
create trigger feature_flags_audit after insert or update or delete on public.feature_flags
  for each row execute function app_private.audit_row();

-- Resolve an entitlement for a vendor: override > active plan > default plan.
-- (Subscriptions arrive in Phase 2; until then every vendor is on the default plan.)
create or replace function public.vendor_entitlement(p_vendor_id uuid, p_key text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select o.value from public.entitlement_overrides o
      where o.vendor_id = p_vendor_id and o.key = p_key
        and (o.expires_at is null or o.expires_at > now())
      order by o.created_at desc limit 1),
    (select pe.value from public.plans p
      join public.plan_entitlements pe on pe.plan_id = p.id
      where p.audience = 'vendor' and p.is_default and pe.key = p_key)
  )
  where app_private.has_vendor_role(p_vendor_id, 'staff') or app_private.is_staff(array['support']);
$$;

revoke all on function public.vendor_entitlement(uuid, text) from public, anon;
grant execute on function public.vendor_entitlement(uuid, text) to authenticated;
