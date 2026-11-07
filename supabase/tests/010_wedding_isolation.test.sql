-- Phase 0 acceptance: user A cannot read or write wedding B (and vice versa), and
-- anonymous callers see nothing.
begin;
\ir _helpers/helpers.psql

select plan(32);

-- Setup ----------------------------------------------------------------------
select tests.create_user('alice@example.test') as alice \gset
select tests.create_user('bob@example.test') as bob \gset

select tests.authenticate_as(:'alice');
select public.create_wedding('Alice', 'Sam', 'GBP', 'Europe/London', 'en-GB') as wedding_a \gset
select tests.authenticate_as(:'bob');
select public.create_wedding('Bob', 'Jo', 'AUD', 'Australia/Sydney', 'en-AU') as wedding_b \gset

-- Fill wedding B with data as its owner.
select tests.authenticate_as(:'bob');
insert into public.events (wedding_id, kind, name, timezone)
  values (:'wedding_b', 'ceremony', 'Ceremony', 'Australia/Sydney') returning id as event_b \gset
insert into public.households (wedding_id, display_name)
  values (:'wedding_b', 'The Smiths') returning id as household_b \gset
insert into public.guests (household_id, wedding_id, first_name)
  values (:'household_b', :'wedding_b', 'Pat') returning id as guest_b \gset
insert into public.invitations (household_id, event_id, wedding_id) values (:'household_b', :'event_b', :'wedding_b');
insert into public.rsvps (guest_id, event_id, wedding_id) values (:'guest_b', :'event_b', :'wedding_b');
insert into public.tasks (wedding_id, title, offset_days)
  values (:'wedding_b', 'Book venue', -365) returning id as task_b \gset
insert into public.budget_categories (wedding_id, name) values (:'wedding_b', 'Venue') returning id as category_b \gset
insert into public.budget_items (wedding_id, category_id, name, currency, estimated_minor)
  values (:'wedding_b', :'category_b', 'Venue hire', 'AUD', 1200000) returning id as item_b \gset
insert into public.wedding_vendors (wedding_id, name) values (:'wedding_b', 'Bob''s Florist') returning id as wv_b \gset

-- Alice: reads ---------------------------------------------------------------
select tests.authenticate_as(:'alice');

select is((select count(*)::int from public.weddings), 1, 'A sees only her own wedding');
select is((select count(*)::int from public.weddings where id = :'wedding_b'), 0, 'A cannot read wedding B');
select is((select count(*)::int from public.wedding_members where wedding_id = :'wedding_b'), 0, 'A cannot read B members');
select is((select count(*)::int from public.events where wedding_id = :'wedding_b'), 0, 'A cannot read B events');
select is((select count(*)::int from public.households where wedding_id = :'wedding_b'), 0, 'A cannot read B households');
select is((select count(*)::int from public.guests where wedding_id = :'wedding_b'), 0, 'A cannot read B guests');
select is((select count(*)::int from public.invitations where wedding_id = :'wedding_b'), 0, 'A cannot read B invitations');
select is((select count(*)::int from public.rsvps where wedding_id = :'wedding_b'), 0, 'A cannot read B RSVPs');
select is((select count(*)::int from public.tasks where wedding_id = :'wedding_b'), 0, 'A cannot read B tasks');
select is((select count(*)::int from public.budget_items where wedding_id = :'wedding_b'), 0, 'A cannot read B budget');
select is((select count(*)::int from public.wedding_vendors where wedding_id = :'wedding_b'), 0, 'A cannot read B vendors');
select is((select count(*)::int from public.profiles where id = :'bob'), 0, 'A cannot read B profile');
select is((select count(*)::int from public.audit_log), 0, 'A cannot read the audit log');

-- Alice: writes into wedding B are rejected ------------------------------------
select throws_ok(
  format($$insert into public.events (wedding_id, kind, name, timezone) values (%L, 'custom', 'x', 'UTC')$$, :'wedding_b'),
  '42501', null, 'A cannot insert events into B');
select throws_ok(
  format($$insert into public.households (wedding_id, display_name) values (%L, 'x')$$, :'wedding_b'),
  '42501', null, 'A cannot insert households into B');
select throws_ok(
  format($$insert into public.tasks (wedding_id, title, offset_days) values (%L, 'x', 0)$$, :'wedding_b'),
  '42501', null, 'A cannot insert tasks into B');
select throws_ok(
  format($$insert into public.budget_categories (wedding_id, name) values (%L, 'x')$$, :'wedding_b'),
  '42501', null, 'A cannot insert budget categories into B');
select throws_ok(
  format($$insert into public.wedding_members (wedding_id, user_id, role) values (%L, %L, 'editor')$$, :'wedding_b', :'alice'),
  '42501', null, 'A cannot add herself to B');
select throws_ok(
  format($$insert into public.member_invites (wedding_id, token_hash, role) values (%L, 'x', 'editor')$$, :'wedding_b'),
  '42501', null, 'A cannot create invites for B');

-- Updates and deletes silently match zero rows under RLS.
select is_empty(format($$update public.weddings set partner_a_name = 'hacked' where id = %L returning id$$, :'wedding_b'),
  'A cannot update wedding B');
select is_empty(format($$update public.guests set first_name = 'hacked' where id = %L returning id$$, :'guest_b'),
  'A cannot update B guests');
select is_empty(format($$update public.rsvps set status = 'declined' where guest_id = %L returning guest_id$$, :'guest_b'),
  'A cannot update B RSVPs');
select is_empty(format($$update public.budget_items set estimated_minor = 1 where id = %L returning id$$, :'item_b'),
  'A cannot update B budget items');
select is_empty(format($$delete from public.tasks where id = %L returning id$$, :'task_b'),
  'A cannot delete B tasks');
select is_empty(format($$delete from public.wedding_vendors where id = %L returning id$$, :'wv_b'),
  'A cannot delete B vendors');

-- A cannot smuggle a row into her wedding that points at B's parent.
select tests.authenticate_as(:'alice');
select throws_ok(
  format($$insert into public.guests (household_id, wedding_id, first_name) values (%L, %L, 'x')$$, :'household_b', :'wedding_a'),
  '23514', null, 'A cannot attach a guest to B''s household via her own wedding_id');

-- Data is still intact for B --------------------------------------------------
select tests.authenticate_as(:'bob');
select is((select partner_a_name from public.weddings where id = :'wedding_b'), 'Bob', 'B wedding unchanged');
select is((select count(*)::int from public.tasks where wedding_id = :'wedding_b'), 1, 'B task still exists');
select is((select count(*)::int from public.weddings where id = :'wedding_a'), 0, 'B cannot read wedding A');

-- Anonymous callers see nothing ----------------------------------------------
select tests.authenticate_as_anon();
select is((select count(*)::int from public.weddings), 0, 'anon cannot read weddings');
select is((select count(*)::int from public.guests), 0, 'anon cannot read guests');
select throws_ok(
  $$select public.create_wedding('x')$$,
  '42501', null, 'anon cannot create a wedding');

select * from finish();
rollback;
