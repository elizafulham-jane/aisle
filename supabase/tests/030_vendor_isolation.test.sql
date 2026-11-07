-- Vendor businesses are isolated from each other; only moderators publish listings;
-- the public sees only published listings.
begin;
\ir _helpers/helpers.psql

select plan(13);

select tests.create_user('florist@example.test') as florist \gset
select tests.create_user('baker@example.test') as baker \gset
select tests.create_user('mod@example.test') as moderator \gset

select tests.clear_authentication();
insert into public.staff_roles (user_id, role) values (:'moderator', 'moderator');
select id as cat from public.vendor_categories where key = 'florists' \gset

select tests.authenticate_as(:'florist');
select public.create_vendor('Petal & Stem', 'petal-and-stem', 'GB', 'GBP') as v_florist \gset
insert into public.listings (vendor_id, category_id, title, currency)
  values (:'v_florist', :'cat', 'Wedding flowers', 'GBP') returning id as l_florist \gset

select tests.authenticate_as(:'baker');
select public.create_vendor('Crumb Co', 'crumb-co', 'AU', 'AUD') as v_baker \gset

-- Isolation between vendors.
select is((select count(*)::int from public.vendors where id = :'v_florist'), 0, 'baker cannot read unpublished florist');
select is((select count(*)::int from public.listings where id = :'l_florist'), 0, 'baker cannot read draft listing');
select is_empty(format($$update public.listings set title = 'x' where id = %L returning id$$, :'l_florist'),
  'baker cannot edit florist listing');
select throws_ok(
  format($$insert into public.listings (vendor_id, category_id, title, currency) values (%L, %L, 'x', 'GBP')$$, :'v_florist', :'cat'),
  '42501', null, 'baker cannot create listings for florist');
select throws_ok(
  format($$insert into public.vendor_members (vendor_id, user_id, role) values (%L, %L, 'owner')$$, :'v_florist', :'baker'),
  '42501', null, 'baker cannot join florist team');

-- Vendors cannot self-publish or self-verify.
select tests.authenticate_as(:'florist');
select throws_ok(
  format($$update public.listings set status = 'published' where id = %L$$, :'l_florist'),
  '42501', null, 'vendor cannot publish own listing');
select lives_ok(
  format($$update public.listings set status = 'pending' where id = %L$$, :'l_florist'),
  'vendor can submit listing for review');
select throws_ok(
  format($$update public.vendors set verification_status = 'verified' where id = %L$$, :'v_florist'),
  '42501', null, 'vendor cannot verify itself');

-- Anonymous visitors see nothing until approval.
select tests.authenticate_as_anon();
select is((select count(*)::int from public.listings), 0, 'anon sees no unpublished listings');

-- Moderator approves.
select tests.authenticate_as(:'moderator');
select isnt_empty(format($$update public.listings set status = 'published' where id = %L returning id$$, :'l_florist'),
  'moderator can publish');

select tests.authenticate_as_anon();
select is((select count(*)::int from public.listings), 1, 'anon sees published listing');
select is((select count(*)::int from public.vendors), 1, 'anon sees vendor with a published listing');
select is((select count(*)::int from public.vendor_members), 0, 'anon cannot see vendor team');

select * from finish();
rollback;
