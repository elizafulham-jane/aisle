-- Plan entitlements come from data, so changing what a plan includes needs no code change.
begin;
\ir _helpers/helpers.psql

select plan(5);

select tests.create_user('dj@example.test') as dj \gset
select tests.create_user('other@example.test') as other \gset
select tests.create_user('support@example.test') as support \gset

select tests.authenticate_as(:'dj');
select public.create_vendor('Night Owl DJs', 'night-owl-djs', 'GB', 'GBP') as v \gset

select is(public.vendor_entitlement(:'v', 'listings.max'), '{"limit": 1}'::jsonb,
  'new vendor gets the default (free) plan limit');

-- Change the plan's data only: the vendor's entitlement follows.
select tests.clear_authentication();
update public.plan_entitlements set value = '{"limit": 2}'
where key = 'listings.max' and plan_id = (select id from public.plans where key = 'vendor_free');

select tests.authenticate_as(:'dj');
select is(public.vendor_entitlement(:'v', 'listings.max'), '{"limit": 2}'::jsonb,
  'editing plan data changes the entitlement without code');

-- Support grants a one-off override.
select tests.clear_authentication();
insert into public.staff_roles (user_id, role) values (:'support', 'support');
select tests.authenticate_as(:'support');
insert into public.entitlement_overrides (vendor_id, key, value) values (:'v', 'analytics.enabled', '{"enabled": true}');

select tests.authenticate_as(:'dj');
select is(public.vendor_entitlement(:'v', 'analytics.enabled'), '{"enabled": true}'::jsonb,
  'per-vendor override wins over the plan');

-- Vendors cannot grant themselves overrides, and others cannot read them.
select throws_ok(
  format($$insert into public.entitlement_overrides (vendor_id, key, value) values (%L, 'listings.max', '{"limit": 99}')$$, :'v'),
  '42501', null, 'vendor cannot self-grant entitlements');

select tests.authenticate_as(:'other');
select is(public.vendor_entitlement(:'v', 'listings.max'), null, 'outsiders cannot read another vendor''s entitlements');

select * from finish();
rollback;
